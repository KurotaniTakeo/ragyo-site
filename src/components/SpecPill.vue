<script setup lang="ts">
/**
 * 规格药丸：音源信息表格里的音高 / 音色列表项。
 *
 * 视觉沿用旧版右卡片音色标签：中性底，Soft / Power 用主色 / 三色染一下。
 * 字号固定为 label-small，语义上不随所在表格的字号变化。
 */
defineProps<{
  /** Soft / Power 的色调；Normal 与音高用中性 */
  tone?: 'soft' | 'normal' | 'power'
}>()
</script>

<template>
  <span class="spec-pill" :class="tone ? `is-${tone}` : undefined">
    <slot />
  </span>
</template>

<style scoped>
.spec-pill {
  display: inline-block;
  padding: 3px 9px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface-variant);
  /* 药丸含「普通 / 一般」等汉字，等宽体不一定覆盖 CJK，直接沿用正文字体 */
  font-family: var(--app-font-sans);
  font-size: var(--md-sys-typescale-label-small-size);
  line-height: var(--md-sys-typescale-label-small-line);
  font-weight: 500;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.spec-pill.is-soft {
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-primary) 22%,
    var(--md-sys-color-surface-container-highest)
  );
  color: var(--md-sys-color-primary);
}

.spec-pill.is-power {
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-tertiary) 22%,
    var(--md-sys-color-surface-container-highest)
  );
  color: var(--md-sys-color-tertiary);
}
</style>
