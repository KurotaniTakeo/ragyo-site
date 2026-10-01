# Ragyo Site

「羅行（Ragyo）」UTAU / OpenUTAU 声库的宣传站：**单页、静态预渲染**，构建产物直接部署即可。
Vue 3 + Vite + vite-ssg + Tailwind v4 + vue-i18n，TypeScript 严格模式。

## 环境要求

- Node.js（开发使用 v26）
- **pnpm**（仓库含 `pnpm-lock.yaml`，请勿使用 npm / yarn）
- `ffmpeg` / `ffprobe`（含 H.264 / libx264）——仅 `gen:surprise` 需要

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动 Vite 开发服务器 |
| `pnpm build` | `vite-ssg build`，预渲染 `/ja/ /zh/ /en/` 到 `dist/` |
| `pnpm preview` | 本地预览构建产物 |
| `pnpm typecheck` | `vue-tsc --noEmit`，**唯一的自动化检查**（无 linter / 测试 / CI） |
| `pnpm gen:palette` | 由种子色重新生成 `src/styles/m3-tokens.css` |
| `pnpm gen:images` | 派生立绘多档 WebP/AVIF 与 `src/data/assets.generated.ts` |
| `pnpm gen:surprise` | 将彩蛋 GIF 转码为 MP4/WebP 与 `src/data/surprise.generated.ts` |

## 全新克隆后请先跑生成脚本

`*.generated.ts` 已提交，但**图片与视频输出目录被 gitignore**（`public/img/generated`、`public/surprise/generated`）。
因此新克隆后必须先执行：

```sh
pnpm install
pnpm gen:images
pnpm gen:surprise   # 需要 ffmpeg
pnpm build           # 或 pnpm dev
```

否则页面只显示内嵌的 LQIP 模糊占位图。`dist/` 与上述生成目录均不入库。

## 生成产物——请勿手动编辑

带有「自动生成，请勿手动编辑」标记的文件是脚本输出，请改脚本 / 输入后重跑：

| 产物 | 来源 |
| --- | --- |
| `src/styles/m3-tokens.css` | `scripts/gen-palette.mjs`（种子色在脚本顶部） |
| `src/data/assets.generated.ts` + `public/img/generated/*` | `scripts/gen-images.mjs` + `scripts/assets.manifest.json` |
| `src/data/surprise.generated.ts` + `public/surprise/generated/*` | `scripts/gen-surprise.mjs` |

注意：surface 色 `#505678` 同时硬编码在 `gen-images.mjs` 与 `gen-surprise.mjs` 中用于合成透明素材；
若 `gen:palette` 改动了 `--md-sys-color-surface`，需同步更新这两个脚本。

## 目录结构

```
src/
├── components/   M3 风格通用组件
├── composables/  整页滚动、滚动上下文、Snackbar
├── data/         语言无关的结构化数据（声库、下载、样本、版权、section 定义）
├── i18n/         三语文案 locales/{ja,zh,en}.json
├── sections/     首页 9 个区块
├── styles/       Material 3 tokens / 排版 + Tailwind 入口
└── views/        HomePage.vue（仅渲染各 section）
scripts/          调色板 / 立绘 / 彩蛋 / 资产清单等生成脚本
assets/           原始素材（见下）
public/           静态资源与生成产物
```

## assets/ 说明

```
assets/
├── voicebank/            声库发行原件（规约与角色设定的**事实来源**）
│   ├── readme-{jp,cn,en}.txt   使用规约；站点 terms 区块即其人工转写
│   ├── character.txt           库名 / 年龄 / 身高 / 体重
│   └── character.yaml          version / author / voice / subbanks
└── illustration/
    ├── character/*.png         立绘原稿（1 3 4 5 6 7，9927×14720）
    ├── surprise/*.gif          彩蛋源 GIF（19 个，供 gen:surprise 转码）
    └── readme-{jp,cn,en}.txt   角色形象与设定的原始说明
```

- `readme-jp.txt` 等日文原件为 **Shift-JIS 编码**，已通过 `.gitattributes` 的 `-text` 保持字节原样，请勿转码或让编辑器改写行尾。
- 立绘文件名（`1.png`…）作者可能调整：**唯一事实来源是 `scripts/assets.manifest.json`**，业务代码一律经 `src/data/assets.ts` 的语义化键引用，不出现具体文件名。`3/5/6.png` 为有意保留但未进清单的原稿。

## 内容维护约定

- 面向用户的文案放 `src/i18n/locales/{ja,zh,en}.json`；语言无关的结构化数据放 `src/data/*.ts`。三个语言文件须保持结构一致——缺键警告只在 dev 触发，缺漏会静默上线。
- 区块的顺序与 id 定义在 `src/data/sections.ts`；id 同时是 URL hash、`data-section`、导航键与 i18n 键 `nav.<id>` / `sections.<id>.*`。增删或移动区块需同时改 `sections.ts`、`HomePage.vue` 与三语文案。
- 声库版本号等信息在 `src/data/voicebank.ts`、`src/data/downloads.ts` 与三语 changelog 中重复出现，改动时需一并更新。
- 代码注释使用中文。

## 授权 / Licensing

本仓库**代码与素材的授权状态不同**，请勿一概而论：

- **源码**（`src/`、`scripts/`、配置等）以 **MIT** 授权，见 [`LICENSE`](./LICENSE)。
- **素材**（`assets/`、`public/samples/` 下的立绘、彩蛋 GIF、声库设定与规约、视频封面等）**不在 MIT 范围内**，著作权归原权利人所有（All Rights Reserved）。详见 [`NOTICE`](./NOTICE)。

换句话说：欢迎借鉴站点代码搭建你自己的声库宣传页，但立绘与音源素材不可据 MIT 使用；素材的使用一律以 `assets/voicebank/readme-{jp,cn,en}.txt` 的**使用规约**为准。

## 已知待办

- `src/config.ts` 的 `SITE_URL` 为 `null`，canonical / hreflang / OGP 目前退化为相对路径；确定域名后填写即可自动切换为绝对地址。
- `config.ts` 指向 `/og/<locale>.png` 与 `scripts/gen-og.mjs`，但该脚本与 `public/og/` 尚未创建，OGP 图片当前 404。
- `public/samples/*.jpg` 三张视频封面的版权来源与署名待确认（见 `NOTICE`）。
