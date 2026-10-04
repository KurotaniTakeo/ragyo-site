<script setup lang="ts">
/**
 * Material You 对话框（圆角 28）。
 * 用于彩蛋视频的灯箱、立绘展示器与移动端分屏目录。
 *
 * 行为要点：
 *   - Teleport 到 body，避免被 .snap-scroller 的 overflow 裁切
 *   - Esc 关闭；打开时把焦点移入对话框
 *   - 打开期间由父级把全屏滚动挂起（suspended）
 *
 * placement 三种呈现：
 *   - center：默认居中弹窗
 *   - sheet ：手机底部抽屉，可从顶部抓手/内容顶部下拉收回
 *   - corner：平板竖屏锚定右下角（导航胶囊所在角）的弹出菜单，向上展开
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import M3Icon from './M3Icon.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    /** 无障碍标题 */
    label: string
    /** 尺寸：default 为窄卡片；full 为近全屏容器（立绘展示器等） */
    size?: 'default' | 'full'
    /** 呈现方式：居中弹窗 / 底部抽屉 / 角落弹出菜单 */
    placement?: 'center' | 'sheet' | 'corner'
  }>(),
  { size: 'default', placement: 'center' },
)

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const panel = ref<HTMLElement | null>(null)

/**
 * 过渡由子元素 .dialog-surface 承担，Vue 无法从根节点读取时长，
 * 因此显式告知 <Transition> 等待时长，否则离场会被立即移除、看不到回收动画。
 */
const transitionDuration = computed(() =>
  props.placement === 'corner' ? { enter: 260, leave: 220 } : { enter: 320, leave: 320 },
)

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

/* ------------------------------------------------- 手机抽屉：下拉收回 */

/** 位移超过面板高度该比例即收折；快速下滑（且位移足够）也判定为收折 */
const DRAG_CLOSE_RATIO = 0.3
const DRAG_CLOSE_VELOCITY = 0.8
const DRAG_CLOSE_MIN = 64

/** 跟随手指的位移；仅 sheet 形态使用（写入 CSS 变量，不直接覆盖 transform） */
const dragY = ref(0)
const dragging = ref(false)

let touchId: number | null = null
let startY = 0
let startTime = 0
let fromHandle = false

function resetDrag() {
  touchId = null
  dragging.value = false
  dragY.value = 0
}

function onTouchStart(event: TouchEvent) {
  if (props.placement !== 'sheet') return
  const touch = event.touches[0]
  if (!touch) return
  const target = event.target as HTMLElement | null
  fromHandle = !!target?.closest('[data-sheet-drag-handle]')
  // 内容未到顶时只允许从抓手发起；到顶后整片抽屉都可下拉
  const atTop = (panel.value?.scrollTop ?? 0) <= 0
  if (!fromHandle && !atTop) return
  touchId = touch.identifier
  startY = touch.clientY
  startTime = performance.now()
  dragY.value = 0
  dragging.value = false
}

function onTouchMove(event: TouchEvent) {
  if (touchId === null) return
  const touch = [...event.touches].find((item) => item.identifier === touchId)
  if (!touch) return
  const dy = touch.clientY - startY
  if (!dragging.value) {
    // 轴锁：向上滑动交还给内部滚动
    if (dy <= 0 || dy < 4) return
    dragging.value = true
  }
  event.preventDefault()
  dragY.value = Math.max(0, dy)
}

function onTouchEnd(event: TouchEvent) {
  if (touchId === null) return
  const touch = [...event.changedTouches].find((item) => item.identifier === touchId)
  const dy = touch ? touch.clientY - startY : dragY.value
  const elapsed = Math.max(1, performance.now() - startTime)
  const height = panel.value?.getBoundingClientRect().height ?? 0
  const passedDistance = dy > height * DRAG_CLOSE_RATIO
  const flickedDown = dy > DRAG_CLOSE_MIN && dy / elapsed > DRAG_CLOSE_VELOCITY
  const shouldClose = passedDistance || flickedDown
  touchId = null
  dragging.value = false
  if (shouldClose) {
    // 保留当前位移，交给离场动画从该处滑出；@after-leave 再复位
    emit('close')
  } else {
    dragY.value = 0
  }
}

let attachedPanel: HTMLElement | null = null

function detachSheetDrag() {
  if (!attachedPanel) return
  attachedPanel.removeEventListener('touchstart', onTouchStart)
  attachedPanel.removeEventListener('touchmove', onTouchMove)
  attachedPanel.removeEventListener('touchend', onTouchEnd)
  attachedPanel.removeEventListener('touchcancel', onTouchEnd)
  attachedPanel = null
}

function attachSheetDrag() {
  const el = panel.value
  if (attachedPanel === el) return
  detachSheetDrag()
  if (!el) return
  attachedPanel = el
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: false })
  el.addEventListener('touchend', onTouchEnd)
  el.addEventListener('touchcancel', onTouchEnd)
}

watch(
  () => [props.open, props.placement, panel.value] as const,
  () => attachSheetDrag(),
  { immediate: true, flush: 'post' },
)

onBeforeUnmount(detachSheetDrag)
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog" :duration="transitionDuration" @after-leave="resetDrag">
      <div
        v-if="open"
        class="dialog-layer"
        :class="[`placement-${props.placement}`, { 'is-dragging': dragging }]"
      >
        <div class="scrim" @click="emit('close')" />
        <div
          ref="panel"
          class="dialog-surface"
          :class="`size-${props.size}`"
          :style="{ '--sheet-drag': `${dragY}px` }"
          role="dialog"
          aria-modal="true"
          :aria-label="label"
          tabindex="-1"
        >
          <span
            v-if="props.placement === 'sheet'"
            class="dialog-grabber"
            data-sheet-drag-handle
            aria-hidden="true"
          />
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

/* 手机抽屉的抓手：仅 sheet 形态渲染，作为「可下拉」的暗示 */
.dialog-grabber {
  display: none;
}

@media (max-width: 600px) {
  .dialog-layer {
    padding: 8px;
  }

  .dialog-surface.size-full {
    max-height: calc(100dvh - 16px);
  }

  /* 手机端的抽屉形态：贴底、全宽、仅上圆角。 */
  .dialog-layer.placement-sheet {
    place-items: end center;
    padding: 0;
  }

  .dialog-layer.placement-sheet .dialog-surface {
    width: 100%;
    max-height: min(85dvh, 100%);
    padding-top: 14px;
    padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
    border-radius: var(--md-sys-shape-corner-extra-large)
      var(--md-sys-shape-corner-extra-large) 0 0;
    /* 下拉跟随：位移写入 CSS 变量，避免内联 transform 压过离场动画 */
    transform: translateY(var(--sheet-drag, 0px));
    transition:
      transform var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized-decelerate),
      opacity var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized-decelerate);
  }

  /* 拖拽中不做过渡，保证跟手 */
  .dialog-layer.placement-sheet.is-dragging .dialog-surface {
    transition: none;
  }

  .dialog-layer.placement-sheet .dialog-grabber {
    display: block;
    width: 32px;
    height: 4px;
    margin: 0 auto 14px;
    border-radius: var(--md-sys-shape-corner-full);
    background-color: var(--md-sys-color-outline);
    opacity: 0.6;
  }

  .dialog-layer.placement-sheet.dialog-enter-from .dialog-surface,
  .dialog-layer.placement-sheet.dialog-leave-to .dialog-surface {
    transform: translateY(100%);
  }
}

/* 平板竖屏：锚定右下角（导航胶囊所在角），向上展开；胶囊留在下方保持可见 */
@media (pointer: coarse) and (orientation: portrait) and (min-width: 601px) {
  .dialog-layer.placement-corner {
    place-items: end end;
    padding: 0;
  }

  .dialog-layer.placement-corner .dialog-surface {
    width: min(300px, calc(100vw - 32px));
    max-height: min(70dvh, 100%);
    /* 右下留白与胶囊同步（--app-float-x/-y），并让出胶囊高度 + 间隙 */
    margin: 0 max(var(--app-float-x), env(safe-area-inset-right, 0px))
      calc(var(--app-float-y) + 40px + 8px + env(safe-area-inset-bottom, 0px)) 0;
    /* 变形原点落在胶囊处（面板右下方），缩放时朝胶囊回收 */
    transform-origin: 100% calc(100% + 20px);
  }

  /* 展开比回收略慢：进入 decelerate、退出 accelerate，均比原先更短更利落 */
  .dialog-layer.placement-corner.dialog-enter-active .dialog-surface {
    transition:
      transform 240ms var(--md-sys-motion-easing-emphasized-decelerate),
      opacity 180ms var(--md-sys-motion-easing-standard),
      border-radius 240ms var(--md-sys-motion-easing-emphasized-decelerate);
  }

  .dialog-layer.placement-corner.dialog-leave-active .dialog-surface {
    transition:
      transform 200ms var(--md-sys-motion-easing-emphasized-accelerate),
      opacity 160ms var(--md-sys-motion-easing-standard),
      border-radius 200ms var(--md-sys-motion-easing-emphasized-accelerate);
  }

  /* 从胶囊处变形展开：小尺寸、胶囊圆角 → 面板尺寸、卡片圆角；关闭时反向缩回 */
  .dialog-layer.placement-corner.dialog-enter-from .dialog-surface,
  .dialog-layer.placement-corner.dialog-leave-to .dialog-surface {
    opacity: 0;
    transform: translate(0, 16px) scale(0.45);
    border-radius: var(--md-sys-shape-corner-full);
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
