<script setup lang="ts">
/**
 * 分屏导航。
 *
 * 桌面端是 Material You 的 Navigation rail（左侧竖排，图标 + 文字）；窄屏
 * （窄屏或触屏竖屏）改为底部的胶囊：只显示「当前分屏 + 菜单」，点开后在面板里
 * 列出全部 9 项。这样底栏不会被 9 个图标挤到溢出屏幕，也不会越出正文。
 *
 * 首屏（activeIndex 0）隐藏导航：桌面导轨从左缘滑入/收折，移动端胶囊向底边
 * （手机）或所在角（平板）收折。胶囊宽度随当前分屏名变化并做过渡。
 *
 * 呈现方式按视口选择（见 placement）：
 *   - 手机竖屏（≤600px）：底部抽屉，可下拉收回；
 *   - 平板竖屏（coarse + portrait，>600px）：胶囊收在右下角，目录从该角向上展开；
 *   - 其余（含窄桌面窗口）：居中弹窗。
 *
 * 选中态用每个按钮自带的胶囊（.nav-item::before）表达，不做位移动画，避免切换抖动。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import M3Dialog from './M3Dialog.vue'
import M3Icon from './M3Icon.vue'
import { useScrollContext } from '@/composables/useScrollContext'
import { sections } from '@/data/sections'

const props = defineProps<{
  activeIndex: number
}>()

const emit = defineEmits<{ select: [index: number] }>()

const { t } = useI18n()
const { suspended } = useScrollContext()

const menuOpen = ref(false)
const currentSection = computed(() => sections[props.activeIndex] ?? sections[0])
const currentLabel = computed(() => t(`nav.${currentSection.value.id}`))
const triggerLabel = computed(() => `${t('common.sectionNav')}：${currentLabel.value}`)

// 菜单打开期间挂起整屏翻页，避免键盘方向键在弹窗背后换屏
watch(menuOpen, (open) => {
  suspended.value = open
})

const choose = (index: number) => {
  emit('select', index)
  menuOpen.value = false
}

/* ------------------------------------------------------------ 视口判定 */

const NARROW_QUERY = '(max-width: 600px)'
const COARSE_QUERY = '(pointer: coarse)'

const isNarrow = ref(false)
const isCoarse = ref(false)

let narrowMq: MediaQueryList | undefined
let coarseMq: MediaQueryList | undefined

const syncViewport = () => {
  isNarrow.value = narrowMq?.matches ?? false
  isCoarse.value = coarseMq?.matches ?? false
}

onMounted(() => {
  narrowMq = window.matchMedia(NARROW_QUERY)
  coarseMq = window.matchMedia(COARSE_QUERY)
  syncViewport()
  narrowMq.addEventListener('change', syncViewport)
  coarseMq.addEventListener('change', syncViewport)
})

onBeforeUnmount(() => {
  narrowMq?.removeEventListener('change', syncViewport)
  coarseMq?.removeEventListener('change', syncViewport)
})

/** 手机抽屉 / 平板角落菜单 / 居中弹窗 */
const placement = computed<'center' | 'sheet' | 'corner'>(() => {
  if (isNarrow.value) return 'sheet'
  if (isCoarse.value) return 'corner'
  return 'center'
})

/** 首屏不显示导航 */
const showPill = computed(() => props.activeIndex > 0)

/** 平板角落菜单打开时，把胶囊抬到遮罩之上，让背景模糊不覆盖它 */
const cornerMenuOpen = computed(() => menuOpen.value && placement.value === 'corner')

/* -------------------------------------------------------- 胶囊宽度过渡 */

const triggerEl = ref<HTMLElement | null>(null)
const reduceMotion = ref(false)
let widthTimer = 0

onMounted(() => {
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

// 宽度不能用 CSS 在 auto↔auto 间过渡：量好新文本的自然宽度后，
// 显式从旧宽过渡到新宽，结束后再交还给 auto（以便换语言 / 字体加载后自适应）。
watch(currentLabel, async () => {
  const el = triggerEl.value
  if (!el || reduceMotion.value) return
  const from = el.getBoundingClientRect().width
  if (!from) return
  el.style.width = `${from}px`
  await nextTick()
  el.style.width = 'auto'
  const to = el.getBoundingClientRect().width
  if (Math.abs(to - from) < 1) {
    el.style.width = ''
    return
  }
  el.style.width = `${from}px`
  void el.offsetWidth
  el.style.width = `${to}px`
  window.clearTimeout(widthTimer)
  widthTimer = window.setTimeout(() => {
    el.style.width = ''
  }, 320)
})

onBeforeUnmount(() => window.clearTimeout(widthTimer))
</script>

<template>
  <nav
    class="section-nav"
    :class="{ 'is-visible': showPill, 'is-menu-open': cornerMenuOpen }"
    :aria-label="t('common.sectionNav')"
  >
    <ul class="nav-list">
      <li v-for="(section, index) in sections" :key="section.id">
        <button
          class="nav-item md-state-layer"
          :class="{ 'is-active': index === activeIndex }"
          type="button"
          :aria-current="index === activeIndex ? 'true' : undefined"
          :title="t(`nav.${section.id}`)"
          @click="emit('select', index)"
        >
          <span v-ripple class="nav-icon-wrap">
            <M3Icon :name="section.icon" :size="22" class="nav-icon" />
          </span>
          <span class="nav-label md-label-small">{{ t(`nav.${section.id}`) }}</span>
        </button>
      </li>
    </ul>

    <div class="nav-progress" aria-hidden="true">
      <span
        class="nav-progress-bar"
        :style="{ height: `${((activeIndex + 1) / sections.length) * 100}%` }"
      />
    </div>

    <!-- 移动端（窄屏或触屏竖屏）：当前分屏 + 菜单入口 -->
    <button
      ref="triggerEl"
      v-ripple
      class="nav-mobile-trigger md-state-layer"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="menuOpen"
      :aria-label="triggerLabel"
      @click="menuOpen = !menuOpen"
    >
      <M3Icon name="menu" :size="22" class="nav-mobile-menu-icon" />
      <span class="nav-mobile-label md-label-large">{{ currentLabel }}</span>
      <M3Icon name="expand_less" :size="20" class="nav-mobile-chevron" />
    </button>

    <M3Dialog
      :open="menuOpen"
      :label="t('common.sectionNav')"
      :placement="placement"
      @close="menuOpen = false"
    >
      <h2 class="nav-sheet-title md-title-medium">{{ t('common.sectionNav') }}</h2>
      <ul class="nav-sheet-list">
        <li v-for="(section, index) in sections" :key="section.id">
          <button
            v-ripple
            class="nav-sheet-item md-state-layer"
            :class="{ 'is-active': index === activeIndex }"
            type="button"
            :aria-current="index === activeIndex ? 'true' : undefined"
            @click="choose(index)"
          >
            <M3Icon :name="section.icon" :size="22" class="nav-sheet-icon" />
            <span class="nav-sheet-label md-label-large">{{ t(`nav.${section.id}`) }}</span>
            <M3Icon
              v-if="index === activeIndex"
              name="check"
              :size="20"
              class="nav-sheet-check"
            />
          </button>
        </li>
      </ul>
    </M3Dialog>
  </nav>
</template>

<style scoped>
.section-nav {
  position: fixed;
  z-index: 900;
  /* 居中范围排除固定顶栏：从顶栏下缘起算，否则整条导轨会偏高半个顶栏高度 */
  inset: calc(var(--app-bar-height) + env(safe-area-inset-top, 0px)) auto 0 0;
  width: var(--app-rail-width);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  pointer-events: none;
  transition:
    transform var(--md-sys-motion-duration-medium4) var(--md-sys-motion-easing-emphasized),
    opacity var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard);
}

/* 首屏隐藏、第二屏起从左侧滑入（仅桌面端：鼠标宽屏 / 横屏平板） */
@media (min-width: 861px) and (pointer: fine), (min-width: 861px) and (orientation: landscape) {
  .section-nav {
    transform: translateX(-110%);
    opacity: 0;
  }

  .section-nav.is-visible {
    transform: none;
    opacity: 1;
  }

  .section-nav:not(.is-visible) .nav-list {
    pointer-events: none;
  }
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  pointer-events: auto;
}

.nav-list::-webkit-scrollbar {
  display: none;
}

.nav-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 76px;
  padding: 4px 4px 8px;
  border-radius: var(--md-sys-shape-corner-large);
  color: var(--md-sys-color-on-surface-variant);
  transition: color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

/* 图标胶囊：既是选中指示器，也是涟漪的裁剪范围（涟漪只出现在胶囊内） */
.nav-icon-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 56px;
  height: 32px;
  border-radius: var(--md-sys-shape-corner-full);
  transition: background-color var(--md-sys-motion-duration-medium2)
    var(--md-sys-motion-easing-emphasized);
}

.nav-item.is-active .nav-icon-wrap {
  background-color: var(--md-sys-color-surface-container);
}

.nav-item.is-active {
  color: var(--md-sys-color-on-surface);
}

@media (hover: hover) {
  .nav-item:not(.is-active):hover {
    color: var(--md-sys-color-on-surface);
  }
}

/* 图标压在涟漪之上 */
.nav-icon {
  position: relative;
  z-index: 1;
}

.nav-label {
  position: relative;
  z-index: 2;
  /* 与胶囊之间留出一段距离，而不是紧贴 */
  margin-top: 4px;
  font-size: 0.625rem;
  /* 行高必须容纳字形的升部与降部：1.2 时内容框只有 12px，而字形需要 14px，
     配合 overflow: hidden 会把英文字母（g / y / p）的下缘切掉。 */
  line-height: 1.5;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-progress {
  position: fixed;
  left: 6px;
  /* 与 .nav-list 共用同一中心：视口中心再下移半个顶栏高度 */
  top: calc(50% + (var(--app-bar-height) + env(safe-area-inset-top, 0px)) / 2);
  translate: 0 -50%;
  width: 2px;
  height: 96px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-outline-variant);
  opacity: 0.5;
}

.nav-progress-bar {
  display: block;
  width: 100%;
  background-color: var(--md-sys-color-primary);
  border-radius: inherit;
  transition: height var(--md-sys-motion-duration-medium4) var(--md-sys-motion-easing-emphasized);
}

/* 移动端紧凑栏入口：桌面端隐藏 */
.nav-mobile-trigger {
  display: none;
}

/* 分屏菜单（M3Dialog 内）：桌面端用不到，但样式无副作用 */
.nav-sheet-title {
  margin: 0 0 8px;
  padding-right: 44px;
  color: var(--md-sys-color-on-surface);
}

.nav-sheet-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-sheet-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 48px;
  padding: 0 12px;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface-variant);
}

.nav-sheet-item.is-active {
  color: var(--md-sys-color-on-surface);
  background-color: var(--md-sys-color-surface-container);
}

.nav-sheet-icon,
.nav-sheet-check {
  flex: none;
}

.nav-sheet-check {
  color: var(--md-sys-color-primary);
}

.nav-sheet-label {
  flex: 1;
  min-width: 0;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 860px), (pointer: coarse) and (orientation: portrait) {
  /* 底栏退化为一个居中的小胶囊：去掉整条底栏的底色与分隔线 */
  .section-nav {
    inset: auto 0 0 0;
    width: 100%;
    height: auto;
    padding: 6px 12px calc(var(--app-float-y) + env(safe-area-inset-bottom, 0px));
    background-color: transparent;
    box-shadow: none;
    transform: none;
    opacity: 1;
    pointer-events: auto;
    transform-origin: bottom center;
  }

  /* 首屏（未进入第二屏）向底边收折隐藏；进入第二屏起展开 */
  .section-nav:not(.is-visible) {
    transform: translateY(140%) scale(0.85);
    opacity: 0;
    pointer-events: none;
  }

  /* 桌面导轨整体让位给胶囊 */
  .nav-list,
  .nav-progress {
    display: none;
  }

  .nav-mobile-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    /* 不再铺满整条底栏，只按内容宽度居中成胶囊 */
    width: auto;
    max-width: min(100%, 320px);
    min-height: 40px;
    margin-inline: auto;
    padding: 0 14px 0 12px;
    border-radius: var(--md-sys-shape-corner-full);
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface);
    box-shadow: 0 2px 10px rgb(0 0 0 / 0.28);
    /* 宽度随当前分屏名变化做过渡（显式设宽由脚本负责） */
    transition: width var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized);
  }

  .nav-mobile-menu-icon,
  .nav-mobile-chevron {
    flex: none;
    color: var(--md-sys-color-on-surface-variant);
  }

  .nav-mobile-label {
    /* 内容宽度自适应的胶囊：不出现省略号；宽度伸展时文字自然裁切，不做淡入淡出或遮罩 */
    flex: 0 1 auto;
    min-width: 0;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
  }
}

/* 平板竖屏：胶囊收在右下角，目录也从该角向上展开 */
@media (pointer: coarse) and (orientation: portrait) and (min-width: 601px) {
  .section-nav {
    justify-content: flex-end;
    padding-right: max(var(--app-float-x), env(safe-area-inset-right, 0px));
    padding-left: 16px;
    transform-origin: bottom right;
  }

  .section-nav:not(.is-visible) {
    transform: translate(55%, 130%) scale(0.85);
  }

  .nav-mobile-trigger {
    margin-inline: 0;
    margin-left: auto;
  }

  /* 目录打开时抬到遮罩（z-index 1100）之上，使背景模糊不覆盖胶囊 */
  .section-nav.is-menu-open {
    z-index: 1200;
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-nav,
  .nav-item::before,
  .nav-progress-bar,
  .nav-mobile-trigger {
    transition: none;
  }
}
</style>
