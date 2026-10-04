<script setup lang="ts">
/**
 * 表情包区（section id 仍为 surprise）。
 *
 * 19 个 GIF 转码片段：视频合计约 1.7MB、海报 WebP 合计约 375KB。为兼顾
 * 「一次看到全部」与省流量，本区不自动下载视频：
 *   - 主框默认只渲染当前片段的海报（<img>），点自定义播放按钮后才挂载 <video>；
 *     因此首屏与切换过程只请求极小的海报，视频按需加载。
 *   - 下方网格铺开全部片段，同样只加载懒加载的静态海报，点选即切换主框。
 *
 * 不使用浏览器原生播放器控件，播放/暂停由自绘按钮控制；进入即随机取一个。
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import M3Card from '@/components/M3Card.vue'
import M3Button from '@/components/M3Button.vue'
import M3Icon from '@/components/M3Icon.vue'
import { surpriseClips } from '@/data/surprise.generated'
import { sections } from '@/data/sections'

const props = defineProps<{ active: boolean }>()

const { t } = useI18n()

const currentIndex = ref(0)
/** 用户是否已主动开始播放：为 true 才挂载 <video> 并触发视频下载 */
const engaged = ref(false)
const isPaused = ref(false)
const failed = ref(false)
const videoEl = ref<HTMLVideoElement | null>(null)

const current = computed(() => surpriseClips[currentIndex.value])
const clipCount = computed(() => surpriseClips.length)

/** 循环切换片段；视频已挂载时由 :key 重挂新片段并自动续播。 */
function goTo(index: number) {
  if (clipCount.value === 0) return
  currentIndex.value = ((index % clipCount.value) + clipCount.value) % clipCount.value
  failed.value = false
}

function prev() {
  goTo(currentIndex.value - 1)
}

function next() {
  goTo(currentIndex.value + 1)
}

function pickRandom() {
  if (clipCount.value <= 1) {
    void startPlayback()
    return
  }
  // 避免连续两次抽到同一个
  let target = currentIndex.value
  while (target === currentIndex.value) {
    target = Math.floor(Math.random() * clipCount.value)
  }
  goTo(target)
}

function startPlayback() {
  const el = videoEl.value
  if (!el) return
  isPaused.value = false
  // play() 被策略拦截或被打断不算加载失败：保留海报与播放按钮即可，
  // 真正的解码/网络错误由 <video> 的 error 事件标记 failed。
  void el.play().catch(() => {
    isPaused.value = true
  })
}

async function togglePlay() {
  if (!engaged.value) {
    engaged.value = true
    await nextTick()
    startPlayback()
    return
  }
  const el = videoEl.value
  if (!el) return
  if (el.paused) startPlayback()
  else el.pause()
}

// 表情包是最后一屏：首屏挂载时不必预取，首次真正进入该屏才随机抽一个。
// 随机只换海报，不触发视频下载。
const started = ref(false)
watch(
  () => props.active,
  (active) => {
    if (active) {
      if (!started.value && clipCount.value > 0) {
        started.value = true
        currentIndex.value = Math.floor(Math.random() * clipCount.value)
      }
      return
    }
    // 离开该屏时暂停，避免在后台继续解码播放
    videoEl.value?.pause()
  },
  { immediate: true },
)
</script>

<template>
  <SectionShell id="surprise" :active="active" wide>
    <SectionHeader
      :index="9"
      :total="sections.length"
      section-id="surprise"
      :lead="t('surprise.lead')"
    />

    <div class="surprise-stage">
      <M3Card class="clip-card" padding="none" data-reveal style="--reveal-delay: 60ms">
        <div class="clip-frame">
          <img
            class="clip-poster"
            :src="current.poster"
            alt=""
            :width="current.width"
            :height="current.height"
            decoding="async"
          />

          <video
            v-if="engaged && !failed"
            :key="currentIndex"
            ref="videoEl"
            class="clip-video"
            :src="current.video"
            :width="current.width"
            :height="current.height"
            autoplay
            loop
            muted
            playsinline
            preload="none"
            @play="isPaused = false"
            @pause="isPaused = true"
            @error="failed = true"
          />

          <!-- 自绘播放/暂停：未播放时居中大按钮，播放中缩到右下角，避免遮挡画面 -->
          <button
            v-if="!failed"
            v-ripple
            type="button"
            class="clip-play md-state-layer"
            :class="{ 'is-playing': engaged && !isPaused }"
            :aria-label="engaged && !isPaused ? t('surprise.pause') : t('surprise.play')"
            @click="togglePlay"
          >
            <M3Icon :name="engaged && !isPaused ? 'pause' : 'play_arrow'" :size="engaged && !isPaused ? 18 : 30" />
          </button>

          <p v-if="failed" class="clip-error md-body-medium" role="status">
            {{ t('surprise.error') }}
          </p>
        </div>

        <div class="clip-bar">
          <div class="clip-nav">
            <button
              v-ripple
              type="button"
              class="icon-button md-state-layer"
              :aria-label="t('surprise.prev')"
              :disabled="clipCount <= 1"
              @click="prev"
            >
              <M3Icon name="chevron_left" :size="22" />
            </button>

            <span class="clip-index md-label-medium">
              {{ String(currentIndex + 1).padStart(2, '0') }}
              <span class="clip-sep" aria-hidden="true">/</span>
              {{ String(clipCount).padStart(2, '0') }}
            </span>

            <button
              v-ripple
              type="button"
              class="icon-button md-state-layer"
              :aria-label="t('surprise.next')"
              :disabled="clipCount <= 1"
              @click="next"
            >
              <M3Icon name="chevron_right" :size="22" />
            </button>
          </div>

          <M3Button
            variant="tonal"
            icon="auto_awesome"
            :disabled="clipCount <= 1"
            @click="pickRandom"
          >
            {{ t('surprise.another') }}
          </M3Button>
        </div>
      </M3Card>

      <div class="sticker-panel" data-reveal style="--reveal-delay: 120ms">
        <p class="sticker-caption md-label-medium">{{ t('surprise.all') }}</p>

        <ul class="sticker-grid">
          <li v-for="(clip, index) in surpriseClips" :key="clip.id">
            <button
              v-ripple
              type="button"
              class="sticker-cell md-state-layer"
              :class="{ 'is-active': index === currentIndex }"
              :aria-label="`${t('surprise.play')} ${index + 1}`"
              :aria-current="index === currentIndex ? 'true' : undefined"
              @click="goTo(index)"
            >
              <img
                class="sticker-thumb"
                :src="clip.poster"
                alt=""
                :width="clip.width"
                :height="clip.height"
                loading="lazy"
                decoding="async"
              />
            </button>
          </li>
        </ul>
      </div>
    </div>
  </SectionShell>
</template>

<style scoped>
.surprise-stage {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.clip-card {
  width: min(100%, 300px);
  overflow: hidden;
}

.clip-frame {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  background-color: var(--md-sys-color-surface-container-highest);
}

.clip-poster,
.clip-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.clip-play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: color-mix(in srgb, var(--md-sys-color-scrim) 56%, transparent);
  color: #fff;
  cursor: pointer;
  transition:
    top var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard),
    left var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard),
    width var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard),
    height var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard),
    opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

/* 播放中：缩到右下角并降低存在感，悬停/聚焦时恢复 */
.clip-play.is-playing {
  top: auto;
  left: auto;
  right: 10px;
  bottom: 10px;
  transform: none;
  width: 36px;
  height: 36px;
  opacity: 0.35;
}

.clip-play.is-playing:hover,
.clip-play.is-playing:focus-visible {
  opacity: 1;
}

.clip-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  color: var(--md-sys-color-error);
}

.clip-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px 6px 12px;
  background-color: var(--md-sys-color-surface-container-high);
}

.clip-nav {
  display: flex;
  align-items: center;
  gap: 2px;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
}

.icon-button:disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  cursor: not-allowed;
}

.clip-index {
  min-width: 58px;
  text-align: center;
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
}

.clip-sep {
  margin: 0 4px;
  opacity: 0.6;
}

.sticker-panel {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sticker-caption {
  color: var(--md-sys-color-on-surface-variant);
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sticker-cell {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  padding: 0;
  /* 预留 2px 边框，选中时只换颜色，格子尺寸与位置不变 */
  border: 2px solid transparent;
  border-radius: var(--md-sys-shape-corner-small);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-highest);
  cursor: pointer;
  opacity: 0.6;
  transition:
    opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    border-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.sticker-cell:hover,
.sticker-cell:focus-visible {
  opacity: 1;
}

/* 选中态沿用制作名单里作者卡的官方描边：2px primary 实心边框 */
.sticker-cell.is-active {
  opacity: 1;
  border-color: var(--md-sys-color-primary);
}

.sticker-thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 横屏：预览与表情列表左右分栏，标题仍在顶部通栏。
   预览按可用高度取尺，尽量大且恒为正方形。 */
@media (orientation: landscape) {
  .surprise-stage {
    display: grid;
    grid-template-columns: minmax(0, auto) minmax(0, 1fr);
    align-items: center;
    column-gap: clamp(16px, 3vw, 48px);
    width: 100%;
    /* 撑满标题以下的高度，使 cqh 可用（container-type: size 需要确定高度） */
    flex: 1 1 auto;
    min-height: 0;
    /* 让下方预览用容器查询单位按「本屏真实剩余高度」取尺 */
    container-type: size;
  }

  .clip-card {
    /* 正方形边长 = min(列宽上限, 可用高度 − 控制条, 硬上限)，恒为正 */
    width: min(46cqw, calc(100cqh - 3.5rem), 480px);
  }

  .sticker-panel {
    width: 100%;
    max-width: none;
    min-width: 0;
  }
}

/* 桌面 / 平板横屏：与使用条款页一致打破 1180px 页宽（SectionShell 的 wide），
   预览上限放宽、表情网格放大；≤860px 的移动端不受影响。 */
@media (orientation: landscape) and (min-width: 861px) {
  .clip-card {
    /* 抬高硬上限，让预览继续按可用高度生长 */
    width: min(46cqw, calc(100cqh - 3.5rem), 560px);
  }

  .sticker-grid {
    /* 从基线的 52px 放大，随视口宽度在 72~96px 浮动，
       避免 1024×768 这类矮横屏行数过多把面板撑出滚动 */
    grid-template-columns: repeat(auto-fill, minmax(clamp(72px, 5vw, 96px), 1fr));
  }
}

/* 矮横屏（横屏手机 / 小窗口）：标题区让位给预览，收起引导语并收紧间距 */
@media (orientation: landscape) and (max-height: 560px) {
  :deep(.section-header) {
    gap: 4px;
    margin-bottom: 8px;
  }

  :deep(.section-lead) {
    display: none;
  }
}

/* 平板竖屏：宽度足够，放大播放卡与表情网格，避免内容过小、两侧留白 */
@media (pointer: coarse) and (orientation: portrait) and (min-width: 700px) {
  .clip-card {
    width: min(100%, 440px);
  }

  .sticker-panel {
    max-width: 820px;
  }

  .sticker-grid {
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  }
}
</style>
