/**
 * 制作构成与联系方式。
 *
 * 数据来源：assets/voicebank/readme-{jp,cn,en}.txt 与 assets/voicebank/character.yaml 的 author / voice 字段。
 *
 * 著作权归属（三语版本一致）：
 *   羅行 声音及形象  — 羅威 ©2025
 *   羅行 官方立绘    — LAN  ©2025
 *   羅行 音源制作    — Dailing ©2026
 *
 * 末尾的塔克欧（Takeo）负责最终排查修正与网页制作，来自作者本人补充，
 * 不在上述 readme / character.yaml 的著作权列表内。
 *
 * 头像与视频封面一样本地托管（public/credits/*.webp），此处只存路径。
 */
import type { Localized } from './voicebank'

export interface SocialLink {
  /** 平台名，作为专有名词不参与翻译 */
  platform: 'X' | 'Bilibili' | 'GitHub' | 'YouTube' | 'Facebook'
  handle: string
  /** 尚未取得确切地址时为 null，UI 只显示 handle 纯文本，不渲染为链接 */
  url: string | null
}

export interface Credit {
  key: 'luowei' | 'lan' | 'dailing' | 'takeo'
  name: Localized
  /** 参与的著作权年份 */
  year: string
  /** 头像路径。与视频封面一样本地托管；缺省时 UI 回退为首字母色块 */
  avatar?: string
  links: SocialLink[]
}

export const credits: Credit[] = [
  {
    key: 'luowei',
    name: { ja: '羅威', zh: '羅威', 'zh-Hant': '羅威', en: 'Luowei' },
    year: '2025',
    avatar: '/credits/luowei.webp',
    links: [
      { platform: 'X', handle: '@Luowei_Roui', url: 'https://x.com/Luowei_Roui' },
      { platform: 'Bilibili', handle: '@羅威', url: 'https://space.bilibili.com/2641540' },
      {
        platform: 'YouTube',
        handle: '@Luowei_Roui',
        url: 'https://www.youtube.com/@Luowei_Roui/search',
      },
    ],
  },
  {
    key: 'lan',
    name: { ja: 'LAN', zh: 'LAN', 'zh-Hant': 'LAN', en: 'LAN' },
    year: '2025',
    avatar: '/credits/lan.webp',
    links: [
      { platform: 'X', handle: '@LAN_SHU_1', url: 'https://x.com/LAN_SHU_1' },
      { platform: 'Bilibili', handle: '@LAN_SHU_1', url: 'https://space.bilibili.com/379007581' },
    ],
  },
  {
    key: 'dailing',
    name: { ja: 'Dailing', zh: 'Dailing', 'zh-Hant': 'Dailing', en: 'Dailing' },
    year: '2026',
    avatar: '/credits/dailing.webp',
    links: [
      { platform: 'Bilibili', handle: '@哒达哒达令', url: 'https://space.bilibili.com/3546701128272307' },
      {
        platform: 'Facebook',
        handle: 'Dailing Inginging',
        url: 'https://www.facebook.com/people/Dailing-Inginging/pfbid02wjP8puRTLpuRNiqH6fLhUgkX6Fzu4NswBUewUBXV9pzmV27ju1NU74oCKP5N7Dsyl/',
      },
    ],
  },
  {
    key: 'takeo',
    name: { ja: '塔克欧', zh: '塔克欧', 'zh-Hant': '塔克欧', en: 'Takeo' },
    year: '2026',
    avatar: '/credits/takeo.webp',
    links: [
      { platform: 'Bilibili', handle: '黒谷武雄', url: 'https://space.bilibili.com/32305427' },
      {
        platform: 'GitHub',
        handle: 'KurotaniTakeo/ragyo-site',
        url: 'https://github.com/KurotaniTakeo/ragyo-site',
      },
    ],
  },
]

/**
 * 角色原作者。
 * 下载区的「联系作者」会跳到制作名单并短暂高亮这一条，避免调用方硬编码字符串。
 */
export const authorCreditKey: Credit['key'] = 'luowei'

/** 官方链接中枢的适用地区：大陆用 vlink，海外用 linktree */
export type LinkHubRegion = 'mainland' | 'overseas'

export interface LinkHub {
  region: LinkHubRegion
  /** 平台名称，品牌名不参与翻译 */
  platform: string
  url: string
}

/**
 * 官方链接合集。
 *
 * 大陆用户走 vlink，海外用户走 linktree —— 两个聚合页内容一致，
 * 只是分发渠道不同，故并列展示而不做自动跳转。
 */
export const officialLinkHubs: LinkHub[] = [
  { region: 'mainland', platform: 'vlink', url: 'https://vlink.cc/ragyo' },
  { region: 'overseas', platform: 'Linktree', url: 'https://linktr.ee/Ragyo' },
]

/** 主要面向中国大陆的平台 */
const mainlandPlatforms: ReadonlySet<SocialLink['platform']> = new Set(['Bilibili'])

/**
 * 按语言重排成员社交链接：简中把大陆平台（Bilibili）排在前面，
 * 其余语言把非大陆平台排在前面。稳定排序，同类平台保持原有声明顺序。
 */
export function orderSocialLinks(links: SocialLink[], locale: string): SocialLink[] {
  const mainlandFirst = locale === 'zh'
  return [...links].sort((a, b) => {
    const rank = (link: SocialLink) => (mainlandPlatforms.has(link.platform) ? 0 : 1)
    const diff = rank(a) - rank(b)
    return mainlandFirst ? diff : -diff
  })
}

/**
 * 按语言重排官方链接合集：简中把大陆渠道（vlink）排在前面，
 * 其余语言把海外渠道（Linktree）排在前面；与下载渠道的排序逻辑一致。
 */
export function orderLinkHubs(hubs: LinkHub[], locale: string): LinkHub[] {
  const mainlandFirst = locale === 'zh'
  return [...hubs].sort((a, b) => {
    const rank = (hub: LinkHub) => (hub.region === 'mainland' ? 0 : 1)
    const diff = rank(a) - rank(b)
    return mainlandFirst ? diff : -diff
  })
}
