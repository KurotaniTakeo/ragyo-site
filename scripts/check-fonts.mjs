#!/usr/bin/env node
/**
 * 构建后字体覆盖校验。
 *
 * 取 dist 各语言页真正渲染出来的文字（已剥离 script/style/标签），逐一核对是否落在
 * 该语言的码位集合内。用来兜住「新文字加进了 gen:fonts 扫描不到的地方」——那类字不会
 * 进子集、会缺字回退。与 gen-fonts 共用 scripts/fonts.lib.mjs，保证两边口径一致。
 *
 * 用法：pnpm check:fonts（已挂在 build 之后自动执行）
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LOCALES, codePointsByLocale } from './fonts.lib.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')

/** 每个语言对应要检查的构建产物（en 另有根路径重定向页，内容与 en 相同） */
const PAGES = {
  ja: ['ja/index.html'],
  zh: ['zh/index.html'],
  'zh-Hant': ['zh-Hant/index.html'],
  en: ['en/index.html', 'index.html'],
}

const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

/** 取 HTML 文本节点里的码位（跳过标签、script、style 与控制字符） */
function textCodePoints(html) {
  const text = decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
  const set = new Set()
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp >= 0x20 && cp !== 0x7f) set.add(cp)
  }
  return set
}

const expected = codePointsByLocale(ROOT)
let failed = false

for (const locale of Object.keys(LOCALES)) {
  const allowed = new Set(expected[locale])
  for (const rel of PAGES[locale]) {
    const file = join(DIST, rel)
    if (!existsSync(file)) {
      console.error(`✖ 找不到 ${rel}，请先运行 pnpm build`)
      failed = true
      continue
    }
    const extra = [...textCodePoints(readFileSync(file, 'utf8'))]
      .filter((cp) => !allowed.has(cp))
      .sort((a, b) => a - b)
    if (extra.length) {
      failed = true
      const sample = extra
        .slice(0, 30)
        .map((c) => `${String.fromCodePoint(c)}(U+${c.toString(16).toUpperCase()})`)
        .join(' ')
      console.error(`✖ ${locale} (${rel}): ${extra.length} 个页面字符不在码位集合内：${sample}${extra.length > 30 ? ' …' : ''}`)
    } else {
      console.log(`✔ ${locale} (${rel})`)
    }
  }
}

if (failed) {
  console.error(
    '\n新文字若来自 gen:fonts 扫描不到的位置，请把它放进 i18n JSON / src 字符串，' +
      '或扩展 scripts/fonts.lib.mjs 的扫描范围后重跑 pnpm gen:fonts。',
  )
  process.exit(1)
}
console.log('\n✔ 字体覆盖校验通过')
