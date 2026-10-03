<script setup lang="ts">
/**
 * 「更多稿件待收录」占位卡。
 *
 * 接在视频队列末尾，尺寸与稿件卡一致，但视觉更淡（虚线描边 + 半透明底），
 * 表示队列之后还会有更多内容，而非一个可点击的稿件。
 */
import { useI18n } from 'vue-i18n'
import M3Icon from './M3Icon.vue'

const { t } = useI18n()
</script>

<template>
  <div class="pending-card">
    <span class="pending-icon" aria-hidden="true">
      <M3Icon name="hourglass_empty" :size="26" />
    </span>
    <span class="pending-text md-label-large">{{ t('samples.morePending') }}</span>
  </div>
</template>

<style scoped>
.pending-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  min-height: 180px;
  padding: 20px;
  text-align: center;
  border-radius: var(--md-sys-shape-corner-large);
  border: 1px dashed var(--md-sys-color-outline-variant);
  background-color: color-mix(in srgb, var(--md-sys-color-surface-container) 55%, transparent);
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.78;
}

.pending-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-highest);
}
</style>
