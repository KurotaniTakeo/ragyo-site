<script setup lang="ts">
/**
 * 试听区。
 *
 * 上下堆叠三个队列：
 *   1. 在线试听：站内音频试听。音频尚未提供，先渲染「准备中」空态，
 *      数据到位后往 src/data/samples.ts 里加数据即可自动渲染播放列表。
 *   2. / 3. Bilibili 与 YouTube 稿件：视频卡片横向滚动，队列末尾附带
 *      「更多稿件待收录」占位卡。
 *
 * 在线试听始终在最上；两个视频平台按语言排序：简中下 Bilibili 优先，
 * 其余语言 YouTube 优先。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import M3Card from '@/components/M3Card.vue'
import M3Icon from '@/components/M3Icon.vue'
import AudioSample from '@/components/AudioSample.vue'
import VideoQueue from '@/components/VideoQueue.vue'
import { bilibiliVideos, samples, samplesPending, youtubeVideos } from '@/data/samples'
import { sections } from '@/data/sections'

defineProps<{ active: boolean }>()

const { t, locale } = useI18n()

const videoGroups = computed(() => {
  const groups = [
    { id: 'youtube', title: t('samples.youtubeTitle'), items: youtubeVideos },
    { id: 'bilibili', title: t('samples.bilibiliTitle'), items: bilibiliVideos },
  ]
  return locale.value === 'zh' ? [...groups].reverse() : groups
})
</script>

<template>
  <SectionShell id="samples" :active="active">
    <SectionHeader
      :index="3"
      :total="sections.length"
      section-id="samples"
      :lead="t('samples.lead')"
    />

    <div class="samples-stack">
      <section class="samples-queue" data-reveal>
        <h3 class="col-title md-title-medium">{{ t('samples.onlineTitle') }}</h3>

        <div v-if="samplesPending" class="empty-wrap">
          <M3Card class="empty-card" padding="lg">
            <span class="empty-icon" aria-hidden="true">
              <M3Icon name="graphic_eq" :size="30" />
            </span>
            <h4 class="md-title-large">{{ t('samples.emptyTitle') }}</h4>
            <p class="md-body-medium">{{ t('samples.emptyBody') }}</p>
          </M3Card>
        </div>

        <ul v-else class="sample-list">
          <li v-for="sample in samples" :key="sample.id">
            <AudioSample :sample="sample" />
          </li>
        </ul>
      </section>

      <VideoQueue
        v-for="(group, i) in videoGroups"
        :key="group.id"
        :title="group.title"
        :items="group.items"
        data-reveal
        :style="`--reveal-delay: ${(i + 1) * 80}ms`"
      />
    </div>
  </SectionShell>
</template>

<style scoped>
.samples-stack {
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 2.4vh, 26px);
}

.samples-queue {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.col-title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

/* 在线试听：音频卡片网格 */
.sample-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.empty-wrap {
  display: grid;
  place-items: center;
}

.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  max-width: 520px;
}

.empty-card p {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}
</style>
