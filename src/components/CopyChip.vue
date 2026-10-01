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

/* 提取码需要一眼看清，用等宽字形 + 字距，避免 l/1/O/0 混淆。
   选择器写成 .assist-chip .chip-value 提高权重：m3-type.css 里
   html:lang(zh) .md-label-large { letter-spacing: 0 } 的权重 (0,2,1)
   会压过单个 scoped 类 (0,2,0)，导致中日文页字距被归零、与英文页不一致。
   字体栈只用具名字体：泛型 monospace 会被浏览器按语言解析，导致
   ragy 在四种语言页各自落到不同等宽字体；具名后可跨语言保持一致。 */
.assist-chip .chip-value {
  font-family: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, 'Cascadia Mono', Consolas,
    'Liberation Mono', monospace;
  letter-spacing: 0.12em;
  font-weight: 600;
  color: var(--md-sys-color-on-surface);
}
</style>
