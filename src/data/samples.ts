/**
 * 试听音频数据。
 *
 * 待作者提供音频文件（放到 public/audio/）与曲目信息。
 * 在此之前 samples 保持空数组，Samples 区会渲染「试听准备中」的空态，
 * 而不是渲染一个不能播放的播放器。
 *
 * kind 区分两类素材：
 *   - demo：完整的演示曲
 *   - raw ：单一音阶的原音样本，用于展示各音域音色差异
 */
import type { Localized } from './voicebank'

export interface Sample {
  id: string
  /** 曲名 / 样本名，需要三语 */
  title: Localized
  /** 音频路径，例如 /audio/demo-01.mp3 */
  audio: string
  kind: 'demo' | 'raw'
  /** 曲目作者、原曲出处等，直接显示，通常为专有名词不需翻译 */
  credit?: string
  /** raw 类型样本对应的音阶，例如 F4 / SG3 */
  tone?: string
}

export const samples: Sample[] = []

export const samplesPending = samples.length === 0

/**
 * 视频稿件（Bilibili / YouTube 通用）。
 *
 * 标题为稿件原文，不参与翻译；播放数是抓取当时的快照
 * （Bilibili 来自 api.bilibili.com/x/web-interface/view），会随时间变化。
 * 封面已下载到 public/samples/ 自托管，避免依赖平台 CDN / 防盗链。
 */
export interface VideoWork {
  /** 视频 ID（Bilibili BVID / YouTube videoId），用于 key */
  id: string
  /** 稿件标题（原文） */
  title: string
  /** 跳转地址 */
  url: string
  /** 播放数快照；YouTube 暂不提供，缺省则不渲染该行 */
  views?: number
  /** 自托管封面路径 */
  cover: string
  /** 官方配布投稿，UI 会着重高亮 */
  official?: boolean
}

export const bilibiliVideos: VideoWork[] = [
  {
    id: 'BV1RSaj6REic',
    title: '★“让一切终于梁柯一梦。”丨羅行UTAU音源配布丨命辛辛',
    url: 'https://www.bilibili.com/video/BV1RSaj6REic/',
    views: 1435,
    cover: '/samples/BV1RSaj6REic.jpg',
    official: true,
  },
  {
    id: 'BV1nyT86gEuA',
    title: '【羅行·狼音アロ】かなしばりに遭ったら/若是遇到噩梦【OPENUTAU COVER】',
    url: 'https://www.bilibili.com/video/BV1nyT86gEuA/',
    views: 2779,
    cover: '/samples/BV1nyT86gEuA.jpg',
  },
  {
    id: 'BV1zMQxBeExX',
    title: '【羅行/狼音アロ】春難色 / 春色未浓【OpenUTAU Cover】',
    url: 'https://www.bilibili.com/video/BV1zMQxBeExX/',
    views: 1672,
    cover: '/samples/BV1zMQxBeExX.jpg',
  },
]

export const youtubeVideos: VideoWork[] = [
  {
    id: 'p4dppVWwOYU',
    title: '★『羅行Ragyo』UTAU Voicebank Release｜ For dear life',
    url: 'https://www.youtube.com/watch?v=p4dppVWwOYU',
    cover: '/samples/p4dppVWwOYU.jpg',
    official: true,
  },
]
