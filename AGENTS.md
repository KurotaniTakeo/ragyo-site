# AGENTS.md

Promotional site for the "Ragyo" UTAU/OpenUTAU voicebank: a single static, pre-rendered page. Vue 3 + Vite + vite-ssg + Tailwind v4 + vue-i18n, TypeScript strict.

## Commands
- `pnpm dev` — Vite dev server. Use **pnpm** (`pnpm-lock.yaml`); do not use npm/yarn.
- `pnpm typecheck` — `vue-tsc --noEmit`. This is the **only** automated check; there is no linter, test suite, or CI.
- `pnpm build` — `vite-ssg build`, pre-renders `/ja/ /zh/ /zh-Hant/ /en/` into static HTML in `dist/`.
- `pnpm preview` — serve the built `dist/`.
- Generators: `pnpm gen:palette`, `pnpm gen:images`, `pnpm gen:surprise`.

## Generated files — never hand-edit
Anything headed "自动生成，请勿手动编辑" is an output; change the script/input and re-run:
- `src/styles/m3-tokens.css` ← `scripts/gen-palette.mjs` (seed colors at top of the script)
- `src/data/assets.generated.ts` + `public/img/generated/*` ← `scripts/gen-images.mjs` + `scripts/assets.manifest.json`
- `src/data/surprise.generated.ts` + `public/surprise/generated/*` ← `scripts/gen-surprise.mjs`

`*.generated.ts` are committed, but the image output dirs are gitignored. After a fresh clone, run `pnpm gen:images` and `pnpm gen:surprise` before `build`/`preview`, or images 404 (only the inline LQIP shows).

Prereqs: `gen:surprise` needs `ffmpeg`/`ffprobe` (H.264/libx264) on PATH. `gen:palette` relies on `scripts/esm-ext-hook.mjs` because `@material/material-color-utilities` ships extensionless relative imports that Node's ESM resolver rejects.

The surface color `#505678` is hardcoded in both `gen-images.mjs` and `gen-surprise.mjs` to composite transparent art. If `gen:palette` changes `--md-sys-color-surface`, update both.

Illustration sources under `assets/illustration/character/` use English filenames (e.g. `pockets-smile-costume-1.png`); the naming convention plus a mapping back to the original Chinese names live in `assets/illustration/character/README.md`. The only source of truth for filenames and derived rules is `scripts/assets.manifest.json`. Reference images by semantic key via `src/data/assets.ts`, never by filename.

## Architecture facts that are easy to miss
- **SSG only**: one static route per locale (`/ja/`, `/zh/`, `/zh-Hant/`, `/en/`), deliberately not a dynamic `/:locale`, so each gets correct `<html lang>`, title, OGP and hreflang. Don't collapse it.
- SSG runs on Node: guard browser APIs (`window`, `localStorage`, `matchMedia`) with `import.meta.env.SSR` or run them in `onMounted`.
- Locale source of truth is **route meta**, not the i18n instance — `App.vue` watches the route and sets `locale`. Root `/` is redirected client-side by the inline script in `index.html` (localStorage key `ragyo.locale`).
- The site's single scroll container (`.snap-scroller`) lives in `App.vue`; `views/HomePage.vue` only renders the 9 sections. Full-page scrolling = CSS scroll-snap plus a desktop wheel-hijack in `composables/useFullPageScroll.ts`. `SectionShell.vue` must keep rendering `data-section` / `data-scrollable` — that logic queries them.
- Section order/ids live in `src/data/sections.ts`. An id doubles as the URL hash, `data-section`, nav key, and i18n keys `nav.<id>` / `sections.<id>.*`. Adding or moving a section means editing `sections.ts`, `HomePage.vue`, and all three locale files.
- Tailwind v4 is CSS-first: theme tokens are declared in `@theme` in `src/styles/main.css`; there is no `tailwind.config.js`.
- Alias `@` → `src/`.

## Content conventions
- User-facing prose goes in `src/i18n/locales/{ja,zh,zh-Hant,en}.json`; language-invariant structured data goes in `src/data/*.ts`. Keep the four locale files structurally identical — missing-key warnings fire only in dev, so gaps ship silently.
- Facts like the voicebank version are duplicated across `src/data/voicebank.ts`, `src/data/downloads.ts`, and the locale changelog; update all.
- Code comments are written in Chinese; match that style.
- `SITE_URL` in `src/config.ts` is `null`, so canonical/hreflang/OGP fall back to relative URLs. `config.ts` points at `/og/<locale>.png` and `scripts/gen-og.mjs`, but neither the script nor `public/og/` exists yet, so OGP images currently 404.
