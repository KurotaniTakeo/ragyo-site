<script setup lang="ts">
/**
 * Material Symbols 图标。
 * 路径数据内联在 icons.ts 中，不引入图标字体，也不产生额外网络请求。
 */
import { iconPaths, type IconName } from './icons'

withDefaults(
  defineProps<{
    name: IconName
    /** 像素尺寸，默认 24 */
    size?: number | string
  }>(),
  { size: 24 },
)
</script>

<template>
  <svg
    class="m3-icon"
    :width="size"
    :height="size"
    viewBox="0 -960 960 960"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="iconPaths[name]" fill="currentColor" />
  </svg>
</template>

<style scoped>
.m3-icon {
  display: block;
  flex: none;
}
</style>
