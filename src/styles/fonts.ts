import type { Locale } from '@/i18n'

/**
 * 各语言字族样式表的公开路径。
 *
 * 这些文件由 scripts/gen-fonts.mjs 从 node_modules/@fontsource-variable/* 派生到
 * public/fonts/<locale>.css（只含该语言字族的 @font-face，woff2 落在
 * public/fonts/files/）。通过 useHead 按当前路由写进 <head>，使每个语言页只加载
 * 自己语言的字族，且在首屏 HTML 里就位——字体请求随解析立即发起，不必等 JS 执行。
 *
 * en 与 ja 共用日文字族（拆分前 :root 即回退到 Noto Sans/Serif JP，视觉不变）。
 */
export const FONT_STYLESHEET: Record<Locale, string> = {
  ja: '/fonts/ja.css',
  zh: '/fonts/zh.css',
  'zh-Hant': '/fonts/zh-Hant.css',
  en: '/fonts/ja.css',
}
