<script setup lang="ts">
/**
 * Material You 分段按钮（segmented button）。
 * 用于语言切换：三语并列可见，比下拉菜单少一次点击，也不需要猜测；
 * 立绘展示器用它切换视角/造型/姿势/表情。
 */
import { useI18n } from 'vue-i18n'
import M3Icon from './M3Icon.vue'

const props = withDefaults(
  defineProps<{
    /** 选项值 */
    options: readonly { value: string; label: string }[]
    /** 当前值 */
    modelValue: string
    /** 无障碍名称 */
    ariaLabel?: string
    /** 整体禁用（例如立绘展示器切到背面时，造型/表情等变体无意义） */
    disabled?: boolean
    /** 选中项前置一个 ✓（M3 规范）；窄栏如顶栏语言切换器建议关闭 */
    check?: boolean
  }>(),
  { disabled: false, check: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const { t } = useI18n()

const onKeydown = (event: KeyboardEvent, index: number) => {
  if (props.disabled) return
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
  <div
    class="segmented"
    :class="{ 'is-disabled': disabled }"
    role="group"
    :aria-label="ariaLabel ?? t('common.langSwitch')"
    :aria-disabled="disabled || undefined"
  >
    <button
      v-for="(option, index) in options"
      :key="option.value"
      v-ripple
      class="segment md-state-layer md-label-large"
      :class="{ 'is-selected': option.value === modelValue }"
      type="button"
      role="radio"
      :aria-checked="option.value === modelValue"
      :disabled="disabled"
      :tabindex="option.value === modelValue && !disabled ? 0 : -1"
      @click="emit('update:modelValue', option.value)"
      @keydown="onKeydown($event, index)"
    >
      <span
        v-if="option.value === modelValue"
        class="segment-indicator"
        aria-hidden="true"
      />
      <M3Icon
        v-if="check && option.value === modelValue"
        name="check"
        :size="16"
        class="segment-check"
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
  color: var(--md-sys-color-on-surface-variant);
  transition: color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
  white-space: nowrap;
}

.segment + .segment {
  margin-left: 2px;
}

/* 选中态：secondary-container 填充 + 对应前景色，和未选中拉开差距 */
.is-selected {
  color: var(--md-sys-color-on-secondary-container);
}

/* 禁用态：整组变暗，且不响应状态层 */
.segmented.is-disabled {
  opacity: var(--md-sys-state-disabled-opacity);
}

.segment:disabled {
  cursor: not-allowed;
}

.segment:disabled::after {
  opacity: 0 !important;
}

.segment-indicator {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-color: var(--md-sys-color-secondary-container);
  z-index: 0;
}

.segment-check {
  position: relative;
  z-index: 1;
  flex: none;
  margin-right: 4px;
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

/* 四语并列时进一步收紧，避免窄屏顶栏放不下 */
@media (max-width: 480px) {
  .segment {
    padding: 0 7px;
    font-size: 0.6875rem;
  }
}
</style>
