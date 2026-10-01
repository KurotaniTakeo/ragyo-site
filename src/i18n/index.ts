import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import ja from './locales/ja.json'
import zh from './locales/zh.json'
import zhHant from './locales/zh-Hant.json'

export const SUPPORTED_LOCALES = ['ja', 'zh', 'zh-Hant', 'en'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** 用户在 localStorage 中记住的手动语言选择；页面探测与切换共用此键 */
export const LOCALE_STORAGE_KEY = 'ragyo.locale'

/** 语言切换控件上显示的名称。使用各语言的自称，不做翻译。 */
export const LOCALE_LABELS: Record<Locale, string> = {
  ja: '日本語',
  zh: '简体中文',
  'zh-Hant': '繁體中文',
  en: 'English',
}

/** 写入 <html lang> 的值。中文按字形细分：zh 用 zh-Hans，zh-Hant 用 zh-Hant。 */
export const HTML_LANG: Record<Locale, string> = {
  ja: 'ja',
  zh: 'zh-Hans',
  'zh-Hant': 'zh-Hant',
  en: 'en',
}

/** hreflang 标签用的值 */
export const HREFLANG: Record<Locale, string> = {
  ja: 'ja',
  zh: 'zh-Hans',
  'zh-Hant': 'zh-Hant',
  en: 'en',
}

/** OGP 的 og:locale 取值 */
export const OG_LOCALE: Record<Locale, string> = {
  ja: 'ja_JP',
  zh: 'zh_CN',
  'zh-Hant': 'zh_TW',
  en: 'en',
}

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)

export const createI18nInstance = () =>
  createI18n({
    legacy: false,
    locale: DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    messages: { ja, zh, 'zh-Hant': zhHant, en },
    // 四语内容均已完整翻译，缺键时应在开发阶段就暴露出来
    missingWarn: import.meta.env.DEV,
    fallbackWarn: import.meta.env.DEV,
  })

export type I18nInstance = ReturnType<typeof createI18nInstance>
