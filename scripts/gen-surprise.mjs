#!/usr/bin/env node
/**
 * 彩蛋素材管线：将 assets/illustration/surprise/*.gif 转为 MP4（H.264）。
 *
 * GIF 共 19 个、500×500、合计 33.6MB，其中最大单文件 3.2MB / 90 帧。
 * 直接放上页面会严重拖慢加载，因此统一转码：
 *   - H.264 + yuv420p：iOS / macOS / Android / Chrome / Firefox / Safari 全兼容
 *     （WebM/VP9 在旧版 Safari 上不可用，故以 MP4 为准）
 *   - 原 GIF 带透明通道（pix_fmt bgra），先合成到站点 surface 色 #505678 上，
 *     否则透明区域会在播放时变成黑块或白块
 *   - 实测 1.62MB → 68KB，约 1/24
 *
 * 用法：pnpm gen:surprise [--gpu]
 *   --gpu  用 NVIDIA NVENC（h264_nvenc）硬件编码；默认走 CPU（libx264）。
 *          当瓶颈在滤镜/解码而非编码时（如本项目 500×500 的小 GIF，实测 GPU 反而更慢、
 *          产物更大），CPU 更合适；--gpu 留给编码确实成为瓶颈的场景。
 *          检测不到可用 NVENC 时自动回退 libx264（无 N 卡 / 驱动不支持）。
 * 输出：public/surprise/generated/*.mp4、*-poster.webp、src/data/surprise.generated.ts
 */
import { readdirSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'assets/illustration/surprise')
const OUT_REL = 'public/surprise/generated'
const OUT = join(ROOT, OUT_REL)

/** 与 m3-tokens.css 的 surface 保持一致 */
const SURFACE = '0x505678'
/** public/ 下的站点绝对路径前缀；必须以单个 "/" 开头，否则浏览器会当成协议相对 URL */
const PUBLIC_PREFIX = `/${OUT_REL.replace(/^public\/?/, '')}`
const MAX_FPS = 30
const CRF = 26

/** --gpu：改用 NVENC 硬件编码（默认 CPU libx264）。 */
const useGpu = process.argv.includes('--gpu')

/**
 * 探测 h264_nvenc 是否真的可用。
 * 不能只查 `ffmpeg -encoders`：NVENC 编码器在编译进来后即使硬件不支持也会列出
 * （例如本机 av1_nvenc 会列出但报 "Codec not supported"），因此用一次极小试跑来判定。
 */
const hasNvenc = () => {
  try {
    execFileSync(
      'ffmpeg',
      [
        '-hide_banner', '-loglevel', 'error',
        '-f', 'lavfi', '-i', 'color=black:s=320x240:d=0.1',
        '-c:v', 'h264_nvenc', '-f', 'null', '-',
      ],
      { stdio: 'ignore' },
    )
    return true
  } catch {
    return false
  }
}

const gpu = useGpu && hasNvenc()
if (useGpu && !gpu) {
  console.warn('⚠ 未检测到可用的 h264_nvenc，回退到 libx264（CPU）。')
}

/** 视频编码参数：GPU 用 NVENC 恒定质量 VBR，CPU 用 libx264 CRF。 */
const videoEncoderArgs = gpu
  ? ['-c:v', 'h264_nvenc', '-preset', 'p5', '-rc', 'vbr', '-cq', String(CRF), '-b:v', '0', '-profile:v', 'high']
  : ['-c:v', 'libx264', '-profile:v', 'high', '-crf', String(CRF)]

const ff = (args) => {
  try {
    return execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })
  } catch (error) {
    const stderr = error.stderr?.length ? error.stderr.toString() : ''
    const tail = stderr.trim().split('\n').slice(-12).join('\n')
    throw new Error(`ffmpeg 执行失败（退出码 ${error.status}）\n参数：${args.join(' ')}\n${tail}`)
  }
}

const probe = (file) =>
  JSON.parse(
    execFileSync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-select_streams', 'v:0',
      file,
    ]).toString(),
  ).streams[0]

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const gifs = readdirSync(SRC)
  .filter((f) => f.toLowerCase().endsWith('.gif'))
  .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))

const items = []
let gifBytes = 0
let mp4Bytes = 0

for (const gif of gifs) {
  const id = gif.replace(/\.gif$/i, '')
  const input = join(SRC, gif)
  const stream = probe(input)

  const frames = Number(stream.nb_frames ?? 0)
  const duration = Number(stream.duration ?? 0)
  const naturalFps = duration > 0 && frames > 0 ? frames / duration : MAX_FPS
  const fps = Math.min(MAX_FPS, Math.round(naturalFps)) || MAX_FPS

  const mp4 = join(OUT, `${id}.mp4`)
  ff([
    '-y',
    '-i', input,
    '-filter_complex',
    `[0:v]fps=${fps},scale=${stream.width}:${stream.height}:flags=lanczos,format=yuva420p[fg];` +
      `color=c=${SURFACE}:s=${stream.width}x${stream.height}[bg];` +
      `[bg][fg]overlay=shortest=1,format=yuv420p[v]`,
    '-map', '[v]',
    ...videoEncoderArgs,
    '-r', String(fps),
    '-movflags', '+faststart',
    '-an',
    mp4,
  ])

  // 海报帧：取源 GIF 第一帧，按同一 surface 色合成后转 WebP。
  // （本机 ffmpeg 未编译 libwebp 编码器，故这一段交给 sharp 处理）
  const poster = `${id}-poster.webp`
  await sharp(input, { animated: false, limitInputPixels: false })
    .flatten({ background: `#${SURFACE.slice(2)}` })
    .webp({ quality: 80 })
    .toFile(join(OUT, poster))

  const inBytes = statSync(input).size
  const outBytes = statSync(mp4).size
  gifBytes += inBytes
  mp4Bytes += outBytes

  items.push({
    id,
    video: `${PUBLIC_PREFIX}/${id}.mp4`,
    poster: `${PUBLIC_PREFIX}/${poster}`,
    width: Number(stream.width),
    height: Number(stream.height),
    duration: Number(duration.toFixed(2)),
  })

  console.log(
    `✔ ${id.padStart(2, ' ')}  ${frames} 帧 / ${duration.toFixed(2)}s @${fps}fps  ` +
      `${(inBytes / 1048576).toFixed(2)}MB → ${(outBytes / 1024).toFixed(0)}KB`,
  )
}

const ts = `/* 此文件由 scripts/gen-surprise.mjs 自动生成，请勿手动编辑。 */

export interface SurpriseClip {
  id: string
  video: string
  poster: string
  width: number
  height: number
  duration: number
}

export const surpriseClips: SurpriseClip[] = ${JSON.stringify(items, null, 2)}
`

mkdirSync(join(ROOT, 'src/data'), { recursive: true })
writeFileSync(join(ROOT, 'src/data/surprise.generated.ts'), ts, 'utf8')

console.log(
  `\n✔ ${items.length} 个片段：${(gifBytes / 1048576).toFixed(1)}MB → ${(mp4Bytes / 1048576).toFixed(2)}MB ` +
    `(压缩至 ${((mp4Bytes / gifBytes) * 100).toFixed(1)}%)`,
)
console.log(`✔ 视频编码器：${gpu ? 'h264_nvenc（GPU）' : 'libx264（CPU）'}`)
