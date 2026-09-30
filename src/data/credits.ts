/**
 * 制作构成与联系方式。
 *
 * 数据来源：assets/voicebank/readme-{jp,cn,en}.txt 与 assets/voicebank/character.yaml 的 author / voice 字段。
 *
 * 著作权归属（三语版本一致）：
 *   羅行 声音及形象  — 羅威 ©2025
 *   羅行 官方立绘    — LAN  ©2025
 *   羅行 音源制作    — Dailing ©2026
 */
import type { Localized } from './voicebank'

export interface SocialLink {
  /** 平台名，作为专有名词不参与翻译 */
  platform: 'X' | 'Bilibili'
  handle: string
  /** 尚未取得确切地址时为 null，UI 只显示 handle 纯文本，不渲染为链接 */
  url: string | null
}

export interface Credit {
  key: 'luowei' | 'lan' | 'dailing'
  name: Localized
  /** 参与的著作权年份 */
  year: string
  links: SocialLink[]
}

export const credits: Credit[] = [
  {
    key: 'luowei',
    name: { ja: '羅威', zh: '羅威', en: 'Luowei' },
    year: '2025',
    links: [
      { platform: 'X', handle: '@Luowei_Roui', url: 'https://x.com/Luowei_Roui' },
      { platform: 'Bilibili', handle: '@羅威', url: null },
    ],
  },
  {
    key: 'lan',
    name: { ja: 'LAN', zh: 'LAN', en: 'LAN' },
    year: '2025',
    links: [
      { platform: 'X', handle: '@LAN_SHU_1', url: 'https://x.com/LAN_SHU_1' },
      { platform: 'Bilibili', handle: '@LAN_SHU_1', url: null },
    ],
  },
  {
    key: 'dailing',
    name: { ja: 'Dailing', zh: 'Dailing', en: 'Dailing' },
    year: '2026',
    links: [{ platform: 'Bilibili', handle: '@哒达哒达令', url: null }],
  },
]

/** 官方链接中枢，取自 character.yaml 的 version 字段 */
export const officialLinkHub = 'https://linktr.ee/Ragyo'
