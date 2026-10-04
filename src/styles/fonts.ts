import type { Locale } from '@/i18n'
import { FONT_STYLESHEET as GENERATED } from '@/data/fonts.generated'

/**
 * 各语言字族样式表的公开路径。
 *
 * 由 scripts/gen-fonts.mjs 从完整 Noto CJK 可变字体按页面实际码位子集化生成：每个
 * 语言一份 CSS（sans + serif 各一个 woff2），文件名都带内容哈希，落在 public/fonts/。
 * 哈希使得文本或字族一变就换 URL，长缓存不会命中旧子集；实际路径写在生成的
 * src/data/fonts.generated.ts 里（与 assets.generated.ts 同样提交入库）。
 *
 * 通过 useHead 按当前路由写进 <head>，使每个语言页只加载自己那一份，且在首屏 HTML
 * 里就位——字体请求随解析立即发起，不必等 JS 执行。四语各自出子集：en 与 ja 同用
 * 日文字族，但 en 页码位远少于 ja，独立子集更小。
 */
export const FONT_STYLESHEET: Record<Locale, string> = GENERATED
