<script setup lang="ts">
/**
 * 利用規約。
 *
 * 长文阅读的版面策略：
 *   1. 宽屏放宽最大宽度并排 2~3 栏，字号随视口放大，避免大屏上被 1180px 钉成窄条；
 *   2. 栏内不做"等高平衡"，而是让每栏填满面板高度、内容向右续栏（column-fill: auto），
 *      所以永远不会在栏内纵向滚动——多出的内容改为横向滑动（Shift+滚轮 / 触控板 / ←→ 键）。
 *      这样阅读顺序始终是"一栏读到底再右移"，不会出现两栏等高一滚就错位的问题；
 *   3. 「著作权」固定在底部条，联系方式省略，改为跳转到「制作名单」并高亮作者。
 *
 * 窄屏（≤980px）回退为单栏纵向滚动，滚动方向与阅读顺序一致。
 * 横向滚动区以 [data-scrollable-x] 标记，滚动接管逻辑见 useFullPageScroll。
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import M3Icon from '@/components/M3Icon.vue'
import { sections } from '@/data/sections'
import { authorCreditKey } from '@/data/credits'
import { useScrollContext } from '@/composables/useScrollContext'

defineProps<{ active: boolean }>()

interface TermsBlock {
  heading: string
  numbered?: boolean
  items: string[]
}

const { t, tm, locale } = useI18n()
const { goToId, requestHighlight } = useScrollContext()

const blocks = () => tm('terms.blocks') as unknown as TermsBlock[]
const copyright = () => tm('terms.copyright') as string[]

/* ---------------------------------------------------- 横向多栏滚动 */

/** 最多排 3 栏；超过高度就改为横向滑动，而不是纵向滚动 */
const MAX_COLUMNS = 3
/** 内容区最大宽度：超宽屏上避免单栏行宽无限拉长 */
const CONTENT_CAP = 1900

const colsRef = ref<HTMLElement | null>(null)
const hasOverflowX = ref(false)
const atStart = ref(true)
const atEnd = ref(true)

/** 视口尺寸变化的合并帧：applyColumns 会写被测元素宽度，放在 rAF 里避免重排抖动 */
let resizeFrame = 0

/**
 * 按内容挑选栏数（"视情况 2/3 栏"）：先用尽量宽的两栏，放不下再增到三栏，
 * 只有三栏仍溢出才横向滑动。栏数由内容高度与列高共同决定，因此不会出现空栏。
 */
function applyColumns() {
  const el = colsRef.value
  if (!el) return
  if (window.matchMedia('(max-width: 980px)').matches) {
    el.style.removeProperty('column-count')
    el.style.removeProperty('width')
    return
  }
  const track = el.parentElement
  const available = track ? track.clientWidth : el.clientWidth
  const width = Math.min(available, CONTENT_CAP)
  const widthCss = `${width}px`
  if (el.style.width !== widthCss) el.style.width = widthCss

  let columns = width >= 900 ? 2 : 1
  el.style.columnCount = String(columns)
  while (columns < MAX_COLUMNS && el.scrollWidth > el.clientWidth + 1) {
    columns += 1
    el.style.columnCount = String(columns)
  }
  if (el.style.columnCount !== String(columns)) el.style.columnCount = String(columns)
}

function syncScrollState() {
  const el = colsRef.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  hasOverflowX.value = max > 1
  atStart.value = el.scrollLeft <= 1
  atEnd.value = el.scrollLeft >= max - 1
}

function relayout() {
  applyColumns()
  syncScrollState()
}

function scrollByColumn(direction: 1 | -1) {
  const el = colsRef.value
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const step = Math.max(140, el.clientWidth * 0.9)
  el.scrollBy({ left: direction * step, behavior: reduce ? 'auto' : 'smooth' })
}

function goToCredits() {
  goToId('credits')
  requestHighlight('credits', authorCreditKey)
}

function onResize() {
  window.cancelAnimationFrame(resizeFrame)
  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = 0
    relayout()
  })
}

onMounted(async () => {
  await nextTick()
  relayout()
  colsRef.value?.addEventListener('scroll', syncScrollState, { passive: true })
  window.addEventListener('resize', onResize)
  // 字体异步加载完成后行高会变，栏数与是否溢出都要重新测量
  document.fonts?.ready.then(relayout)
})

onBeforeUnmount(() => {
  colsRef.value?.removeEventListener('scroll', syncScrollState)
  window.removeEventListener('resize', onResize)
  window.cancelAnimationFrame(resizeFrame)
})

// 切换语言会同时改变文案长度与字号，栏数与是否溢出都要重算
watch(locale, async () => {
  await nextTick()
  relayout()
})
</script>

<template>
  <SectionShell id="terms" :active="active" wide>
    <SectionHeader
      :index="5"
      :total="sections.length"
      section-id="terms"
      :lead="t('terms.lead')"
    />

    <div class="terms-body">
      <div
        class="terms-track"
        :data-overflow="hasOverflowX ? 'true' : 'false'"
        :data-start="atStart ? 'true' : 'false'"
        :data-end="atEnd ? 'true' : 'false'"
      >
        <div ref="colsRef" class="terms-columns" data-scrollable-x>
          <section
            v-for="(block, index) in blocks()"
            :key="index"
            class="terms-block"
            :class="{ 'is-group-heading': !block.items.length }"
          >
            <h3 class="block-heading md-title-medium">{{ block.heading }}</h3>
            <ol v-if="block.numbered" class="block-items is-numbered">
              <li v-for="(item, i) in block.items" :key="i" class="md-body-medium">
                {{ item }}
              </li>
            </ol>
            <p v-else-if="block.items.length" class="block-items md-body-medium">
              {{ block.items[0] }}
            </p>
          </section>
        </div>

        <button
          v-show="hasOverflowX"
          v-ripple
          type="button"
          class="terms-arrow is-prev"
          :disabled="atStart"
          :aria-label="t('terms.scrollPrev')"
          @click="scrollByColumn(-1)"
        >
          <M3Icon name="chevron_left" :size="24" />
        </button>
        <button
          v-show="hasOverflowX"
          v-ripple
          type="button"
          class="terms-arrow is-next"
          :disabled="atEnd"
          :aria-label="t('terms.scrollNext')"
          @click="scrollByColumn(1)"
        >
          <M3Icon name="chevron_right" :size="24" />
        </button>
      </div>

      <footer class="terms-bar">
        <div class="terms-bar-info">
          <p class="terms-bar-note md-body-small">{{ t('terms.sourceNote') }}</p>
          <ul class="terms-copyright md-body-small">
            <li v-for="(item, i) in copyright()" :key="i">{{ item }}</li>
          </ul>
        </div>

        <button
          v-ripple
          type="button"
          class="terms-credits md-label-large md-state-layer"
          @click="goToCredits"
        >
          <span>{{ t('terms.creditsLink') }}</span>
          <M3Icon name="chevron_right" :size="18" />
        </button>
      </footer>
    </div>
  </SectionShell>
</template>

<style scoped>
.terms-body {
  /* 撑满面板剩余高度，让横向多栏区的高度成为确定值 */
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* 正文字号随视口高度/宽度微调：矮屏收进一屏，大屏放大到舒适尺寸。
     日文与英文的规约原文比中文长，同样版心下用更小的字号。 */
  font-size: clamp(10.5px, min(1.45vh, 0.85vw), 16px);
}

html[lang='ja'] .terms-body {
  font-size: clamp(10px, min(1.35vh, 0.82vw), 15.5px);
}

html[lang='en'] .terms-body {
  font-size: clamp(9.5px, min(1.2vh, 0.72vw), 13.5px);
}

.terms-body .md-title-medium {
  font-size: 1.15em;
}

.terms-body .md-body-medium {
  font-size: 1em;
  line-height: 1.65;
}

.terms-body .md-body-small {
  font-size: 0.9em;
  line-height: 1.55;
}

/* ---------------------------------------------------------- 多栏区 */

.terms-track {
  position: relative;
  flex: 1;
  min-height: 0;
}

.terms-columns {
  /* 填满列高再向右续列：内容永不纵向溢出，多出的列靠横向滑动查看 */
  height: 100%;
  width: 100%;
  margin-inline: auto;
  column-count: 2;
  column-fill: auto;
  column-gap: clamp(24px, 3vw, 64px);
  column-rule: 1px solid var(--md-sys-color-outline-variant);
  overflow-x: auto;
  overflow-y: hidden;
  /* 横向到边时不触发浏览器手势/滚动链 */
  overscroll-behavior-x: contain;
  /* 给横向滚动条留位置，避免盖住最后一行的文字 */
  padding-bottom: 10px;
}

.terms-block {
  break-inside: avoid;
  margin-bottom: 16px;
}

.terms-block:last-child {
  margin-bottom: 0;
}

/* 分组标题（只有标题、无正文）与紧随其后的条款保持同栏，
   避免标题单独落在一栏末尾。只给空标题块加，其它分栏断点照常自由。 */
.terms-block.is-group-heading {
  break-after: avoid;
}

.block-heading {
  margin: 0 0 8px;
  color: var(--md-sys-color-primary);
  /* 保底：标题不与自己的正文断开 */
  break-after: avoid;
}

.block-items {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--md-sys-color-on-surface-variant);
}

.block-items.is-numbered {
  counter-reset: terms;
}

.block-items.is-numbered li {
  counter-increment: terms;
  display: flex;
  gap: 10px;
}

.block-items.is-numbered li::before {
  content: counter(terms) '.';
  flex: none;
  min-width: 1.4em;
  color: var(--md-sys-color-tertiary);
  font-variant-numeric: tabular-nums;
}

.block-items.is-plain li {
  display: block;
}

/* ------------------------------------------------- 左右滑动与渐隐 */

/* 两端渐隐：只在"该方向还有内容"时出现，暗示可以横向滑动 */
.terms-track::before,
.terms-track::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 10px;
  width: 28px;
  z-index: 1;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard);
}

.terms-track::before {
  left: 0;
  background: linear-gradient(to right, var(--md-sys-color-surface), transparent);
}

.terms-track::after {
  right: 0;
  background: linear-gradient(to left, var(--md-sys-color-surface), transparent);
}

.terms-track[data-overflow='true'][data-start='false']::before,
.terms-track[data-overflow='true'][data-end='false']::after {
  opacity: 1;
}

.terms-arrow {
  position: absolute;
  top: 50%;
  translate: 0 -50%;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface-variant);
  box-shadow: 0 2px 10px rgb(0 0 0 / 0.28);
  transition:
    opacity var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard),
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.terms-arrow.is-prev {
  left: -8px;
}

.terms-arrow.is-next {
  right: -8px;
}

.terms-arrow:disabled {
  opacity: 0;
  pointer-events: none;
}

@media (hover: hover) {
  .terms-arrow:not(:disabled):hover {
    background-color: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-on-surface);
  }
}

/* ------------------------------------------------------------ 底部条 */

.terms-bar {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 24px;
  padding-top: 8px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-outline);
}

.terms-bar-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.terms-bar-note {
  margin: 0;
}

.terms-copyright {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 2px 18px;
}

.terms-credits {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  padding: 6px 10px 6px 14px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-primary);
  transition: background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

@media (hover: hover) {
  .terms-credits:hover {
    background-color: var(--md-sys-color-surface-container-high);
  }
}

/* 矮屏收一档间距：大屏享受舒展的行距，短屏则优先保证不用横向滑动 */
@media (max-height: 820px) {
  .terms-body {
    gap: 10px;
  }

  .terms-body .md-body-medium {
    line-height: 1.5;
  }

  .terms-body .md-body-small {
    line-height: 1.45;
  }

  .terms-block {
    margin-bottom: 10px;
  }

  .block-heading {
    margin-bottom: 6px;
  }

  .block-items {
    gap: 5px;
  }
}

/* ------------------------------------------------ 窄屏：单栏纵向 */

@media (max-width: 980px) {
  .terms-body {
    flex: none;
    display: block;
  }

  .terms-track {
    position: static;
    min-height: 0;
  }

  .terms-columns {
    height: auto;
    column-count: 1;
    column-fill: balance;
    column-rule: none;
    overflow: visible;
    padding-bottom: 0;
  }

  .terms-track::before,
  .terms-track::after,
  .terms-arrow {
    display: none;
  }

  .terms-bar {
    margin-top: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .terms-track::before,
  .terms-track::after,
  .terms-arrow,
  .terms-credits {
    transition: none;
  }
}
</style>
