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
 * 码位集合按语言取：正文来自 i18n JSON，跨语言共享的标题 / 人名等来自 src 下的
 * 字符串字面量（经 TypeScript AST 提取，**不含代码注释**），再补 ASCII 与安全标点。
 * en 单独出子集（此前复用 ja，但 en 页字符远少于 ja，独立子集更小）。
 *
 * 用法：
 *   pnpm gen:fonts            使用缓存，缺失时下载
 *   pnpm gen:fonts --refresh  强制重新下载完整字体
 *   pnpm gen:fonts --offline  只用缓存，缺失即失败（离线/CI 可选）
 * 输出：public/fonts/<locale>.css、public/fonts/files/*.woff2
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fontkit from 'fontkit'
import subsetFont from 'subset-font'
import ts from 'typescript'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public/fonts')
const FILES_DIR = join(OUT_DIR, 'files')
const CACHE_DIR = join(ROOT, 'node_modules/.cache/ragyo-fonts')
const SOURCES = JSON.parse(readFileSync(join(ROOT, 'scripts/fonts.sources.json'), 'utf8'))

const args = process.argv.slice(2)
const refresh = args.includes('--refresh')
const offline = args.includes('--offline')

/**
 * 每个语言页 → 字族名（与 src/styles/main.css 的 --app-font-* 一致）、源字体文件名、
 * i18n 源文件。en 与 ja 同用日文字族，但码位集合不同，故各出各的子集。
 */
const LOCALES = {
  ja: {
    json: 'ja.json',
    files: { sans: 'noto-sans-jp.ttf', serif: 'noto-serif-jp.ttf' },
    families: { sans: 'Noto Sans JP Variable', serif: 'Noto Serif JP Variable' },
  },
  zh: {
    json: 'zh.json',
    files: { sans: 'noto-sans-sc.ttf', serif: 'noto-serif-sc.ttf' },
    families: { sans: 'Noto Sans SC Variable', serif: 'Noto Serif SC Variable' },
  },
  'zh-Hant': {
    json: 'zh-Hant.json',
    files: { sans: 'noto-sans-tc.ttf', serif: 'noto-serif-tc.ttf' },
    families: { sans: 'Noto Sans TC Variable', serif: 'Noto Serif TC Variable' },
  },
  en: {
    json: 'en.json',
    files: { sans: 'noto-sans-jp.ttf', serif: 'noto-serif-jp.ttf' },
    families: { sans: 'Noto Sans JP Variable', serif: 'Noto Serif JP Variable' },
  },
}

/* ------------------------------------------------------- 完整字体：下载与缓存 */

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

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

/* --------------------------------------------------------- 站点用到的码位集合 */

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

/** 用 TS 解析器抽出字符串字面量 / 模板字面量（自动排除注释与代码结构）。 */
function stringsFromTs(src) {
  const sf = ts.createSourceFile('x.ts', src, ts.ScriptTarget.Latest, true)
  const out = []
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) out.push(node.text)
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return out
}

/** JSON 的全部字符串值 */
function stringsFromJson(src) {
  const out = []
  const visit = (v) => {
    if (typeof v === 'string') out.push(v)
    else if (Array.isArray(v)) v.forEach(visit)
    else if (v && typeof v === 'object') Object.values(v).forEach(visit)
  }
  visit(JSON.parse(src))
  return out
}

/** 运行期拼装/格式化会用到、但正文未必出现的字符（千分位、全角标点等） */
const SAFETY = [
  0x00a0, 0x00b7, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x3000, 0x3001, 0x3002, 0x300a,
  0x300b, 0x3010, 0x3011, 0x30fb, 0xff01, 0xff08, 0xff09, 0xff0c, 0xff1a, 0xff1b, 0xff1f,
]

const addText = (set, text) => {
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp >= 0x20 && cp !== 0x7f) set.add(cp) // 跳过控制字符
  }
}

/** 跨语言共享的字符串（data / 组件脚本 / 模板 / index.html；不含 i18n JSON 与注释） */
function collectInvariant() {
  const set = new Set()
  for (const f of walk(join(ROOT, 'src'))) {
    const ext = extname(f).toLowerCase()
    const src = readFileSync(f, 'utf8')
    if (ext === '.ts') stringsFromTs(src).forEach((s) => addText(set, s))
    else if (ext === '.vue') {
      const script = src.match(/<script[^>]*>([\s\S]*?)<\/script>/)
      if (script) stringsFromTs(script[1]).forEach((s) => addText(set, s))
      const template = src.match(/<template[\s\S]*<\/template>/)
      if (template) addText(set, template[0])
    }
  }
  addText(set, readFileSync(join(ROOT, 'index.html'), 'utf8'))
  for (let c = 0x20; c <= 0x7e; c += 1) set.add(c)
  SAFETY.forEach((c) => set.add(c))
  return set
}

const invariant = collectInvariant()
/** 语言 → 该页需要渲染的全部码位（共享字面量 ∪ 该语言 i18n 正文） */
const codePointsByLocale = {}
for (const [locale, cfg] of Object.entries(LOCALES)) {
  const set = new Set(invariant)
  const jsonPath = join(ROOT, 'src/i18n/locales', cfg.json)
  stringsFromJson(readFileSync(jsonPath, 'utf8')).forEach((s) => addText(set, s))
  codePointsByLocale[locale] = [...set].sort((a, b) => a - b)
}

/* ------------------------------------------------------------------- 子集化 */

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

for (const [locale, cfg] of Object.entries(LOCALES)) {
  const codePoints = codePointsByLocale[locale]
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
    const outName = `${locale}-${family}.woff2`
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
  writeFileSync(join(OUT_DIR, `${locale}.css`), css, 'utf8')
  console.log(`✔ ${locale}: ${codePoints.length} 码位（CJK ${codePoints.filter((c) => c >= 0x2e80).length}）`)
}

console.log('')
for (const [name, size] of written) {
  console.log(`✔ fonts/files/${name.padEnd(20)} ${(size / 1024).toFixed(0)} KB`)
}
console.log(`\n✔ 已写入 public/fonts：${written.length} 个 woff2，合计 ${(totalBytes / 1048576).toFixed(2)} MB；${Object.keys(LOCALES).length} 份 CSS`)
