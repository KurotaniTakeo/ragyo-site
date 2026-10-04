<script setup lang="ts">
/**
 * 视频队列。
 *
 * 横向滚动（隐藏滚动条）+ snap。当某一侧还有内容时，在该侧显示渐变遮罩与圆形
 * 箭头，为桌面鼠标提供翻页入口；触屏靠滑动，只保留渐变（CSS 隐藏箭头）。
 *
 * 队列末尾附带「更多稿件待收录」占位卡，与稿件卡同宽。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import M3Icon from './M3Icon.vue'
import VideoCard from './VideoCard.vue'
import MorePendingCard from './MorePendingCard.vue'
import type { VideoWork } from '@/data/samples'

defineProps<{ title: string; items: VideoWork[] }>()

const { t } = useI18n()

const track = ref<HTMLElement | null>(null)
const atStart = ref(true)
const atEnd = ref(true)

function update() {
  const el = track.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  atStart.value = el.scrollLeft <= 1
  atEnd.value = max <= 1 || el.scrollLeft >= max - 1
}

function scrollByPage(direction: -1 | 1) {
  const el = track.value
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollBy({
    left: direction * el.clientWidth * 0.85,
    behavior: reduce ? 'auto' : 'smooth',
  })
}

let observer: ResizeObserver | undefined

onMounted(() => {
  update()
  if (track.value) {
    observer = new ResizeObserver(update)
    observer.observe(track.value)
  }
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div class="video-queue">
    <h3 class="video-queue-title md-title-medium">{{ title }}</h3>

    <div class="video-scroller">
      <ul ref="track" class="video-track" @scroll.passive="update">
        <li v-for="video in items" :key="video.id" class="video-slide">
          <VideoCard :video="video" />
        </li>
        <li class="video-slide">
          <MorePendingCard />
        </li>
      </ul>

      <span class="video-fade is-left" :class="{ 'is-visible': !atStart }" aria-hidden="true" />
      <span class="video-fade is-right" :class="{ 'is-visible': !atEnd }" aria-hidden="true" />

      <button
        v-ripple
        class="video-arrow is-left md-state-layer"
        :class="{ 'is-visible': !atStart }"
        type="button"
        :aria-label="t('samples.scrollLeft')"
        @click="scrollByPage(-1)"
      >
        <M3Icon name="chevron_left" :size="22" />
      </button>
      <button
        v-ripple
        class="video-arrow is-right md-state-layer"
        :class="{ 'is-visible': !atEnd }"
        type="button"
        :aria-label="t('samples.scrollRight')"
        @click="scrollByPage(1)"
      >
        <M3Icon name="chevron_right" :size="22" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.video-queue {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.video-queue-title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.video-scroller {
  position: relative;
  min-width: 0;
}

.video-track {
  list-style: none;
  margin: 0;
  padding: 0 0 6px;
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.video-track::-webkit-scrollbar {
  display: none;
}

.video-slide {
  flex: 0 0 clamp(200px, 26vw, 260px);
  scroll-snap-align: start;
  display: flex;
}

.video-slide > * {
  flex: 1;
  min-width: 0;
}

/* 左右渐变遮罩：从分屏底色淡出，表示该侧还有内容 */
.video-fade {
  position: absolute;
  top: 0;
  bottom: 6px;
  width: 64px;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard);
  z-index: 1;
}

.video-fade.is-left {
  left: 0;
  background: linear-gradient(90deg, var(--md-sys-color-surface), transparent);
}

.video-fade.is-right {
  right: 0;
  background: linear-gradient(270deg, var(--md-sys-color-surface), transparent);
}

.video-fade.is-visible {
  opacity: 1;
}

/* 圆形箭头：细指针（鼠标）才出现，触屏只留渐变 */
.video-arrow {
  position: absolute;
  top: calc(50% - 3px);
  translate: 0 -50%;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.28);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard);
  z-index: 2;
}

.video-arrow.is-left {
  left: 8px;
}

.video-arrow.is-right {
  right: 8px;
}

.video-arrow.is-visible {
  opacity: 1;
  pointer-events: auto;
}

@media (pointer: coarse) {
  .video-arrow {
    display: none;
  }
}

@media (max-width: 980px) {
  .video-slide {
    flex-basis: min(46vw, 200px);
  }

  .video-fade {
    width: 48px;
  }
}
</style>
