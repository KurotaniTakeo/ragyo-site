<script setup lang="ts">
/**
 * Material You 对话框（圆角 28）。
 * 用于彩蛋视频的灯箱。
 *
 * 行为要点：
 *   - Teleport 到 body，避免被 .snap-scroller 的 overflow 裁切
 *   - Esc 关闭；打开时把焦点移入对话框
 *   - 打开期间由父级把全屏滚动挂起（suspended）
 */
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import M3Icon from './M3Icon.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    /** 无障碍标题 */
    label: string
    /** 尺寸：default 为窄卡片；full 为近全屏容器（立绘展示器等） */
    size?: 'default' | 'full'
    /** 手机窄屏下渲染为底部抽屉；更宽（平板）时自动回落为居中弹窗 */
    sheet?: boolean
  }>(),
  { size: 'default', sheet: false },
)

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const panel = ref<HTMLElement | null>(null)

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      window.addEventListener('keydown', onKeydown)
      await nextTick()
      panel.value?.focus()
    } else {
      window.removeEventListener('keydown', onKeydown)
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="dialog-layer" :class="{ 'is-sheet': props.sheet }">
        <div class="scrim" @click="emit('close')" />
        <div
          ref="panel"
          class="dialog-surface"
          :class="`size-${props.size}`"
          role="dialog"
          aria-modal="true"
          :aria-label="label"
          tabindex="-1"
        >
          <button
            v-ripple
            class="dialog-close md-state-layer"
            type="button"
            :aria-label="t('common.close')"
            @click="emit('close')"
          >
            <M3Icon name="close" :size="22" />
          </button>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-layer {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  place-items: center;
  padding: 20px;
}

.scrim {
  position: absolute;
  inset: 0;
  background-color: color-mix(in srgb, var(--md-sys-color-scrim) 62%, transparent);
  backdrop-filter: blur(2px);
}

.dialog-surface {
  position: relative;
  z-index: 1;
  width: min(560px, 100%);
  max-height: calc(100dvh - 40px);
  overflow: auto;
  padding: 24px;
  border-radius: var(--md-sys-shape-corner-extra-large);
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  box-shadow: 0 8px 32px rgb(0 0 0 / 0.5);
}

.dialog-surface:focus {
  outline: none;
}

/* 近全屏容器：内容自行管理内边距与滚动（立绘展示器） */
.dialog-surface.size-full {
  width: min(1120px, 100%);
  height: min(92dvh, 100%);
  max-height: calc(100dvh - 24px);
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 600px) {
  .dialog-layer {
    padding: 8px;
  }

  .dialog-surface.size-full {
    max-height: calc(100dvh - 16px);
  }

  /* 手机端的抽屉形态：贴底、全宽、仅上圆角。平板（>600px）仍走居中弹窗。 */
  .dialog-layer.is-sheet {
    place-items: end center;
    padding: 0;
  }

  .dialog-layer.is-sheet .dialog-surface {
    width: 100%;
    max-height: min(85dvh, 100%);
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
    border-radius: var(--md-sys-shape-corner-extra-large)
      var(--md-sys-shape-corner-extra-large) 0 0;
  }

  .dialog-layer.is-sheet.dialog-enter-from .dialog-surface,
  .dialog-layer.is-sheet.dialog-leave-to .dialog-surface {
    transform: translateY(100%);
  }
}

.dialog-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface-variant);
}

.dialog-enter-active .dialog-surface,
.dialog-leave-active .dialog-surface {
  transition:
    opacity var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized-decelerate),
    transform var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized-decelerate);
}

.dialog-enter-active .scrim,
.dialog-leave-active .scrim {
  transition: opacity var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard);
}

.dialog-enter-from .dialog-surface,
.dialog-leave-to .dialog-surface {
  opacity: 0;
  transform: scale(0.92);
}

.dialog-enter-from .scrim,
.dialog-leave-to .scrim {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .dialog-enter-active .dialog-surface,
  .dialog-leave-active .dialog-surface {
    transition: opacity 120ms linear;
  }

  .dialog-enter-from .dialog-surface,
  .dialog-leave-to .dialog-surface {
    transform: none;
  }
}
</style>
