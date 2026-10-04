/**
 * 下载渠道数据。
 *
 * 重要前提：本项目**不自建文件托管**，下载包只通过网盘分发
 * （Google Drive / 夸克網盤 / 百度網盤）。
 * 因此站点为纯静态，不涉及对象存储与带宽成本。
 *
 * 也因此无法提供 SHA-256 校验与断点续传，改为展示版本号与打包日期。
 *
 * 链接来源：https://linktr.ee/Ragyo 与 https://vlink.cc/ragyo。
 */

export type Platform = 'gdrive' | 'baidu' | 'quark'

export interface Mirror {
  platform: Platform
  /** 尚未提供时为 null */
  url: string | null
  /** 百度網盤提取码；为空则不渲染复制控件 */
  code: string | null
  status: 'live' | 'pending'
  /** 主要面向中国大陆，海外用户可用性差 */
  mainlandOnly: boolean
}

/**
 * 音源本体。
 *
 * 夸克在前、百度殿后：按原作者的意愿，百度網盤仅作为备用渠道。
 * 立绘渠道顺序同理，见下方 illustrationMirrors。
 */
export const mirrors: Mirror[] = [
  {
    platform: 'gdrive',
    url: 'https://drive.google.com/file/d/1UBcn743YSGFsZcVRtazrXjPNyvHC84jQ/view',
    code: null,
    status: 'live',
    mainlandOnly: false,
  },
  {
    platform: 'quark',
    url: 'https://pan.quark.cn/s/5744225af407',
    code: null,
    status: 'live',
    mainlandOnly: true,
  },
  {
    platform: 'baidu',
    url: 'https://pan.baidu.com/s/17CJLRh6XVqmh4ZJ8gMJy-w?pwd=ragy',
    code: 'ragy',
    status: 'live',
    mainlandOnly: true,
  },
]

/** 立绘与说明（二创素材） */
export const illustrationMirrors: Mirror[] = [
  {
    platform: 'quark',
    url: 'https://pan.quark.cn/s/c3d31d732623',
    code: null,
    status: 'live',
    mainlandOnly: true,
  },
  {
    platform: 'baidu',
    url: 'https://pan.baidu.com/s/1ZbEUpbk7wIq7MGf4819Ltg?pwd=ragy',
    code: 'ragy',
    status: 'live',
    mainlandOnly: true,
  },
]

/**
 * 各语言下需要「沉底」的渠道。
 * 中文（大陆）用户访问 Google Drive 不便，因此排在最后；
 * 其他语言保持声明顺序（Google Drive 优先）。
 */
const demotedPlatforms: Record<string, Platform[]> = {
  zh: ['gdrive'],
}

/**
 * 按语言重排渠道，只移动需要沉底的平台，其余保持原有相对顺序。
 * 立绘渠道不含 Google Drive，因此不受影响。
 */
export function orderMirrors(list: Mirror[], locale: string): Mirror[] {
  const demoted = demotedPlatforms[locale]
  if (!demoted) return list
  return [...list].sort(
    (a, b) => Number(demoted.includes(a.platform)) - Number(demoted.includes(b.platform)),
  )
}

export const downloadMeta = {
  version: '1.0.1',
  /** 打包日期（与更新日志中 1.0.1 的日期保持一致） */
  packagedAt: '2026.10.01' as string | null,
  /** 压缩包体积 */
  size: '459.47 MB' as string | null,
  /** 链接失效反馈入口（X / 邮箱），待提供 */
  feedbackUrl: null as string | null,
} as const

/** 是否全部渠道都还没准备好 */
export const allMirrorsPending = mirrors.every((m) => m.status === 'pending')
