<script setup lang="ts">
/**
 * Material You 按钮。
 *
 * 五种变体对应 M3 规范：
 *   filled    主要动作（每屏最多一个）
 *   tonal     次要动作，用 surface-container 容器色
 *   outlined  低强调动作
 *   text      最低强调，常用于卡片内
 *   elevated  需要从背景中浮起时
 */
import M3Icon from './M3Icon.vue'
import type { IconName } from './icons'

const props = withDefaults(
  defineProps<{
    variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated'
    icon?: IconName
    /** 传入后渲染为 <a>，用于外链与锚点 */
    href?: string
    /** 外链时自动加 target/rel */
    external?: boolean
    type?: 'button' | 'submit'
    disabled?: boolean
    block?: boolean
  }>(),
  {
    variant: 'filled',
    type: 'button',
    external: false,
    disabled: false,
    block: false,
  },
)

const isLink = () => props.href !== undefined
</script>

<template>
  <component
    :is="isLink() ? 'a' : 'button'"
    v-ripple
    class="m3-button md-state-layer"
    :class="[`is-${variant}`, { 'is-block': block, 'is-disabled': disabled }]"
    :href="href"
    :type="isLink() ? undefined : type"
    :target="isLink() && external ? '_blank' : undefined"
    :rel="isLink() && external ? 'noopener noreferrer' : undefined"
    :disabled="isLink() ? undefined : disabled"
    :aria-disabled="disabled || undefined"
  >
    <M3Icon v-if="icon && !block" :name="icon" :size="18" class="m3-button-icon" />
    <span class="m3-button-label"><slot /></span>
    <M3Icon
      v-if="icon && block"
      :name="icon"
      :size="18"
      class="m3-button-icon m3-button-icon-trailing"
    />
  </component>
</template>

<style scoped>
.m3-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 24px;
  border-radius: var(--md-sys-shape-corner-full);
  font-family: inherit;
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  transition:
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    border-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.is-block {
  width: 100%;
  justify-content: space-between;
}

.m3-button-icon {
  flex: none;
}

.is-filled {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.is-tonal {
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
}

.is-elevated {
  background-color: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-primary);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.3);
}

.is-outlined {
  color: var(--md-sys-color-primary);
  box-shadow: inset 0 0 0 1px var(--md-sys-color-outline);
}

.is-text {
  padding: 0 12px;
  color: var(--md-sys-color-primary);
}

.m3-button:disabled,
.m3-button.is-disabled {
  cursor: not-allowed;
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-on-surface) calc(var(--md-sys-state-disabled-container-opacity) * 100%),
    transparent
  );
  color: color-mix(
    in srgb,
    var(--md-sys-color-on-surface) calc(var(--md-sys-state-disabled-opacity) * 100%),
    transparent
  );
  box-shadow: none;
}

.m3-button:disabled::after,
.m3-button.is-disabled::after {
  opacity: 0 !important;
}
</style>
