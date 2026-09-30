<script setup lang="ts">
/**
 * 试听区。
 *
 * 分为两栏：
 *   - Bilibili 已发布稿件：视频卡片（封面 + 标题 + 播放数），官方配布稿高亮
 *   - 在线试听：站内音频试听。音频尚未提供，先渲染「准备中」空态，
 *     数据到位后往 src/data/samples.ts 里加数据即可自动渲染播放列表。
 */
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import M3Card from '@/components/M3Card.vue'
import M3Icon from '@/components/M3Icon.vue'
import AudioSample from '@/components/AudioSample.vue'
import BilibiliCard from '@/components/BilibiliCard.vue'
import { bilibiliVideos, samples, samplesPending } from '@/data/samples'
import { sections } from '@/data/sections'

defineProps<{ active: boolean }>()

const { t } = useI18n()
</script>

<template>
  <SectionShell id="samples" :active="active">
    <SectionHeader
      :index="3"
      :total="sections.length"
      section-id="samples"
      :lead="t('samples.lead')"
    />

    <div class="samples-grid">
      <section class="samples-col">
        <h3 class="col-title md-title-medium" data-reveal>
          {{ t('samples.bilibiliTitle') }}
        </h3>

        <ul class="bili-list">
          <li v-for="video in bilibiliVideos" :key="video.bvid">
            <BilibiliCard :video="video" data-reveal />
          </li>
        </ul>
      </section>

      <section class="samples-col">
        <h3 class="col-title md-title-medium" data-reveal>
          {{ t('samples.onlineTitle') }}
        </h3>

        <div v-if="samplesPending" class="empty-wrap" data-reveal>
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
    </div>
  </SectionShell>
</template>

<style scoped>
.samples-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: clamp(16px, 2.4vw, 32px);
  align-items: start;
}

.samples-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.col-title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.bili-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.empty-wrap {
  flex: 1;
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

.sample-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

@media (max-width: 980px) {
  .samples-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
