import { onBeforeUnmount, ref, type Ref } from 'vue'
import { midiToNoteName } from '@/utils/pitch'

/**
 * 音域条的指针悬停：把光标横坐标换算成所指音高。
 *
 * 交互约定：
 *   - 音域条由若干 `[data-range-segment]`（带 data-low / data-high）组成，
 *     段间有间隙，所以不能拿整条宽度线性换算，必须按命中段做段内插值；
 *   - 音名与 MIDI 始终跟随光标的真实位置（精确），只有参考线的横坐标做指数
 *     平滑（缓动），两者分离，避免「读数滞后于光标」；
 *   - 触摸不参与：hover 在触屏上无意义，且会与滚动抢手势。
 *
 * 只在浏览器端挂事件，SSR 下不发生任何副作用。
 */

/** 指数平滑系数：越大越跟手，越小越黏 */
const EASE = 0.22
/** 距目标小于该值即吸附并停止 rAF，避免空转 */
const SNAP = 0.35

export interface PitchHoverState {
  /** 指针是否在音域条上 */
  active: Ref<boolean>
  /** 平滑后的参考线横坐标（相对音域条左边缘，px） */
  x: Ref<number>
  /** 当前所指音名，如 G3 */
  note: Ref<string>
  /** 当前所指 MIDI 编号 */
  midi: Ref<number>
  /** 指针命中的音阶段下标，-1 表示未命中 */
  index: Ref<number>
  onPointerEnter: (event: PointerEvent) => void
  onPointerMove: (event: PointerEvent) => void
  onPointerLeave: () => void
}

export function usePitchHover(
  container: Ref<HTMLElement | null>,
  options: { low: number; high: number },
): PitchHoverState {
  const active = ref(false)
  const x = ref(0)
  const note = ref('')
  const midi = ref(options.low)
  const index = ref(-1)

  let targetX = 0
  let raf = 0

  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /**
   * 命中最近的音阶段（间隙也算作最近段），按段内比例插值出 MIDI。
   * 命中而非「包含」是为了让 4px 缝隙处读数连续，不闪烁。
   */
  function resolve(clientX: number) {
    const el = container.value
    if (!el) return null
    const segments = Array.from(el.querySelectorAll<HTMLElement>('[data-range-segment]'))
    if (!segments.length) return null

    let bestIndex = -1
    let bestRect: DOMRect | null = null
    let bestLow = options.low
    let bestHigh = options.high
    let bestDist = Infinity

    for (let i = 0; i < segments.length; i++) {
      const rect = segments[i].getBoundingClientRect()
      const dist =
        clientX < rect.left ? rect.left - clientX : clientX > rect.right ? clientX - rect.right : 0
      if (dist < bestDist) {
        bestDist = dist
        bestIndex = i
        bestRect = rect
        bestLow = Number(segments[i].dataset.low)
        bestHigh = Number(segments[i].dataset.high)
      }
    }
    if (!bestRect) return null

    const ratio =
      bestRect.width > 0 ? Math.min(1, Math.max(0, (clientX - bestRect.left) / bestRect.width)) : 0
    const value =
      Number.isFinite(bestLow) && Number.isFinite(bestHigh)
        ? bestLow + ratio * (bestHigh - bestLow)
        : options.low

    return {
      x: clientX - el.getBoundingClientRect().left,
      midi: Math.round(value),
      index: bestIndex,
    }
  }

  function tick() {
    raf = 0
    const dx = targetX - x.value
    if (Math.abs(dx) < SNAP) {
      x.value = targetX
      return
    }
    x.value += dx * EASE
    raf = requestAnimationFrame(tick)
  }

  function startLoop() {
    if (reduced || raf) return
    raf = requestAnimationFrame(tick)
  }

  /** 用光标最新位置刷新读数，并让参考线缓动追过去 */
  function apply(clientX: number) {
    const hit = resolve(clientX)
    if (!hit) return
    midi.value = hit.midi
    note.value = midiToNoteName(hit.midi)
    index.value = hit.index
    targetX = hit.x
    if (reduced) x.value = targetX
    else startLoop()
  }

  function onPointerEnter(event: PointerEvent) {
    if (event.pointerType === 'touch') return
    active.value = true
    // 首次进入直接落在光标处，避免参考线从 0 滑过来
    const hit = resolve(event.clientX)
    if (!hit) return
    x.value = hit.x
    targetX = hit.x
    midi.value = hit.midi
    note.value = midiToNoteName(hit.midi)
    index.value = hit.index
  }

  function onPointerMove(event: PointerEvent) {
    if (event.pointerType === 'touch') return
    active.value = true
    apply(event.clientX)
  }

  function onPointerLeave() {
    active.value = false
    index.value = -1
    if (raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
  })

  return { active, x, note, midi, index, onPointerEnter, onPointerMove, onPointerLeave }
}
