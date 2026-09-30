<script setup lang="ts">
/**
 * 各分屏统一的标题区。
 * 左侧的序号与短名取自导航标签，让用户始终知道自己在第几屏。
 */
import { useI18n } from 'vue-i18n'

defineProps<{
  /** 分屏序号，从 1 开始 */
  index: number
  total: number
  /** 分屏 id，同时用于取导航名与标题文案 */
  sectionId: string
  /** 是否有引导语 */
  lead?: string
}>()

const { t } = useI18n()
</script>

<template>
  <header class="section-header" data-reveal>
    <p class="kicker md-label-medium">
      <span class="kicker-index">{{ String(index).padStart(2, '0') }}</span>
      <span class="kicker-total">/ {{ String(total).padStart(2, '0') }}</span>
      <span class="kicker-rule" aria-hidden="true" />
      <span class="kicker-name">{{ t(`nav.${sectionId}`) }}</span>
    </p>

    <h2 class="section-title md-headline-large">{{ t(`${sectionId}.title`) }}</h2>

    <p v-if="lead" class="section-lead md-body-large">{{ lead }}</p>
  </header>
</template>

<style scoped>
.section-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: clamp(14px, 2.4vh, 28px);
}

.kicker {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--md-sys-color-tertiary);
  letter-spacing: 0.08em;
}

.kicker-index {
  font-weight: 700;
}

.kicker-total,
.kicker-name {
  color: var(--md-sys-color-on-surface-variant);
  font-weight: 500;
}

.kicker-rule {
  width: 24px;
  height: 1px;
  background-color: var(--md-sys-color-outline);
}

.section-title {
  color: var(--md-sys-color-on-surface);
}

.section-lead {
  max-width: 62ch;
  color: var(--md-sys-color-on-surface-variant);
}

@media (max-height: 860px) {
  .section-header {
    gap: 6px;
    margin-bottom: 12px;
  }
}
</style>
