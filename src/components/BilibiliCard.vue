<script setup lang="ts">
/**
 * Bilibili 稿件卡片。
 *
 * 整卡可点、新标签打开；封面自托管，播放数为数据层快照。
 * 官方配布稿用主色描边 + 徽标高亮。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import M3Icon from './M3Icon.vue'
import type { BilibiliVideo } from '@/data/samples'

const props = defineProps<{ video: BilibiliVideo }>()

const { t, locale } = useI18n()

const viewCount = computed(() => props.video.views.toLocaleString(locale.value))
</script>

<template>
  <a
    v-ripple
    class="bili-card md-state-layer"
    :class="{ 'is-official': video.official }"
    :href="video.url"
    target="_blank"
    rel="noopener noreferrer"
  >
    <span class="bili-thumb">
      <img
        class="bili-cover"
        :src="video.cover"
        alt=""
        loading="lazy"
        decoding="async"
        width="1920"
        height="1080"
      />
      <span class="bili-play" aria-hidden="true">
        <M3Icon name="play_arrow" :size="26" />
      </span>
      <span v-if="video.official" class="bili-badge md-label-small">
        <M3Icon name="verified" :size="14" />
        {{ t('samples.officialBadge') }}
      </span>
    </span>

    <span class="bili-body">
      <span class="bili-title md-title-small">{{ video.title }}</span>
      <span class="bili-meta md-label-small">
        {{ t('samples.views', { count: viewCount }) }}
      </span>
    </span>
  </a>
</template>

<style scoped>
.bili-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--md-sys-shape-corner-large);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container);
  /* 用真实边框而不是 inset 阴影：inset 阴影绘制在内容之下，会被封面图盖住 */
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: border-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.bili-card.is-official {
  border: 2px solid var(--md-sys-color-primary);
}

.bili-thumb {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-highest);
}

.bili-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 播放图标：居中叠在封面上 */
.bili-play {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: color-mix(in srgb, #000 52%, transparent);
  color: #fff;
}

.bili-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.bili-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px 14px;
}

.bili-title {
  color: var(--md-sys-color-on-surface);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bili-meta {
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
}
</style>
