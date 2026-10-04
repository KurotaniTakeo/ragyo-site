#!/usr/bin/env node
/**
 * 字族子集化管线。
 *
 * 站点引入 6 套 CJK 字族（日语 / 简体 / 繁体的 sans + serif）。@fontsource 的可变
 * 字族只有按 unicode-range 切好的分片、没有完整字体文件，而分片粒度对本站文本太粗：
 * 实测每个语言页首访仍会拉 2.8–4.0MB 字体。本脚本改为「完整可变字体 → 只保留页面
 * 实际用到的码位」的整字体子集化，每语言每字族产出单个 woff2。
 *
 * 完整字体按 scripts/fonts.sources.json 下载（google/fonts，revision 固定 + sha256
 * 校验），缓存于 node_modules/.cache/ragyo-fonts/，缺失或损坏时才联网。子集化用
 * subset-font（HarfBuzz 的 WASM 封装），纯 Node，无需 Python。
 *
 * 码位集合按语言取（见 scripts/fonts.lib.mjs）：正文来自 i18n JSON，跨语言共享的
 * 标题 / 人名等来自 src 下的字符串字面量（经 TypeScript AST 提取，**不含代码注释**），
 * 再补 ASCII 与安全标点。en 单独出子集。
 *
 * 产物使用内容哈希文件名（woff2 与 CSS 皆是），并写出 src/data/fonts.generated.ts
 * 供 App.vue 引用；任何文本或字族变化都会换 URL，长缓存不会命中旧子集。
 *
 * 增量：把「码位集合 + 源字体 revision/sha256 + 生成器版本」的指纹写入
 * public/fonts/.gen-stamp；指纹未变且产物齐全时直接跳过（--refresh 强制重建）。
 *
 * 用法：
 *   pnpm gen:fonts            增量（缓存 + 指纹跳过）
 *   pnpm gen:fonts --refresh  强制重建并重新下载完整字体
 *   pnpm gen:fonts --offline  只用缓存，缺失即失败（离线/CI 可选）
 * 输出：public/fonts/files/*.woff2、public/fonts/*.css、src/data/fonts.generated.ts
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fontkit from 'fontkit'
import subsetFont from 'subset-font'
import { LOCALES, codePointsByLocale } from './fonts.lib.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public/fonts')
const FILES_DIR = join(OUT_DIR, 'files')
const CACHE_DIR = join(ROOT, 'node_modules/.cache/ragyo-fonts')
const MANIFEST_TS = join(ROOT, 'src/data/fonts.generated.ts')
// 指纹放缓存目录而非 public/，避免被 Vite 复制进 dist。
const STAMP = join(CACHE_DIR, 'fonts.gen-stamp')
const SOURCES = JSON.parse(readFileSync(join(ROOT, 'scripts/fonts.sources.json'), 'utf8'))

/** 改动生成逻辑（会影响输出字节）时递增，使指纹失效 */
const GENERATOR_VERSION = 1

const args = process.argv.slice(2)
const refresh = args.includes('--refresh')
const offline = args.includes('--offline')

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

/* ------------------------------------------------------- 完整字体：下载与缓存 */

/** 取一份完整字体：命中缓存且校验通过就直接用，否则（非离线）下载并校验。 */
async function resolveSource(entry) {
  const dest = join(CACHE_DIR, entry.file)
  if (!refresh && existsSync(dest)) {
    const buf = readFileSync(dest)
    if (sha256(buf) === entry.sha256) return buf
    console.log(`⚠ 缓存校验失败，重新下载：${entry.file}`)
  }
  if (offline) {
    throw new Error(`离线模式但缺少可用缓存：${dest}（去掉 --offline 或先联网跑一次）`)
  }
  const url = `${SOURCES.baseUrl}/${SOURCES.revision}/${entry.path}`
  console.log(`↓ ${entry.file}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`下载失败 ${res.status}：${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const got = sha256(buf)
  if (got !== entry.sha256) {
    throw new Error(
      `sha256 不匹配：${entry.file}\n  期望 ${entry.sha256}\n  实际 ${got}\n` +
        'google/fonts 内容已变（revision 应已固定）或下载损坏；确认后更新 scripts/fonts.sources.json。',
    )
  }
  mkdirSync(CACHE_DIR, { recursive: true })
  writeFileSync(dest, buf)
  return buf
}

/* ------------------------------------------------------------------- 子集化 */

const codePointsByLocaleMap = codePointsByLocale(ROOT)
const fingerprint = sha256(
  Buffer.from(
    JSON.stringify({
      v: GENERATOR_VERSION,
      revision: SOURCES.revision,
      sources: SOURCES.sources.map((s) => s.sha256),
      codePoints: codePointsByLocaleMap,
    }),
  ),
)

/** 指纹未变且产物齐全时跳过，避免每次 build 重算子集 */
function upToDate() {
  if (refresh || !existsSync(STAMP)) return false
  let stamp
  try {
    stamp = JSON.parse(readFileSync(STAMP, 'utf8'))
  } catch {
    return false
  }
  if (stamp.fingerprint !== fingerprint) return false
  return Array.isArray(stamp.files) && stamp.files.every((rel) => existsSync(join(ROOT, rel)))
}

if (upToDate()) {
  console.log('✔ 字体子集未变化，跳过（--refresh 可强制重建）')
  process.exit(0)
}

// 预取各源字体并做覆盖校验，避免子集化后静默缺字（跨语言字形差异允许回退系统字体）。
const sourceBuf = new Map()
const coverage = new Map()
async function ensureSource(entry) {
  if (sourceBuf.has(entry.file)) return
  const buf = await resolveSource(entry)
  sourceBuf.set(entry.file, buf)
  const font = fontkit.openSync(join(CACHE_DIR, entry.file))
  const hasGlyph =
    typeof font.hasGlyphForCodePoint === 'function'
      ? (cp) => font.hasGlyphForCodePoint(cp)
      : (() => {
          const set = new Set(font.characterSet)
          return (cp) => set.has(cp)
        })()
  coverage.set(entry.file, hasGlyph)
}

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(FILES_DIR, { recursive: true })

let totalBytes = 0
const written = []
const manifest = {}

for (const [locale, cfg] of Object.entries(LOCALES)) {
  const codePoints = codePointsByLocaleMap[locale]
  const text = String.fromCodePoint(...codePoints)
  const faces = []
  for (const family of ['sans', 'serif']) {
    const entry = SOURCES.sources.find((s) => s.file === cfg.files[family])
    if (!entry) throw new Error(`fonts.sources.json 缺少字体：${cfg.files[family]}`)
    await ensureSource(entry)

    // 该字族缺少的码位（如日文字族没有简体专用字形）由系统字体兜底，仅提示不报错。
    const missing = codePoints.filter((cp) => !coverage.get(entry.file)(cp))
    if (missing.length) {
      const sample = missing.slice(0, 12).map((c) => `U+${c.toString(16).toUpperCase()}`).join(' ')
      console.log(`  · ${cfg.files[family]} 缺 ${missing.length} 个码位（回退系统字体）：${sample}${missing.length > 12 ? ' …' : ''}`)
    }

    const subset = await subsetFont(sourceBuf.get(entry.file), text, {
      targetFormat: 'woff2',
      noHinting: true,
    })
    const hash = sha256(subset).slice(0, 8)
    const outName = `${locale}-${family}-${hash}.woff2`
    writeFileSync(join(FILES_DIR, outName), subset)
    totalBytes += subset.length
    written.push([outName, subset.length])
    faces.push(
      `@font-face{font-family:'${cfg.families[family]}';font-style:normal;font-display:swap;` +
        `font-weight:100 900;src:url(/fonts/files/${outName}) format('woff2')}`,
    )
  }
  const css =
    '/* 自动生成，请勿手动编辑。由 scripts/gen-fonts.mjs 从完整 Noto CJK 可变字体子集化生成。 */\n' +
    faces.join('\n') +
    '\n'
  const cssName = `${locale}-${sha256(Buffer.from(css)).slice(0, 8)}.css`
  writeFileSync(join(OUT_DIR, cssName), css, 'utf8')
  manifest[locale] = `/fonts/${cssName}`
  console.log(`✔ ${locale}: ${codePoints.length} 码位（CJK ${codePoints.filter((c) => c >= 0x2e80).length}）`)
}

// 供 App.vue 引用的哈希化路径清单（与 assets.generated.ts 同为提交入库的派生物）。
const ts = `/* 此文件由 scripts/gen-fonts.mjs 自动生成，请勿手动编辑。 */

/** 语言 → 该语言页要挂载的字族样式表（路径含内容哈希，可长缓存） */
export const FONT_STYLESHEET = ${JSON.stringify(manifest, null, 2)} as const
`
writeFileSync(MANIFEST_TS, ts, 'utf8')

// 记录本次产物与指纹，供下次增量跳过。
mkdirSync(CACHE_DIR, { recursive: true })
const stampFiles = [
  ...written.map(([name]) => join('public/fonts/files', name)),
  ...Object.values(manifest).map((p) => join('public', p)),
  'src/data/fonts.generated.ts',
]
writeFileSync(STAMP, JSON.stringify({ fingerprint, files: stampFiles }, null, 2) + '\n', 'utf8')

console.log('')
for (const [name, size] of written) {
  console.log(`✔ fonts/files/${name.padEnd(28)} ${(size / 1024).toFixed(0)} KB`)
}
console.log(`\n✔ 已写入 public/fonts：${written.length} 个 woff2，合计 ${(totalBytes / 1048576).toFixed(2)} MB；${Object.keys(LOCALES).length} 份 CSS + src/data/fonts.generated.ts`)
