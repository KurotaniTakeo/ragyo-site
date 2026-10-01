/**
 * 声库结构化数据。
 *
 * 数据来源（均取自作者提供的发行文件）：
 *   - assets/voicebank/character.yaml → version / author / voice / subbanks
 *   - assets/voicebank/character.txt  → library name / age / height / weight
 *   - assets/voicebank/readme-*.txt   → 制作分担与著作权
 *
 * 约定：散文（介绍文案、規約正文）一律放 src/i18n/locales/*.json，
 * 这里只放不随语言变化的结构化数据，避免同一份信息在三语文案里各写一遍。
 */

export interface Localized<T = string> {
  ja: T
  zh: T
  'zh-Hant': T
  en: T
}

export type VoicebankType = 'CV' | 'VCV' | 'CVVC' | 'VCCV'

/** character.yaml 中 subbanks 的一项：一个音阶 × 一种音色 */
export interface Subbank {
  /** 文件名后缀，例如 B2 / SF4 */
  suffix: string
  /** 音色，null 表示默认音色 */
  color: string | null
  /** 该档的适用音域 */
  toneRange: string
}

export const voicebank = {
  slug: 'ragyo',

  /** UTAU 声库文件夹名，取自 character.txt 的 name 字段 */
  libraryName: 'RagyoVCV',

  /** 角色名 */
  name: {
    ja: '羅行',
    zh: '羅行',
    'zh-Hant': '羅行',
    en: 'Ragyo',
  } satisfies Localized,

  /** hero 副名（小字）：显示当前语言之外的另一写法 */
  reading: {
    ja: 'らぎょう',
    zh: 'Ragyo',
    'zh-Hant': 'Ragyo',
    en: '羅行',
  } satisfies Localized,

  type: 'VCV' as VoicebankType,

  version: '1.0',

  /** 发行日期尚未提供，填入前下载区不渲染该行 */
  releasedAt: null as string | null,

  /** character.yaml: text_file_encoding */
  textEncoding: 'Shift_JIS',

  /** 支持该声库的引擎 */
  engines: ['UTAU', 'OpenUTAU'],

  /**
   * 由 character.yaml 的 subbanks 推导：
   * 3 个音阶（B2 / G3 / F4）× 2 种音色（默认 / Soft）= 6 档
   */
  subbanks: [
    { suffix: 'B2', color: null, toneRange: 'C1–D#3' },
    { suffix: 'G3', color: null, toneRange: 'E3–E4' },
    { suffix: 'F4', color: null, toneRange: 'F4–B7' },
    { suffix: 'SB2', color: 'Soft', toneRange: 'C1–D#3' },
    { suffix: 'SG3', color: 'Soft', toneRange: 'E3–E4' },
    { suffix: 'SF4', color: 'Soft', toneRange: 'F4–B7' },
  ] satisfies Subbank[],

  /** 覆盖全部 subbanks 的总音域 */
  toneRange: 'C1–B7',

  /** 角色设定。体重在 readme-cn / readme-jp 写作 62kg，
   *  readme-en 与 character.txt 写作 64kg，此处采用后者并待作者确认。 */
  profile: {
    age: 18,
    height: '174cm',
    weight: '64kg',
  },

  /* 官方链接合集（大陆 / 海外）统一由 src/data/credits.ts 维护，此处不再重复。 */

  /** ACE Studio 上的 AI 声库（規約中提及，供需要时引导） */
  aceStudioNote: true,
} as const

/** 声库特征标签，用于 About 区的卡片墙 */
export const highlights = [
  { key: 'vcv', value: 'VCV' },
  { key: 'pitches', value: '3 + Soft' },
  { key: 'tones', value: '6' },
  { key: 'range', value: 'C1–B7' },
  { key: 'engines', value: 'UTAU / OpenUTAU' },
] as const

/**
 * 各音阶的音域区间，用 MIDI 音高编号表示，供 About 区的音域条使用。
 *
 * MIDI 编号对照：C1 = 24、D#3 = 51、E3 = 52、E4 = 64、F4 = 65、B7 = 107。
 * 全部由 character.yaml 的 tone_ranges 换算而来。
 */
export const pitchRanges = [
  { id: 'B2', toneRange: 'C1–D#3', low: 24, high: 51, normal: 'B2', soft: 'SB2' },
  { id: 'G3', toneRange: 'E3–E4', low: 52, high: 64, normal: 'G3', soft: 'SG3' },
  { id: 'F4', toneRange: 'F4–B7', low: 65, high: 107, normal: 'F4', soft: 'SF4' },
] as const

/** 音域条的两端，用于计算各音阶的相对宽度 */
export const fullRange = { low: 24, high: 107 }
