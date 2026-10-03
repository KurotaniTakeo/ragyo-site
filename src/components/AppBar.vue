<script setup lang="ts">
/**
 * 顶栏（Material You small top app bar）。
 *
 * 在首屏顶部时完全透明，让立绘不被遮挡；
 * 一旦开始滚动就转为 surface-container-high 并压一条分隔线。
 */
import { useI18n } from 'vue-i18n'
import SegmentedButton from './SegmentedButton.vue'
import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from '@/i18n'
import { voicebank } from '@/data/voicebank'

defineProps<{
  scrolled: boolean
  locale: string
}>()

const emit = defineEmits<{
  'update:locale': [locale: string]
  'select-hero': []
}>()

const { t } = useI18n()

const localeOptions = SUPPORTED_LOCALES.map((value) => ({
  value,
  label: LOCALE_LABELS[value],
}))
</script>

<template>
  <header class="app-bar" :class="{ 'is-scrolled': scrolled }">
    <a v-ripple class="brand" :href="`#hero`" @click.prevent="emit('select-hero')">
      <span class="brand-mark" aria-hidden="true" />
      <span class="brand-text">
        <span class="brand-name md-title-medium">{{ voicebank.name[locale as Locale] }}</span>
        <span class="brand-sub md-label-small">{{ voicebank.libraryName }}</span>
      </span>
    </a>

    <div class="app-bar-actions">
      <SegmentedButton
        :options="localeOptions"
        :model-value="locale"
        :aria-label="t('common.langSwitch')"
        @update:model-value="emit('update:locale', $event)"
      />
    </div>
  </header>
</template>

<style scoped>
.app-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: calc(var(--app-bar-height) + env(safe-area-inset-top, 0px));
  padding: env(safe-area-inset-top, 0px) var(--app-gutter) 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background-color: transparent;
  transition:
    background-color var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard),
    box-shadow var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard);
}

.app-bar.is-scrolled {
  background-color: var(--md-sys-color-surface-container-high);
  box-shadow: inset 0 -1px 0 var(--md-sys-color-outline-variant);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  /* 内边距配合负外边距撑出涟漪/状态层的点击范围，视觉位置保持不变 */
  padding: 4px 10px;
  margin-left: -10px;
  border-radius: var(--md-sys-shape-corner-full);
}

/* 品牌标记：取自立绘的墨蓝毛色与领带赤，是本站唯一出现双色的图形元素 */
.brand-mark {
  width: 8px;
  height: 28px;
  border-radius: var(--md-sys-shape-corner-full);
  background: linear-gradient(
    to bottom,
    var(--md-sys-color-primary) 0%,
    var(--md-sys-color-primary) 58%,
    var(--md-sys-color-tertiary) 58%,
    var(--md-sys-color-tertiary) 100%
  );
  flex: none;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  min-width: 0;
}

.brand-name {
  font-weight: 600;
}

.brand-sub {
  color: var(--md-sys-color-on-surface-variant);
  letter-spacing: 0.06em;
}

@media (max-width: 600px) {
  .brand-sub {
    display: none;
  }
}
</style>
