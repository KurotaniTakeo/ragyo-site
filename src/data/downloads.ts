/**
 * 下载渠道数据。
 *
 * 重要前提：本项目**不自建文件托管**，下载包只通过网盘分发
 * （Google Drive / 百度網盤 / 夸克網盤）。
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
  /** 该渠道对海外用户可用性差，日/英页面需要额外提示 */
  overseasNote: boolean
}

/** 音源本体 */
export const mirrors: Mirror[] = [
  {
    platform: 'gdrive',
    url: 'https://drive.google.com/file/d/1UBcn743YSGFsZcVRtazrXjPNyvHC84jQ/view',
    code: null,
    status: 'live',
    overseasNote: true,
  },
  {
    platform: 'baidu',
    url: 'https://pan.baidu.com/s/17CJLRh6XVqmh4ZJ8gMJy-w?pwd=ragy',
    code: 'ragy',
    status: 'live',
    overseasNote: false,
  },
  {
    platform: 'quark',
    url: 'https://pan.quark.cn/s/5744225af407',
    code: null,
    status: 'live',
    overseasNote: false,
  },
]

/** 立绘与说明（二创素材） */
export const illustrationMirrors: Mirror[] = [
  {
    platform: 'quark',
    url: 'https://pan.quark.cn/s/c3d31d732623',
    code: null,
    status: 'live',
    overseasNote: false,
  },
  {
    platform: 'baidu',
    url: 'https://pan.baidu.com/s/1ZbEUpbk7wIq7MGf4819Ltg?pwd=ragy',
    code: 'ragy',
    status: 'live',
    overseasNote: false,
  },
]

export const downloadMeta = {
  version: '1.0',
  /** 打包日期，待提供 */
  packagedAt: null as string | null,
  /** 压缩包体积，待提供 */
  size: null as string | null,
  /** 链接失效反馈入口（X / 邮箱），待提供 */
  feedbackUrl: null as string | null,
} as const

/** 是否全部渠道都还没准备好 */
export const allMirrorsPending = mirrors.every((m) => m.status === 'pending')
