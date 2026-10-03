#!/usr/bin/env node
/**
 * 立绘派生管线。
 *
 * 立绘原稿（assets/illustration/character/*.png）单张可达 9927×14720（约 1.46 亿像素、
 * 7MB），直接进构建会拖垮打包体积与解码开销。本脚本按 scripts/assets.manifest.json
 * 的清单派生多档宽度的 WebP（回退）与 AVIF（首选），并生成带 LQIP 占位图的 TS 清单。
 *
 * 条目可选 `crop: { x, y, w, h }`（相对原图的比例）先做局部裁剪，
 * 例如首页主视觉用的「半身像」就是从全身立绘裁出上半身。
 *
 * 用法：
 *   pnpm gen:images                 全量：清空输出目录并重写整份 assets.generated.ts
 *   pnpm gen:images <关键词...>      只处理 key 命中关键词的条目（大小写不敏感，任一命中即可）
 *   pnpm gen:images --changed       只处理「源图比自身产物新，或产物/生成文件里缺该键」的条目
 *   pnpm gen:images --changed <关键词...>
 *                                   先按关键词取候选，再在其中只挑变动的
 *
 * 部分生成不会清空输出目录，只删除被选中条目自己的旧产物；assets.generated.ts 采用
 * 合并写入（保留未处理条目的键），因此可以安全地只重编一张图。
 *
 * 输出：public/img/generated/*.webp|*.avif、src/data/assets.generated.ts
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS = join(ROOT, 'assets')
const TS_FILE = join(ROOT, 'src/data/assets.generated.ts')
const manifest = JSON.parse(readFileSync(join(ROOT, 'scripts/assets.manifest.json'), 'utf8'))
const outDir = join(ROOT, manifest.outputDir)

/** 站点 surface 色（与 m3-tokens.css 的 --md-sys-color-surface 一致），
    用于把透明立绘合成到背景上，避免透明区域露出模糊剪影。 */
const SURFACE = '#505678'

/**
 * public/ 下的站点绝对路径前缀。
 * 注意去掉 "public" 后必须以单个 "/" 开头：若再补一个前导斜杠会拼出
 * "//img/..."，浏览器会当成协议相对 URL（https://img/...）而请求失败，
 * 结果是只显示 LQIP 占位图，看起来「很糊」。
 */
const PUBLIC_PREFIX = `/${manifest.outputDir.replace(/^public\/?/, '')}`

/* ----------------------------------------------------------- 命令行解析 */

/** 非选项参数视作 key 关键词过滤；--changed 只挑变动条目 */
const args = process.argv.slice(2)
const changedOnly = args.includes('--changed')
const filters = args.filter((a) => !a.startsWith('-')).map((a) => a.toLowerCase())
const full = filters.length === 0 && !changedOnly

const slugify = (key) => key.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** 只匹配「本条目自身」的产物：<slug>-<数字>.(webp|avif)。
    不能只用 startsWith(slug)，否则会误伤前缀相同的条目（如 …-costume-1 与 …-costume-1-bust）。 */
const outputRe = (slug) => new RegExp(`^${escapeRe(slug)}-\\d+\\.(?:webp|avif)$`)

/** 读取现有生成文件里的 images 映射（那段是合法 JSON），用于部分生成时合并保留其它键 */
const readExistingImages = () => {
  if (!existsSync(TS_FILE)) return null
  const text = readFileSync(TS_FILE, 'utf8')
  const start = text.indexOf('export const images = ')
  const end = text.indexOf(' as const satisfies Record<string, GeneratedImage>')
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(text.slice(start + 'export const images = '.length, end))
  } catch {
    return null
  }
}

// 全量才清空输出目录（顺手清掉清单里已删除条目的旧产物）；
// 部分生成保留其它条目的产物，只在该条目内删除自己的旧档位。
if (full) {
  rmSync(outDir, { recursive: true, force: true })
}
mkdirSync(outDir, { recursive: true })

const existing = full ? {} : readExistingImages()
if (!full && existing === null) {
  throw new Error(
    '无法解析 src/data/assets.generated.ts，部分生成需要先跑一次全量：pnpm gen:images',
  )
}

/* ----------------------------------------------- 清理已删除的条目 */

// 非全量时以清单为唯一事实来源：把「生成物里有、清单里已删除」的旧键连同其产物一并清掉。
// 这样删除条目不必再跑一次全量（全量会重编码所有立绘，很慢）。
if (!full) {
  const manifestKeys = new Set(manifest.entries.map((e) => e.key))
  const staleKeys = Object.keys(existing).filter((key) => !manifestKeys.has(key))
  if (staleKeys.length) {
    for (const key of staleKeys) {
      for (const file of readdirSync(outDir).filter((f) => outputRe(slugify(key)).test(f))) {
        rmSync(join(outDir, file), { force: true })
      }
      delete existing[key]
    }
    console.log(`→ 已清理 ${staleKeys.length} 个清单中不存在的旧条目：${staleKeys.join(', ')}`)
  }
}

/* ------------------------------------------------------------- 选取条目 */

let selected = manifest.entries
if (filters.length) {
  selected = selected.filter((e) => filters.some((f) => e.key.toLowerCase().includes(f)))
  if (selected.length === 0) {
    throw new Error(`没有 key 命中关键词：${filters.join(', ')}`)
  }
}

if (changedOnly) {
  const dirFiles = readdirSync(outDir)
  selected = selected.filter((entry) => {
    if (!(entry.key in existing)) return true
    const files = dirFiles.filter((f) => outputRe(slugify(entry.key)).test(f))
    if (files.length === 0) return true
    const newest = Math.max(...files.map((f) => statSync(join(outDir, f)).mtimeMs))
    return statSync(join(ASSETS, entry.source)).mtimeMs > newest
  })
  if (selected.length === 0) {
    // 不提前退出：即使本次没有要重编的条目，也要把上面清理过的映射写回生成文件。
    console.log('✔ 没有需要重新生成的条目（全部为最新）。')
  }
}

const scopeNote = full ? '全量' : `部分 ${selected.length}/${manifest.entries.length} 条`
console.log(`→ ${scopeNote}生成`)

/* --------------------------------------------------------------- 派生 */

const produced = {}
let totalBytes = 0

for (const entry of selected) {
  const sourcePath = join(ASSETS, entry.source)
  const meta = await sharp(sourcePath, { limitInputPixels: false }).metadata()
  const slug = slugify(entry.key)

  // 只重编本条目时，先清掉它自己的旧产物，避免改动 widths 后残留旧的档位。
  if (!full) {
    for (const f of readdirSync(outDir).filter((f) => outputRe(slug).test(f))) {
      rmSync(join(outDir, f), { force: true })
    }
  }

  // 可选裁剪：把比例换算成像素矩形，后续的档位与尺寸都以裁剪后的图像为准。
  const crop = entry.crop
    ? {
        left: Math.round(meta.width * entry.crop.x),
        top: Math.round(meta.height * entry.crop.y),
        width: Math.round(meta.width * entry.crop.w),
        height: Math.round(meta.height * entry.crop.h),
      }
    : null
  const outWidth = crop ? crop.width : meta.width

  /** 每次调用都返回一个全新的 sharp 管线（可安全复用同一裁剪区域） */
  const pipeline = () => {
    const img = sharp(sourcePath, { limitInputPixels: false })
    return crop ? img.extract(crop) : img
  }

  const ladder = entry.widths.filter((w) => w <= outWidth)
  if (ladder.length === 0) ladder.push(outWidth)

  const variants = []
  for (const width of ladder) {
    const base = `${slug}-${width}`

    // WebP：兼容性最好的默认格式，作为 <picture> 的回退。
    const webpFile = `${base}.webp`
    const webpInfo = await pipeline()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 85, effort: 6, smartSubsample: true })
      .toFile(join(outDir, webpFile))
    totalBytes += readFileSync(join(outDir, webpFile)).byteLength

    // AVIF：同尺寸下更小、细节更锐利，现代浏览器优先命中。
    const avifFile = `${base}.avif`
    const avifInfo = await pipeline()
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: 60, effort: 6 })
      .toFile(join(outDir, avifFile))
    totalBytes += readFileSync(join(outDir, avifFile)).byteLength

    variants.push({
      width: webpInfo.width,
      height: webpInfo.height,
      url: `${PUBLIC_PREFIX}/${webpFile}`,
      avifUrl: `${PUBLIC_PREFIX}/${avifFile}`,
    })

    // AVIF 与 WebP 的尺寸应当完全一致，若出现偏差说明编码异常。
    if (avifInfo.width !== webpInfo.width || avifInfo.height !== webpInfo.height) {
      throw new Error(`${entry.key} 第 ${width} 档 AVIF 尺寸与 WebP 不一致`)
    }
  }

  // LQIP：20px 宽的极低质量占位图，内联为 data URI，用于首屏渐进显示。
  // 合成到站点 surface 色上，避免透明区域在半透明叠层里露出模糊剪影。
  const lqipBuffer = await pipeline()
    .resize({ width: 20 })
    .flatten({ background: SURFACE })
    .webp({ quality: 40 })
    .toBuffer()

  const largest = variants[variants.length - 1]
  produced[entry.key] = {
    src: largest.url,
    srcset: variants.map((v) => `${v.url} ${v.width}w`).join(', '),
    avifSrcset: variants.map((v) => `${v.avifUrl} ${v.width}w`).join(', '),
    width: largest.width,
    height: largest.height,
    lqip: `data:image/webp;base64,${lqipBuffer.toString('base64')}`,
    note: entry.note ?? '',
  }

  const cropNote = crop ? ` [裁 ${crop.width}×${crop.height}]` : ''
  console.log(
    `✔ ${entry.key.padEnd(36)} ${meta.width}×${meta.height}${cropNote} → ${variants.length} 档 ` +
      `(${variants.map((v) => v.width).join('/')}) · webp+avif`,
  )
}

// 全量直接采用本次结果；部分生成则与现有映射合并（未处理的键原样保留）。
const generated = full ? produced : { ...existing, ...produced }

const ts = `/* 此文件由 scripts/gen-images.mjs 自动生成，请勿手动编辑。 */

export interface GeneratedImage {
  /** 最大尺寸版本，用作 src 与 OGP 兜底 */
  src: string
  /** WebP 回退 srcset */
  srcset: string
  /** AVIF 首选 srcset */
  avifSrcset: string
  width: number
  height: number
  /** 20px 宽的模糊占位图（data URI） */
  lqip: string
  note: string
}

export const images = ${JSON.stringify(generated, null, 2)} as const satisfies Record<string, GeneratedImage>

export type ImageKey = keyof typeof images
`

mkdirSync(join(ROOT, 'src/data'), { recursive: true })
writeFileSync(TS_FILE, ts, 'utf8')

console.log(`\n✔ ${scopeNote}：本次派生图像 ${(totalBytes / 1048576).toFixed(2)} MB`)
console.log(`✔ 已写入 ${join(manifest.outputDir)} 与 src/data/assets.generated.ts`)
