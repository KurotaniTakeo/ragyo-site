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
 * 用法：pnpm gen:images
 * 输出：public/img/generated/*.webp|*.avif、src/data/assets.generated.ts
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS = join(ROOT, 'assets')
const manifest = JSON.parse(readFileSync(join(ROOT, 'scripts/assets.manifest.json'), 'utf8'))
const outDir = join(ROOT, manifest.outputDir)

/** 站点 surface 色（与 m3-tokens.css 的 --md-sys-color-surface 一致），
    用于把透明立绘合成到背景上，避免透明区域露出模糊剪影。 */
const SURFACE = '#131316'

/**
 * public/ 下的站点绝对路径前缀。
 * 注意去掉 "public" 后必须以单个 "/" 开头：若再补一个前导斜杠会拼出
 * "//img/..."，浏览器会当成协议相对 URL（https://img/...）而请求失败，
 * 结果是只显示 LQIP 占位图，看起来「很糊」。
 */
const PUBLIC_PREFIX = `/${manifest.outputDir.replace(/^public\/?/, '')}`

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const slugify = (key) => key.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')

const generated = {}
let totalBytes = 0

for (const entry of manifest.entries) {
  const sourcePath = join(ASSETS, entry.source)
  const meta = await sharp(sourcePath, { limitInputPixels: false }).metadata()
  const slug = slugify(entry.key)

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
  generated[entry.key] = {
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
    `✔ ${entry.key.padEnd(24)} ${meta.width}×${meta.height}${cropNote} → ${variants.length} 档 ` +
      `(${variants.map((v) => v.width).join('/')}) · webp+avif`,
  )
}

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
writeFileSync(join(ROOT, 'src/data/assets.generated.ts'), ts, 'utf8')

console.log(`\n✔ 派生图像总计 ${(totalBytes / 1048576).toFixed(2)} MB`)
console.log(`✔ 已写入 ${join(manifest.outputDir)} 与 src/data/assets.generated.ts`)
