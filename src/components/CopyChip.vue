<script setup lang="ts">
/**
 * Material You 的 Assist chip。
 * 本站主要用于百度網盤提取码：值可见、可一键复制、复制后给出 Snackbar 反馈。
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import M3Icon from './M3Icon.vue'
import { showSnackbar } from '@/composables/useSnackbar'
import { copyText } from '@/utils/clipboard'

const props = defineProps<{
  /** 前置说明，例如「提取码」 */
  label: string
  /** 需要复制的值 */
  value: string
}>()

const { t } = useI18n()
const copied = ref(false)

async function onCopy() {
  const ok = await copyText(props.value)
  showSnackbar(ok ? t('common.copied') : t('common.copyFailed'))

  if (!ok) return
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <button
    v-ripple
    class="assist-chip md-state-layer"
    type="button"
    :aria-label="`${label} ${value} — ${t('common.copy')}`"
    @click="onCopy"
  >
    <M3Icon :name="copied ? 'check' : 'content_copy'" :size="18" class="chip-icon" />
    <span class="chip-label md-label-large">{{ label }}</span>
    <span class="chip-value md-label-large">{{ value }}</span>
  </button>
</template>

<style scoped>
.assist-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 0 12px 0 10px;
  border-radius: var(--md-sys-shape-corner-small);
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  box-shadow: inset 0 0 0 1px var(--md-sys-color-outline-variant);
  transition: background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.chip-icon {
  color: var(--md-sys-color-primary);
}

.chip-label {
  color: var(--md-sys-color-on-surface-variant);
}

/* 提取码需要一眼看清，用等宽字形 + 字距，避免 l/1/O/0 混淆 */
.chip-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}
</style>
