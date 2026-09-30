<script setup lang="ts">
/**
 * 彩蛋区。
 *
 * 19 个 GIF 转码片段合计 1.5MB，全部预加载仍不划算，因此只加载当前一个，
 * 并在浏览器空闲时预热一个随机片段。
 *
 * 交互上直接在本页内联展示当前片段（不再弹出二级弹窗）：
 * 进入即随机取一个，点「再来一个」换下一个。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import M3Card from '@/components/M3Card.vue'
import M3Button from '@/components/M3Button.vue'
import M3Icon from '@/components/M3Icon.vue'
import { surpriseClips } from '@/data/surprise.generated'
import { sections } from '@/data/sections'

defineProps<{ active: boolean }>()

const { t } = useI18n()

const loading = ref(false)
const failed = ref(false)
const currentIndex = ref(0)
const videoEl = ref<HTMLVideoElement | null>(null)

const current = computed(() => surpriseClips[currentIndex.value])
const clipCount = computed(() => surpriseClips.length)

function pickRandom() {
  if (clipCount.value <= 1) {
    currentIndex.value = 0
    return
  }
  // 避免连续两次抽到同一个
  let next = currentIndex.value
  while (next === currentIndex.value) {
    next = Math.floor(Math.random() * clipCount.value)
  }
  currentIndex.value = next
  failed.value = false
  loading.value = true
}

function onLoaded() {
  loading.value = false
  videoEl.value?.play().catch(() => {
    /* 自动播放被策略拦截时保留首帧即可 */
  })
}

function onError() {
  loading.value = false
  failed.value = true
}

// requestIdleCallback 返回 number；Node 环境下 setTimeout 返回 Timeout，故用 ReturnType 兼容两侧类型
let idleHandle: number | undefined
let idleTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (surpriseClips.length === 0) return

  loading.value = true
  pickRandom()

  // 空闲时预热一个随机片段，减小切换时的等待
  const prefetch = () => {
    const clip = surpriseClips[Math.floor(Math.random() * surpriseClips.length)]
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'video'
    link.href = clip.video
    document.head.appendChild(link)
  }

  if ('requestIdleCallback' in window) {
    idleHandle = window.requestIdleCallback(prefetch, { timeout: 5000 })
  } else {
    // 用全局 setTimeout：上面的 `in` 收窄会把 window 推断成 never
    idleTimer = setTimeout(prefetch, 2500)
  }
})

onBeforeUnmount(() => {
  if (idleHandle && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleHandle)
  if (idleTimer) window.clearTimeout(idleTimer)
})
</script>

<template>
  <SectionShell id="surprise" :active="active">
    <SectionHeader
      :index="9"
      :total="sections.length"
      section-id="surprise"
      :lead="t('surprise.lead')"
    />

    <div class="surprise-stage">
      <span class="surprise-icon" aria-hidden="true" data-reveal>
        <M3Icon name="auto_awesome" :size="30" />
      </span>

      <M3Card class="clip-card" padding="none" data-reveal style="--reveal-delay: 60ms">
        <div class="clip-frame">
          <video
            v-if="!failed"
            ref="videoEl"
            class="clip-video"
            :src="current.video"
            :poster="current.poster"
            :width="current.width"
            :height="current.height"
            autoplay
            loop
            muted
            playsinline
            @loadeddata="onLoaded"
            @error="onError"
          />

          <p v-else class="clip-error md-body-medium" role="status">{{ t('surprise.error') }}</p>

          <div v-if="loading && !failed" class="clip-loading md-label-medium" aria-live="polite">
            {{ t('surprise.loading') }}
          </div>
        </div>

        <div class="clip-bar">
          <span class="clip-index md-label-medium">
            {{ String(currentIndex + 1).padStart(2, '0') }}
            <span class="clip-sep" aria-hidden="true">/</span>
            {{ String(clipCount).padStart(2, '0') }}
          </span>

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
    </div>
  </SectionShell>
</template>

<style scoped>
.surprise-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.surprise-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.clip-card {
  width: min(100%, 380px);
  overflow: hidden;
}

.clip-frame {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  background-color: var(--md-sys-color-surface-container-highest);
}

.clip-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.clip-loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--md-sys-color-on-surface-variant);
  background-color: color-mix(in srgb, var(--md-sys-color-surface) 62%, transparent);
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
  gap: 12px;
  padding: 8px 8px 8px 16px;
  background-color: var(--md-sys-color-surface-container-high);
}

.clip-index {
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
}

.clip-sep {
  margin: 0 4px;
  opacity: 0.6;
}
</style>
