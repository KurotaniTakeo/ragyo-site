<script setup lang="ts">
import { useSnackbar } from '@/composables/useSnackbar'

const { message } = useSnackbar()
</script>

<template>
  <Transition name="snackbar">
    <div v-if="message" class="snackbar-host" role="status" aria-live="polite">
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

.snackbar-enter-active,
.snackbar-leave-active {
  transition:
    opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    transform var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized-decelerate);
}

.snackbar-enter-from,
.snackbar-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}

@media (prefers-reduced-motion: reduce) {
  .snackbar-enter-active,
  .snackbar-leave-active {
    transition: opacity 100ms linear;
  }
}
</style>
