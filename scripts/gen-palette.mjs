#!/usr/bin/env node
/**
 * 从立绘实测的种子色生成 Material You（Material Design 3）暗色 scheme，
 * 输出 src/styles/m3-tokens.css。
 *
 * 种子色来源见 docs/DESIGN.md §3.2（由 Pillow 对立绘做分色簇统计得到）：
 *   primary   #4D5779  墨蓝毛色
 *   secondary #545873  石板蓝（贴近主色墨蓝的中性蓝灰）
 *   tertiary  #CF3A3D  领带赤
 *
 * M3 默认只会从单一种子色推导全部五个 palette（并做 harmonize，
 * 会把副色、第三色拉向主色色相）。本项目希望保留立绘的原始色相，
 * 因此改为「每个 palette 各自用自己的种子色」，只让 neutral 系列跟随主色色相。
 *
 * 背景色另由委托方指定：取其在两个官方聚合页（vlink / linktree）上
 * 选定的深紫 #505678 作为整站画布，surface 家族改由该色推导。
 */
import { register } from 'node:module'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

register('./esm-ext-hook.mjs', import.meta.url)
const { argbFromHex, hexFromArgb, TonalPalette, Hct } = await import(
  '@material/material-color-utilities'
)

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/* ------------------------------------------------------------------ 种子色 */

const SEEDS = {
  primary: '#4D5779',
  secondary: '#545873',
  tertiary: '#CF3A3D',
}

/**
 * 站点背景：委托方在两个官方聚合页上选定的深紫。
 * 与 primary 种子同色相，但明度落在 tone 37 附近，作为整站画布；
 * 容器色阶由它向下取（比底色更暗），复刻聚合页「紫底 + 暗紫卡片」的观感。
 */
const BACKGROUND = '#505678'

const primaryHct = Hct.fromInt(argbFromHex(SEEDS.primary))
const NEUTRAL_HUE = primaryHct.hue
const backgroundHct = Hct.fromInt(argbFromHex(BACKGROUND))

/* --------------------------------------------------------------- palette */

const palette = {
  primary: TonalPalette.fromInt(argbFromHex(SEEDS.primary)),
  secondary: TonalPalette.fromInt(argbFromHex(SEEDS.secondary)),
  tertiary: TonalPalette.fromInt(argbFromHex(SEEDS.tertiary)),
  // 背景族：沿用背景色的色相与彩度，供 surface 家族取色
  brand: TonalPalette.fromHueAndChroma(backgroundHct.hue, backgroundHct.chroma),
  // neutral 系列（现仅 inverse 家族在用）沿用主色色相、极低彩度
  neutral: TonalPalette.fromHueAndChroma(NEUTRAL_HUE, 4),
  neutralVariant: TonalPalette.fromHueAndChroma(NEUTRAL_HUE, 8),
  // M3 规范中 error 的固定色相（25）
  error: TonalPalette.fromHueAndChroma(25, 84),
}

const tone = (name, t) => hexFromArgb(palette[name].tone(t))

/* --------------------------------------------------- 暗色 scheme 角色映射 */
// 背景明度从 tone 6 抬到 tone 37（#505678），因此不再套用 M3 暗色的默认阶梯：
//   - surface 直接锚定 BACKGROUND，容器由 brand 调色板向下取（比底色更暗），
//     文字一律用白 —— 与两个聚合页的观感一致；
//   - accent/容器前景的取色规则不变（tone 30 / 90）；
//   - accent 提到 tone 86（≈5:1）：默认的 tone 80 在更亮的紫底上够不到 WCAG AA。

const DARK = {
  primary: tone('primary', 86),
  onPrimary: tone('primary', 20),
  primaryContainer: tone('primary', 30),
  onPrimaryContainer: tone('primary', 90),

  secondary: tone('secondary', 86),
  onSecondary: tone('secondary', 20),
  secondaryContainer: tone('secondary', 30),
  onSecondaryContainer: tone('secondary', 90),

  tertiary: tone('tertiary', 86),
  onTertiary: tone('tertiary', 20),
  tertiaryContainer: tone('tertiary', 30),
  onTertiaryContainer: tone('tertiary', 90),

  error: tone('error', 80),
  onError: tone('error', 20),
  errorContainer: tone('error', 30),
  onErrorContainer: tone('error', 90),

  background: BACKGROUND,
  onBackground: '#ffffff',

  surface: BACKGROUND,
  onSurface: '#ffffff',
  surfaceVariant: tone('brand', 30),
  onSurfaceVariant: tone('brand', 85),

  surfaceDim: tone('brand', 26),
  surfaceBright: tone('brand', 52),

  surfaceContainerLowest: tone('brand', 14),
  surfaceContainerLow: tone('brand', 20),
  surfaceContainer: tone('brand', 24),
  surfaceContainerHigh: tone('brand', 28),
  surfaceContainerHighest: tone('brand', 32),

  // 描边/分割线在更亮的紫底上需要更高明度才看得出来：
  // tone 56 在新底色上约 2:1，与旧近黑主题持平（tone 40 只有 1.3:1）。
  outline: tone('brand', 70),
  outlineVariant: tone('brand', 56),

  inverseSurface: tone('neutral', 90),
  inverseOnSurface: tone('neutral', 20),
  inversePrimary: tone('primary', 40),

  shadow: tone('neutral', 0),
  scrim: tone('neutral', 0),

  surfaceTint: tone('primary', 86),
}

/* ------------------------------------------------------------ 对比度审计 */

const srgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
const lum = (hex) =>
  srgb(hex)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((acc, c, i) => acc + c * [0.2126, 0.7152, 0.0722][i], 0)
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

const TEXT_PAIRS = [
  ['onSurface', 'surface'],
  ['onSurface', 'surfaceContainerLow'],
  ['onSurface', 'surfaceContainer'],
  ['onSurface', 'surfaceContainerHigh'],
  ['onSurface', 'surfaceContainerHighest'],
  ['onSurfaceVariant', 'surface'],
  ['onSurfaceVariant', 'surfaceContainer'],
  ['primary', 'surface'],
  ['primary', 'surfaceContainerLow'],
  ['secondary', 'surface'],
  ['tertiary', 'surface'],
  ['tertiary', 'surfaceContainerLow'],
  ['onPrimary', 'primary'],
  ['onPrimaryContainer', 'primaryContainer'],
  ['onSecondaryContainer', 'secondaryContainer'],
  ['onTertiaryContainer', 'tertiaryContainer'],
  ['onErrorContainer', 'errorContainer'],
]

const failures = []
for (const [fg, bg] of TEXT_PAIRS) {
  const r = ratio(DARK[fg], DARK[bg])
  const ok = r >= 4.5
  const tag = ok ? '  ok ' : ' WARN'
  console.log(`[${tag}] ${fg} on ${bg}  ${r.toFixed(2)}:1  (${DARK[fg]} / ${DARK[bg]})`)
  if (!ok) failures.push(`${fg} on ${bg} = ${r.toFixed(2)}:1`)
}

/* ------------------------------------------------------------ 生成 CSS */

const ramp = (key, label = key) =>
  [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]
    .map((t) => `  --md-ref-palette-${label}-${t}: ${tone(key, t)};`)
    .join('\n')

const colors = Object.entries(DARK)
  .map(([k, v]) => `  --md-sys-color-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
  .join('\n')

const css = `/* 此文件由 scripts/gen-palette.mjs 自动生成，请勿手动编辑。 */
/* 背景 ${BACKGROUND} / 种子色 primary ${SEEDS.primary} / secondary ${SEEDS.secondary} / tertiary ${SEEDS.tertiary} */

:root {
  color-scheme: dark;

${colors}
}

/* ------------------------------------------------------------------
   参考色调阶梯（reference palette）
   与 --md-sys-color-* 的区别：这里保留完整的 0–100 色阶，
   供调试页与后续微调取用，业务组件不应直接引用。
------------------------------------------------------------------ */
:root {
${ramp('primary')}

${ramp('secondary')}

${ramp('tertiary')}

${ramp('brand')}

${ramp('neutral')}

${ramp('neutralVariant', 'neutral-variant')}

${ramp('error')}
}
`

const OUT = resolve(ROOT, 'src/styles/m3-tokens.css')
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, css, 'utf8')
console.log(`\n✔ 已写入 ${OUT}`)

if (failures.length) {
  console.warn(`\n⚠ ${failures.length} 组文本对比度未达 WCAG AA 4.5:1：`)
  for (const f of failures) console.warn(`   - ${f}`)
  console.warn('  请检查这些组合是否被用于正文或小字号文本。')
  process.exitCode = 1
} else {
  console.log('✔ 全部文本组合对比度均达到 WCAG AA 4.5:1')
}
