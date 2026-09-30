#!/usr/bin/env node
/**
 * 从立绘实测的种子色生成 Material You（Material Design 3）暗色 scheme，
 * 输出 src/styles/m3-tokens.css。
 *
 * 种子色来源见 docs/DESIGN.md §3.2（由 Pillow 对立绘做分色簇统计得到）：
 *   primary   #4D5779  墨蓝毛色
 *   secondary #8E6D4F  靴棕（橙黄色相）
 *   tertiary  #CF3A3D  领带赤
 *
 * M3 默认只会从单一种子色推导全部五个 palette（并做 harmonize，
 * 会把副色、第三色拉向主色色相）。本项目希望保留立绘的原始色相，
 * 因此改为「每个 palette 各自用自己的种子色」，只让 neutral 系列跟随主色色相。
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
  secondary: '#8E6D4F',
  tertiary: '#CF3A3D',
}

const primaryHct = Hct.fromInt(argbFromHex(SEEDS.primary))
const NEUTRAL_HUE = primaryHct.hue

/* --------------------------------------------------------------- palette */

const palette = {
  primary: TonalPalette.fromInt(argbFromHex(SEEDS.primary)),
  secondary: TonalPalette.fromInt(argbFromHex(SEEDS.secondary)),
  tertiary: TonalPalette.fromInt(argbFromHex(SEEDS.tertiary)),
  // neutral 系列沿用主色色相、极低彩度 —— 暗色表面的那一层「墨蓝灰」由此而来
  neutral: TonalPalette.fromHueAndChroma(NEUTRAL_HUE, 4),
  neutralVariant: TonalPalette.fromHueAndChroma(NEUTRAL_HUE, 8),
  // M3 规范中 error 的固定色相（25）
  error: TonalPalette.fromHueAndChroma(25, 84),
}

const tone = (name, t) => hexFromArgb(palette[name].tone(t))

/* --------------------------------------------------- 暗色 scheme 角色映射 */
// 依据 M3 规范：暗色 scheme 的 accent 取 tone 80，容器取 tone 30，容器前景取 tone 90

const DARK = {
  primary: tone('primary', 80),
  onPrimary: tone('primary', 20),
  primaryContainer: tone('primary', 30),
  onPrimaryContainer: tone('primary', 90),

  secondary: tone('secondary', 80),
  onSecondary: tone('secondary', 20),
  secondaryContainer: tone('secondary', 30),
  onSecondaryContainer: tone('secondary', 90),

  tertiary: tone('tertiary', 80),
  onTertiary: tone('tertiary', 20),
  tertiaryContainer: tone('tertiary', 30),
  onTertiaryContainer: tone('tertiary', 90),

  error: tone('error', 80),
  onError: tone('error', 20),
  errorContainer: tone('error', 30),
  onErrorContainer: tone('error', 90),

  background: tone('neutral', 6),
  onBackground: tone('neutral', 90),

  surface: tone('neutral', 6),
  onSurface: tone('neutral', 90),
  surfaceVariant: tone('neutralVariant', 30),
  onSurfaceVariant: tone('neutralVariant', 80),

  surfaceDim: tone('neutral', 6),
  surfaceBright: tone('neutral', 24),

  surfaceContainerLowest: tone('neutral', 4),
  surfaceContainerLow: tone('neutral', 10),
  surfaceContainer: tone('neutral', 12),
  surfaceContainerHigh: tone('neutral', 17),
  surfaceContainerHighest: tone('neutral', 22),

  outline: tone('neutralVariant', 60),
  outlineVariant: tone('neutralVariant', 30),

  inverseSurface: tone('neutral', 90),
  inverseOnSurface: tone('neutral', 20),
  inversePrimary: tone('primary', 40),

  shadow: tone('neutral', 0),
  scrim: tone('neutral', 0),

  surfaceTint: tone('primary', 80),
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
/* 种子色 primary ${SEEDS.primary} / secondary ${SEEDS.secondary} / tertiary ${SEEDS.tertiary} */

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
