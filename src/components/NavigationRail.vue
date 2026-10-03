<script setup lang="ts">
/**
 * 分屏导航。
 *
 * 桌面端是 Material You 的 Navigation rail（左侧竖排，图标 + 文字）；窄屏
 * 自动切换为底部的横向圆点条，避免 9 个图标挤在手机底栏里。
 *
 * 选中态用每个按钮自带的胶囊（.nav-item::before）表达，不做任何位移动画，
 * 避免切换时抖动。层级固定为：胶囊 0 < 涟漪/状态层 1 < 图标与文字 2。
 *
 * 首屏（activeIndex 0）隐藏整条导航轨，内容不再被导轨挤位；进入第二屏起
 * 导航轨从左侧滑入（桌面端）。
 */
import { useI18n } from 'vue-i18n'
import M3Icon from './M3Icon.vue'
import { sections } from '@/data/sections'

defineProps<{
  activeIndex: number
}>()

const emit = defineEmits<{ select: [index: number] }>()

const { t } = useI18n()
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

/* 首屏隐藏、第二屏起从左侧滑入（仅桌面端） */
@media (min-width: 861px) {
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
  line-height: 1.2;
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

@media (max-width: 860px) {
  .section-nav {
    inset: auto 0 0 0;
    width: 100%;
    height: auto;
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
    background-color: var(--md-sys-color-surface-container-low);
    box-shadow: inset 0 1px 0 var(--md-sys-color-outline-variant);
    /* 底部圆点条常驻，不做隐藏/滑入 */
    transform: none;
    opacity: 1;
  }

  .nav-list {
    flex-direction: row;
    justify-content: center;
    gap: 4px;
    width: 100%;
    overflow: visible;
  }

  .nav-item {
    width: auto;
    padding: 8px;
    border-radius: var(--md-sys-shape-corner-full);
  }

  .nav-icon-wrap {
    width: 40px;
    height: 40px;
  }

  .nav-label,
  .nav-progress {
    display: none;
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
