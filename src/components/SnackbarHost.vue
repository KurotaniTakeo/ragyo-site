<script setup lang="ts">
import { computed } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'

const { message, anchor } = useSnackbar()

/**
 * 有锚点时定位到锚点正上方居中（提取码按钮等）；否则固定在底部居中。
 * 左右做视口夹取，避免提示贴边或越界。
 */
const hostStyle = computed(() => {
  if (!anchor.value || typeof window === 'undefined') return undefined
  const half = anchor.value.width / 2
  const centerX = Math.min(Math.max(anchor.value.left + half, 8), window.innerWidth - 8)
  return {
    left: `${centerX}px`,
    top: `${Math.max(anchor.value.top - 8, 8)}px`,
    bottom: 'auto',
    transform: 'translate(-50%, -100%)',
  }
})
</script>

<template>
  <Transition name="snackbar">
    <div
      v-if="message"
      class="snackbar-host"
      :style="hostStyle"
      role="status"
      aria-live="polite"
    >
      <div class="snackbar md-body-medium">{{ message }}</div>
    </div>
  </Transition>
</template>

<style scoped>
.snackbar-host {
  position: fixed;
  left: 50%;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  z-index: 1200;
  pointer-events: none;
}

.snackbar {
  min-height: 48px;
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--md-sys-color-inverse-surface);
  color: var(--md-sys-color-inverse-on-surface);
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.4);
  max-width: min(92vw, 420px);
}

/* 动画放在内层：外层负责定位（含锚点的 translate），两者互不干扰 */
.snackbar-enter-active .snackbar,
.snackbar-leave-active .snackbar {
  transition:
    opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    transform var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized-decelerate);
}

.snackbar-enter-from .snackbar,
.snackbar-leave-to .snackbar {
  opacity: 0;
  transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
  .snackbar-enter-active .snackbar,
  .snackbar-leave-active .snackbar {
    transition: opacity 100ms linear;
  }
}
</style>
