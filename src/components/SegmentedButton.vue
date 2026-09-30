<script setup lang="ts">
/**
 * Material You 分段按钮（segmented button）。
 * 用于语言切换：三语并列可见，比下拉菜单少一次点击，也不需要猜测。
 */
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  /** 选项值 */
  options: readonly { value: string; label: string }[]
  /** 当前值 */
  modelValue: string
  /** 无障碍名称 */
  ariaLabel?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useI18n()

const onKeydown = (event: KeyboardEvent, index: number) => {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (!keys.includes(event.key)) return
  event.preventDefault()

  const last = props.options.length - 1
  const nextIndex =
    event.key === 'ArrowLeft'
      ? (index - 1 + props.options.length) % props.options.length
      : event.key === 'ArrowRight'
        ? (index + 1) % props.options.length
        : event.key === 'Home'
          ? 0
          : last

  emit('update:modelValue', props.options[nextIndex].value)
  const group = (event.currentTarget as HTMLElement).parentElement
  group?.querySelectorAll<HTMLButtonElement>('button')[nextIndex]?.focus()
}
</script>

<template>
  <div class="segmented" role="group" :aria-label="ariaLabel ?? t('common.langSwitch')">
    <button
      v-for="(option, index) in options"
      :key="option.value"
      v-ripple
      class="segment md-state-layer md-label-large"
      :class="{ 'is-selected': option.value === modelValue }"
      type="button"
      role="radio"
      :aria-checked="option.value === modelValue"
      :tabindex="option.value === modelValue ? 0 : -1"
      @click="emit('update:modelValue', option.value)"
      @keydown="onKeydown($event, index)"
    >
      <span
        v-if="option.value === modelValue"
        class="segment-indicator"
        aria-hidden="true"
      />
      <span class="segment-label">{{ option.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.segmented {
  display: inline-flex;
  align-items: stretch;
  padding: 2px;
  border-radius: var(--md-sys-shape-corner-full);
  box-shadow: inset 0 0 0 1px var(--md-sys-color-outline);
  background-color: transparent;
}

.segment {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 14px;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface);
  transition: color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
  white-space: nowrap;
}

.segment + .segment {
  margin-left: 2px;
}

.is-selected {
  color: var(--md-sys-color-on-surface);
}

.segment-indicator {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-color: var(--md-sys-color-surface-container);
  z-index: 0;
}

.segment-label {
  position: relative;
  z-index: 1;
}

@media (max-width: 600px) {
  .segment {
    padding: 0 10px;
    font-size: 0.75rem;
  }
}
</style>
