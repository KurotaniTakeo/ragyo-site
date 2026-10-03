<script setup lang="ts">
/**
 * 彩蛋区。
 *
 * 19 个 GIF 转码片段合计 1.5MB，全部预加载与自动播放都不划算：只加载当前一个，
 * 且默认停在封面帧，由用户点击播放（preload="metadata" 不会提前下载视频本体）。
 *
 * 交互上直接在本页内联展示当前片段（不再弹出二级弹窗）：
 * 进入即随机取一个，点「再来一个」换下一个。
 */
import { computed, onMounted, ref } from 'vue'
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

/** 元数据就绪即可撤下加载提示，视频本体等到用户点击播放才下载 */
function onLoaded() {
  loading.value = false
}

function onError() {
  loading.value = false
  failed.value = true
}

onMounted(() => {
  if (surpriseClips.length === 0) return
  loading.value = true
  pickRandom()
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
            class="clip-video"
            :src="current.video"
            :poster="current.poster"
            :width="current.width"
            :height="current.height"
            controls
            preload="metadata"
            loop
            muted
            playsinline
            @loadedmetadata="onLoaded"
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
  /* 加载层不拦截点击，避免挡住在下方等待用户操作的播放控件 */
  pointer-events: none;
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
