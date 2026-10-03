<script setup lang="ts">
/**
 * 视频稿件卡片（Bilibili / YouTube 通用）。
 *
 * 整卡可点、新标签打开；封面自托管，播放数为数据层快照（缺省则不显示）。
 * 官方配布稿用主色描边 + 徽标高亮。
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import M3Icon from './M3Icon.vue'
import ResponsiveImage from './ResponsiveImage.vue'
import type { VideoWork } from '@/data/samples'

const props = defineProps<{ video: VideoWork }>()

const { t, locale } = useI18n()

const viewCount = computed(() =>
  props.video.views === undefined ? null : props.video.views.toLocaleString(locale.value),
)
</script>

<template>
  <a
    v-ripple
    class="video-card md-state-layer"
    :class="{ 'is-official': video.official }"
    :href="video.url"
    target="_blank"
    rel="noopener noreferrer"
  >
    <span class="video-thumb">
      <ResponsiveImage
        :image-key="video.coverKey"
        alt=""
        sizes="(max-width: 980px) 62vw, 260px"
        fit="cover"
      />
      <span class="video-play" aria-hidden="true">
        <M3Icon name="play_arrow" :size="26" />
      </span>
      <span v-if="video.official" class="video-badge md-label-small">
        <M3Icon name="verified" :size="14" />
        {{ t('samples.officialBadge') }}
      </span>
    </span>

    <span class="video-body">
      <span class="video-title md-title-small">{{ video.title }}</span>
      <span v-if="viewCount !== null" class="video-meta md-label-small">
        {{ t('samples.views', { count: viewCount }) }}
      </span>
    </span>
  </a>
</template>

<style scoped>
.video-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: var(--md-sys-shape-corner-large);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container);
  /* 用真实边框而不是 inset 阴影：inset 阴影绘制在内容之下，会被封面图盖住 */
  border: 1px solid var(--md-sys-color-outline-variant);
  transition: border-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.video-card.is-official {
  border: 2px solid var(--md-sys-color-primary);
}

.video-thumb {
  position: relative;
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-highest);
}

/* 播放图标：居中叠在封面上 */
.video-play {
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

.video-badge {
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

.video-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px 14px;
}

.video-title {
  color: var(--md-sys-color-on-surface);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
}
</style>
