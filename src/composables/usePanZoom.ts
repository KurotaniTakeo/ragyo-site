import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

/**
 * 立绘的拖拽平移与滚轮/双指缩放。
 *
 * 交互全部挂在舞台元素上（而不是图片本身），图片只作为被 transform 的层：
 *   - 滚轮 / 双指捏合：以指针为锚点缩放，光标下的点保持不动；
 *   - 单指 / 鼠标拖拽：平移；
 *   - 平移量钳制在「放大出来的余量」内，立绘不会被拖出舞台。
 *
 * 只在浏览器环境挂载：目标元素由 v-if 控制挂载/卸载，watch 会随之增删监听。
 */
export interface PanZoomOptions {
  /** 最小缩放（1 = 适应舞台） */
  min?: number
  /** 最大缩放 */
  max?: number
}

export interface PanZoomState {
  scale: Ref<number>
  x: Ref<number>
  y: Ref<number>
  dragging: Ref<boolean>
  reset: () => void
  /** 以舞台中心为锚点按步长缩放（供 ＋/－ 按钮使用） */
  zoomBy: (delta: number) => void
}

interface Point {
  x: number
  y: number
}

export function usePanZoom(target: Ref<HTMLElement | null>, options: PanZoomOptions = {}): PanZoomState {
  const min = options.min ?? 1
  const max = options.max ?? 6

  const scale = ref(1)
  const x = ref(0)
  const y = ref(0)
  const dragging = ref(false)

  const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value))

  /** 把平移量限制在放大出来的余量内，避免立绘被整个拖出舞台 */
  function constrain() {
    const el = target.value
    if (!el) return
    const maxX = (el.clientWidth * (scale.value - 1)) / 2
    const maxY = (el.clientHeight * (scale.value - 1)) / 2
    x.value = clamp(x.value, -maxX, maxX)
    y.value = clamp(y.value, -maxY, maxY)
  }

  /** 以屏幕坐标 (clientX, clientY) 为锚点缩放到 next */
  function zoomAt(next: number, clientX: number, clientY: number) {
    const el = target.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = clientX - rect.left - rect.width / 2
    const py = clientY - rect.top - rect.height / 2
    const clamped = clamp(next, min, max)
    const ratio = clamped / scale.value
    x.value = px - (px - x.value) * ratio
    y.value = py - (py - y.value) * ratio
    scale.value = clamped
    constrain()
  }

  function reset() {
    scale.value = 1
    x.value = 0
    y.value = 0
  }

  function zoomBy(delta: number) {
    const el = target.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    zoomAt(scale.value + delta, rect.left + rect.width / 2, rect.top + rect.height / 2)
  }

  /* -------------------- 指针手势 -------------------- */

  const pointers = new Map<number, Point>()
  let panLast: Point | null = null
  let pinchDist = 0
  let pinchMid: Point | null = null

  /** 手指数变化后重置手势基准点 */
  function syncGesture() {
    panLast = null
    pinchDist = 0
    pinchMid = null
    if (pointers.size === 1) {
      const [p] = [...pointers.values()]
      panLast = { x: p.x, y: p.y }
    } else if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()]
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
      pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    }
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const host = event.currentTarget as HTMLElement | null
    // 合成事件或指针已失效时 setPointerCapture 会抛错，忽略即可
    try {
      host?.setPointerCapture?.(event.pointerId)
    } catch {
      /* noop */
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    dragging.value = true
    syncGesture()
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.size === 1 && panLast) {
      x.value += event.clientX - panLast.x
      y.value += event.clientY - panLast.y
      panLast = { x: event.clientX, y: event.clientY }
      constrain()
      return
    }

    if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      if (pinchMid && pinchDist > 0) {
        x.value += mid.x - pinchMid.x
        y.value += mid.y - pinchMid.y
        zoomAt(scale.value * (dist / pinchDist), mid.x, mid.y)
      }
      pinchDist = dist
      pinchMid = mid
    }
  }

  function onPointerEnd(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return
    pointers.delete(event.pointerId)
    const host = event.currentTarget as HTMLElement | null
    if (host?.hasPointerCapture?.(event.pointerId)) {
      try {
        host.releasePointerCapture(event.pointerId)
      } catch {
        /* noop */
      }
    }
    if (pointers.size === 0) dragging.value = false
    syncGesture()
  }

  /** 一次滚动手势的类型；空闲后重置，避免同一手势忽而平移忽而缩放 */
  let wheelGesture: 'mouse' | 'trackpad' | null = null
  let wheelGestureTimer = 0

  /**
   * 判断 wheel 更可能来自鼠标滚轮还是触控板。
   * 鼠标滚轮是离散整步进（Chromium 约 100px；行模式则 deltaMode=1），且一般无横向分量；
   * 触控板双指滚动常带横向分量，或步进细小、非整数。判定不完美，只在手势开始时决策一次。
   */
  function classifyWheel(event: WheelEvent): 'mouse' | 'trackpad' {
    if (event.deltaMode !== 0) return 'mouse'
    if (event.deltaX !== 0) return 'trackpad'
    if (Number.isInteger(event.deltaY) && Math.abs(event.deltaY) >= 40) return 'mouse'
    return 'trackpad'
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault()

    // 触控板捏合会被浏览器合成为 ctrl+wheel；Ctrl/⌘+滚轮同样强制缩放
    if (event.ctrlKey || event.metaKey) {
      // 指数映射：不同设备的 deltaY 量级差异很大，用指数更跟手
      zoomAt(scale.value * Math.exp(-event.deltaY * 0.0015), event.clientX, event.clientY)
      return
    }

    if (wheelGesture === null) wheelGesture = classifyWheel(event)
    window.clearTimeout(wheelGestureTimer)
    wheelGestureTimer = window.setTimeout(() => {
      wheelGesture = null
    }, 160)

    // 触控板双指：平移（与内容自然滚动同向），并约束回放大余量内
    if (wheelGesture === 'trackpad') {
      x.value -= event.deltaX
      y.value -= event.deltaY
      constrain()
      return
    }

    // 鼠标滚轮：缩放
    zoomAt(scale.value * Math.exp(-event.deltaY * 0.0015), event.clientX, event.clientY)
  }

  function onDoubleClick(event: MouseEvent) {
    if (scale.value > 1.01) reset()
    else zoomAt(2.5, event.clientX, event.clientY)
  }

  /* -------------------- 挂载 / 卸载 -------------------- */

  let attached: HTMLElement | null = null

  function detach() {
    if (!attached) return
    window.clearTimeout(wheelGestureTimer)
    wheelGesture = null
    attached.removeEventListener('wheel', onWheel)
    attached.removeEventListener('pointerdown', onPointerDown)
    attached.removeEventListener('pointermove', onPointerMove)
    attached.removeEventListener('pointerup', onPointerEnd)
    attached.removeEventListener('pointercancel', onPointerEnd)
    attached.removeEventListener('dblclick', onDoubleClick)
    attached = null
  }

  watch(
    target,
    (el) => {
      detach()
      if (el) {
        attached = el
        el.addEventListener('wheel', onWheel, { passive: false })
        el.addEventListener('pointerdown', onPointerDown)
        el.addEventListener('pointermove', onPointerMove)
        el.addEventListener('pointerup', onPointerEnd)
        el.addEventListener('pointercancel', onPointerEnd)
        el.addEventListener('dblclick', onDoubleClick)
      }
    },
    { immediate: true, flush: 'post' },
  )

  onBeforeUnmount(detach)

  return { scale, x, y, dragging, reset, zoomBy }
}
