<script setup lang="ts">
/**
 * 试听播放器。
 *
 * 音频一律 preload="none"：试听曲目可能有十几首，
 * 全部预加载会让移动端流量与首屏都很难看，点击才发起请求。
 */
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import M3Icon from './M3Icon.vue'
import M3Card from './M3Card.vue'
import type { Sample } from '@/data/samples'

const props = defineProps<{ sample: Sample }>()

const { t, locale } = useI18n()

const audio = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const loading = ref(false)

const title = computed(() => props.sample.title[locale.value as 'ja'] ?? props.sample.title.ja)

const progress = computed(() =>
  duration.value > 0 ? Math.min(100, (currentTime.value / duration.value) * 100) : 0,
)

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

async function toggle() {
  const el = audio.value
  if (!el) return

  if (playing.value) {
    el.pause()
    return
  }

  loading.value = true
  try {
    await el.play()
  } catch {
    playing.value = false
  } finally {
    loading.value = false
  }
}

function seek(event: MouseEvent) {
  const el = audio.value
  if (!el || !duration.value) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  el.currentTime = Math.max(0, Math.min(duration.value, ratio * duration.value))
}

onBeforeUnmount(() => audio.value?.pause())
</script>

<template>
  <M3Card class="sample-card" padding="sm">
    <div class="sample-main">
      <button
        v-ripple
        class="sample-play md-state-layer"
        type="button"
        :aria-label="playing ? 'pause' : 'play'"
        @click="toggle"
      >
        <M3Icon :name="playing ? 'pause' : 'play_arrow'" :size="22" />
      </button>

      <div class="sample-info">
        <div class="sample-head">
          <span class="md-title-medium">{{ title }}</span>
          <span v-if="sample.tone" class="sample-tone md-label-small">{{ sample.tone }}</span>
        </div>
        <span v-if="sample.credit" class="sample-credit md-body-small">{{ sample.credit }}</span>
      </div>
    </div>

    <div class="sample-progress">
      <button
        class="track md-state-layer"
        type="button"
        :aria-label="`${formatTime(currentTime)} / ${formatTime(duration)}`"
        @click="seek"
      >
        <span class="track-fill" :style="{ width: `${progress}%` }" />
      </button>
      <span class="sample-time md-label-small">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </span>
    </div>

    <span class="sample-kind md-label-small">
      {{ t(sample.kind === 'demo' ? 'samples.demoLabel' : 'samples.rawLabel') }}
    </span>

    <audio
      ref="audio"
      :src="sample.audio"
      preload="none"
      @play="playing = true"
      @pause="playing = false"
      @timeupdate="currentTime = ($event.target as HTMLAudioElement).currentTime"
      @loadedmetadata="duration = ($event.target as HTMLAudioElement).duration"
      @ended="playing = false"
    />
  </M3Card>
</template>

<style scoped>
.sample-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px 20px;
}

.sample-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.sample-play {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.sample-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.sample-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.sample-tone {
  padding: 2px 8px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface-variant);
  flex: none;
}

.sample-credit {
  color: var(--md-sys-color-on-surface-variant);
}

.sample-progress {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.track {
  position: relative;
  flex: 1;
  height: 4px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-highest);
  overflow: hidden;
}

.track-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background-color: var(--md-sys-color-primary);
  border-radius: inherit;
}

.sample-time {
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
}

.sample-kind {
  color: var(--md-sys-color-on-surface-variant);
}
</style>
