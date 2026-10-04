<script setup lang="ts">
/**
 * 分屏导航。
 *
 * 桌面端是 Material You 的 Navigation rail（左侧竖排，图标 + 文字）；窄屏
 * （窄屏或触屏竖屏）改为底部的紧凑栏：只显示「当前分屏 + 菜单」，点开后在弹窗里
 * 列出全部 9 项。这样底栏不会被 9 个图标挤到溢出屏幕，也不会越出正文。
 *
 * 选中态用每个按钮自带的胶囊（.nav-item::before）表达，不做任何位移动画，
 * 避免切换时抖动。层级固定为：胶囊 0 < 涟漪/状态层 1 < 图标与文字 2。
 *
 * 首屏（activeIndex 0）隐藏整条导轨，内容不再被导轨挤位；进入第二屏起
 * 导航轨从左侧滑入（桌面端）。移动端紧凑栏常驻。
 */
import { computed, ref, watch } from 'vue'
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
</script>

<template>
  <nav
    class="section-nav"
    :class="{ 'is-visible': activeIndex > 0 }"
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
      v-ripple
      class="nav-mobile-trigger md-state-layer"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="menuOpen"
      :aria-label="triggerLabel"
      @click="menuOpen = true"
    >
      <M3Icon name="menu" :size="22" class="nav-mobile-menu-icon" />
      <span class="nav-mobile-label md-label-large">{{ currentLabel }}</span>
      <M3Icon name="expand_less" :size="20" class="nav-mobile-chevron" />
    </button>

    <M3Dialog :open="menuOpen" :label="t('common.sectionNav')" @close="menuOpen = false">
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
  inset: 0 auto 0 0;
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
  top: 50%;
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
  .section-nav {
    inset: auto 0 0 0;
    width: 100%;
    height: auto;
    padding: 6px 12px calc(6px + env(safe-area-inset-bottom, 0px));
    background-color: var(--md-sys-color-surface-container-low);
    box-shadow: inset 0 1px 0 var(--md-sys-color-outline-variant);
    /* 紧凑栏常驻，不做隐藏/滑入 */
    transform: none;
    opacity: 1;
    pointer-events: auto;
  }

  /* 桌面导轨整体让位给紧凑栏 */
  .nav-list,
  .nav-progress {
    display: none;
  }

  .nav-mobile-trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    padding: 0 16px;
    border-radius: var(--md-sys-shape-corner-full);
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface);
  }

  .nav-mobile-menu-icon,
  .nav-mobile-chevron {
    flex: none;
    color: var(--md-sys-color-on-surface-variant);
  }

  .nav-mobile-label {
    flex: 1;
    min-width: 0;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-nav,
  .nav-item::before,
  .nav-progress-bar {
    transition: none;
  }
}
</style>
