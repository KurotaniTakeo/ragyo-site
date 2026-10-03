#!/usr/bin/env node
/**
 * 字族派生管线。
 *
 * 站点引入 6 套 CJK 字族（日语 / 简体 / 繁体的 sans + serif），但每个语言页只用
 * 其中一套。若把 6 套的 @font-face 全打进全局 main.css，每页都要下载 600KB+ 的
 * render-blocking CSS，其中大半是当前语言永远用不到的声明。
 *
 * 本脚本按语言把 @fontsource-variable 各包的 index.css 里对应的 @font-face 汇总成
 * public/fonts/<locale>.css，并把引用的 woff2 复制到 public/fonts/files/。
 * 站点再用 useHead 只给当前语言页挂它那一份（见 src/styles/fonts.ts）。
 * en 复用 ja，不单独产出。
 *
 * 用法：pnpm gen:fonts
 * 输出：public/fonts/<locale>.css、public/fonts/files/*.woff2（目录已 gitignore）
 *
 * 注：与 gen:palette / gen:images / gen:surprise 一样，产物是提交前需重新生成的
 * 派生物；全新 clone 后应先跑本脚本，否则字体 404、页面回退到系统字体。
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public/fonts')
const FILES_DIR = join(OUT_DIR, 'files')
const FONTSCOPE = join(ROOT, 'node_modules/@fontsource-variable')

/** 语言 → 需要的字族包（顺序决定 CSS 里的声明顺序，不影响匹配） */
const LOCALES = {
  ja: ['noto-sans-jp', 'noto-serif-jp'],
  zh: ['noto-sans-sc', 'noto-serif-sc'],
  'zh-Hant': ['noto-sans-tc', 'noto-serif-tc'],
}

let copied = 0
let reused = 0

/** fontsource 的 index.css 是带注释与缩进的排版稿；这里压成单行，减少未压缩传输体积
    （gzip 后差异不大，但保持与 Vite 处理过的 CSS 相近的形态）。 */
const minify = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};:,])\s*/g, '$1')
    .trim()

/** 把包内 index.css 的相对 @font-face 资源复制到 public/fonts/files 并改写为站点绝对路径 */
function collect(pkg) {
  const pkgDir = join(FONTSCOPE, pkg)
  const cssPath = join(pkgDir, 'index.css')
  if (!existsSync(cssPath)) {
    throw new Error(`找不到字族样式表：${cssPath}（先安装依赖）`)
  }
  const rewritten = readFileSync(cssPath, 'utf8').replace(
    /url\(\s*['"]?\.\/files\/([^'")]+)['"]?\s*\)/g,
    (_, file) => {
      const dest = join(FILES_DIR, file)
      if (existsSync(dest)) reused += 1
      else {
        copyFileSync(join(pkgDir, 'files', file), dest)
        copied += 1
      }
      return `url(/fonts/files/${file})`
    },
  )
  return minify(rewritten)
}

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(FILES_DIR, { recursive: true })

for (const [locale, packages] of Object.entries(LOCALES)) {
  const parts = packages.map((pkg) => `/* ${pkg} */\n${collect(pkg)}`)
  const css = `/* 自动生成，请勿手动编辑。由 scripts/gen-fonts.mjs 从 @fontsource-variable/* 派生。 */\n\n${parts.join('\n\n')}\n`
  writeFileSync(join(OUT_DIR, `${locale}.css`), css, 'utf8')
  console.log(`✔ fonts/${locale}.css  ← ${packages.join(' + ')}`)
}

console.log(
  `\n✔ 已写入 public/fonts（复制 woff2 ${copied} 个、复用 ${reused} 个；en 复用 ja）`,
)
