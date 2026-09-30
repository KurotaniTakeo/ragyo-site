<script setup lang="ts">
/**
 * Material You 卡片。
 *
 * 高度层级用「色调容器」表达而不是投影 —— 这也是本站在暗色下保持扁平简约的原因。
 */
withDefaults(
  defineProps<{
    variant?: 'filled' | 'outlined' | 'elevated'
    /** 容器色调层级，数值越高越亮 */
    tone?: 'lowest' | 'low' | 'base' | 'high' | 'highest'
    padding?: 'none' | 'sm' | 'md' | 'lg'
  }>(),
  { variant: 'filled', tone: 'base', padding: 'md' },
)
</script>

<template>
  <div
    class="m3-card"
    :class="[`is-${variant}`, `tone-${tone}`, `pad-${padding}`]"
  >
    <slot />
  </div>
</template>

<style scoped>
.m3-card {
  border-radius: var(--md-sys-shape-corner-large);
  position: relative;
}

.tone-lowest {
  background-color: var(--md-sys-color-surface-container-lowest);
}

.tone-low {
  background-color: var(--md-sys-color-surface-container-low);
}

.tone-base {
  background-color: var(--md-sys-color-surface-container);
}

.tone-high {
  background-color: var(--md-sys-color-surface-container-high);
}

.tone-highest {
  background-color: var(--md-sys-color-surface-container-highest);
}

.is-outlined {
  background-color: transparent;
  box-shadow: inset 0 0 0 1px var(--md-sys-color-outline-variant);
}

.is-elevated {
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.35);
}

.pad-none {
  padding: 0;
}

.pad-sm {
  padding: 12px 16px;
}

.pad-md {
  padding: 20px 24px;
}

.pad-lg {
  padding: 28px 32px;
}

/* 矮屏压缩卡片内边距，为内容让出高度 */
@media (max-height: 860px) {
  .pad-md {
    padding: 14px 18px;
  }

  .pad-lg {
    padding: 20px 24px;
  }
}
</style>
