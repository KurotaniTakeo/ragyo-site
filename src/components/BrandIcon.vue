<script setup lang="ts">
/**
 * 社交平台品牌图标（X / Bilibili / GitHub / YouTube / Facebook）。
 *
 * 路径内联在 brandIcons.ts 中，不引入图标字体。
 * 视觉上以 currentColor 着色，通过 size 控制尺寸。
 */
import { brandIcons, type BrandIconName } from './brandIcons'

withDefaults(
  defineProps<{
    name: BrandIconName
    /** 像素尺寸，默认 16 */
    size?: number | string
  }>(),
  { size: 16 },
)
</script>

<template>
  <svg
    class="brand-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="brandIcons[name]" fill="currentColor" />
  </svg>
</template>

<style scoped>
.brand-icon {
  display: block;
  flex: none;
}
</style>
