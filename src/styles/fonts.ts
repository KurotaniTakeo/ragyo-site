import type { Locale } from '@/i18n'

/**
 * 各语言字族样式表的公开路径。
 *
 * 这些文件由 scripts/gen-fonts.mjs 从完整 Noto CJK 可变字体按页面实际码位子集化
 * 生成到 public/fonts/<locale>.css（每个语言一份，sans + serif 各一个 woff2，落在
 * public/fonts/files/）。通过 useHead 按当前路由写进 <head>，使每个语言页只加载
 * 自己那一份，且在首屏 HTML 里就位——字体请求随解析立即发起，不必等 JS 执行。
 *
 * 四语各自出子集：en 与 ja 同用日文字族，但 en 页码位远少于 ja，独立子集更小。
 */
export const FONT_STYLESHEET: Record<Locale, string> = {
  ja: '/fonts/ja.css',
  zh: '/fonts/zh.css',
  'zh-Hant': '/fonts/zh-Hant.css',
  en: '/fonts/en.css',
}
