/**
 * 字体子集化管线的共享逻辑：语言/字族配置与「页面码位集合」的收集。
 *
 * gen-fonts.mjs（生成）与 check-fonts.mjs（构建后校验）共用，避免两处口径漂移。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import ts from 'typescript'

/**
 * 每个语言页 → i18n 源文件、字族名（与 src/styles/main.css 的 --app-font-* 一致）、
 * 源字体文件名。en 与 ja 同用日文字族，但码位集合不同，故各出各的子集。
 */
export const LOCALES = {
  ja: {
    json: 'ja.json',
    files: { sans: 'noto-sans-jp.ttf', serif: 'noto-serif-jp.ttf' },
    families: { sans: 'Noto Sans JP Variable', serif: 'Noto Serif JP Variable' },
  },
  zh: {
    json: 'zh.json',
    files: { sans: 'noto-sans-sc.ttf', serif: 'noto-serif-sc.ttf' },
    families: { sans: 'Noto Sans SC Variable', serif: 'Noto Serif SC Variable' },
  },
  'zh-Hant': {
    json: 'zh-Hant.json',
    files: { sans: 'noto-sans-tc.ttf', serif: 'noto-serif-tc.ttf' },
    families: { sans: 'Noto Sans TC Variable', serif: 'Noto Serif TC Variable' },
  },
  en: {
    json: 'en.json',
    files: { sans: 'noto-sans-jp.ttf', serif: 'noto-serif-jp.ttf' },
    families: { sans: 'Noto Sans JP Variable', serif: 'Noto Serif JP Variable' },
  },
}

/** 运行期拼装/格式化会用到、但正文未必出现的字符（千分位、全角标点等） */
export const SAFETY = [
  0x00a0, 0x00b7, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x3000, 0x3001, 0x3002, 0x300a,
  0x300b, 0x3010, 0x3011, 0x30fb, 0xff01, 0xff08, 0xff09, 0xff0c, 0xff1a, 0xff1b, 0xff1f,
]

export function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

/** 用 TS 解析器抽出字符串字面量 / 模板字面量（自动排除注释与代码结构）。 */
export function stringsFromTs(src) {
  const sf = ts.createSourceFile('x.ts', src, ts.ScriptTarget.Latest, true)
  const out = []
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) out.push(node.text)
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return out
}

/** JSON 的全部字符串值 */
export function stringsFromJson(src) {
  const out = []
  const visit = (v) => {
    if (typeof v === 'string') out.push(v)
    else if (Array.isArray(v)) v.forEach(visit)
    else if (v && typeof v === 'object') Object.values(v).forEach(visit)
  }
  visit(JSON.parse(src))
  return out
}

/** 把一段文本的码位并入集合，跳过控制字符 */
export function addText(set, text) {
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp >= 0x20 && cp !== 0x7f) set.add(cp)
  }
}

/** 跨语言共享的字符串（data / 组件脚本 / 模板 / index.html；不含 i18n JSON 与注释） */
export function collectInvariant(root) {
  const set = new Set()
  for (const f of walk(join(root, 'src'))) {
    const ext = extname(f).toLowerCase()
    const src = readFileSync(f, 'utf8')
    if (ext === '.ts') stringsFromTs(src).forEach((s) => addText(set, s))
    else if (ext === '.vue') {
      const script = src.match(/<script[^>]*>([\s\S]*?)<\/script>/)
      if (script) stringsFromTs(script[1]).forEach((s) => addText(set, s))
      const template = src.match(/<template[\s\S]*<\/template>/)
      if (template) addText(set, template[0])
    }
  }
  addText(set, readFileSync(join(root, 'index.html'), 'utf8'))
  for (let c = 0x20; c <= 0x7e; c += 1) set.add(c)
  SAFETY.forEach((c) => set.add(c))
  return set
}

/** 语言 → 该页需要渲染的全部码位（共享字面量 ∪ 该语言 i18n 正文），升序数组 */
export function codePointsByLocale(root) {
  const invariant = collectInvariant(root)
  const out = {}
  for (const [locale, cfg] of Object.entries(LOCALES)) {
    const set = new Set(invariant)
    const jsonPath = join(root, 'src/i18n/locales', cfg.json)
    stringsFromJson(readFileSync(jsonPath, 'utf8')).forEach((s) => addText(set, s))
    out[locale] = [...set].sort((a, b) => a - b)
  }
  return out
}
