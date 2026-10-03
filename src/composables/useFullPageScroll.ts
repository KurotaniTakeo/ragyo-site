import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * 全屏翻页滚动。
 *
 * 分层设计：
 *   1. 基础层为原生 CSS scroll-snap（见 main.css 的 .snap-scroller），
 *      触屏、脚本失效、prefers-reduced-motion 时都能正常工作。
 *   2. 增强层（本 composable）只在桌面鼠标环境接管滚轮：
 *      累积滚轮增量到阈值后翻整屏，并加锁避免一次手势连翻多屏。
 *
 * 与「内容超过一屏」的 section 共存：
 *   若当前 section 内部的 [data-scrollable] 面板在滚动方向上还有余量，
 *   则不拦截滚轮，交给面板原生滚动；滚到底后再翻页。
 *
 * 横向多栏长文（使用条款）：
 *   section 内部可有 [data-scrollable-x] 横向滚动区。Shift+滚轮或触控板横向手势
 *   用来左右滚动它；只要存在横向余量就由这里接管，不会误触整屏翻页。
 *   ←/→ 键同样左右滚动。
 */

/** 翻页动画时长，与 --app-scroll-duration 保持一致 */
const SCROLL_DURATION = 520

/** 翻页动画结束后额外保持的锁定时长，用于吸收触控板惯性 */
const LOCK_GRACE = 220

/** 触控板的单次事件增量很小，累积到这个值才判定为一次翻页意图 */
const WHEEL_THRESHOLD = 40

/** 超过这个间隔没有滚轮事件就清空累积量 */
const WHEEL_IDLE = 160

/** 面板刚滚到边界后的冷却：这段时间内不翻页，用来吸收同一手势的惯性余量 */
const PANEL_EDGE_COOLDOWN = 500

export interface FullPageScrollOptions {
  /** 滚动容器（.snap-scroller） */
  scroller: Ref<HTMLElement | null>
  /** 强制关闭接管，例如打开 Dialog 时 */
  suspended?: Ref<boolean>
}

export function useFullPageScroll({ scroller, suspended }: FullPageScrollOptions) {
  const activeIndex = ref(0)
  const sectionCount = ref(0)
  /** 是否处于接管状态，供 UI 决定是否显示「滚动提示」等 */
  const hijacking = ref(false)

  let sectionEls: HTMLElement[] = []
  let locked = false
  let lockTimer = 0
  let wheelAccum = 0
  let wheelIdleTimer = 0
  let reduceMotion = false
  /** 上一次滚轮事件是否在滚动分屏内部的面板 */
  let panelScrolling = false
  /** 面板刚触边后的冷却截止时间（performance.now()） */
  let panelEdgeUntil = 0
  /** 程序化平滑滚动进行中：期间不由滚动位置反推 activeIndex */
  let animating = false
  let animTimer = 0

  const querySections = () =>
    Array.from(scroller.value?.querySelectorAll<HTMLElement>('[data-section]') ?? [])

  const offsetOf = (el: HTMLElement) => {
    const container = scroller.value
    if (!container) return el.offsetTop
    return el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
  }

  const clamp = (index: number) => Math.max(0, Math.min(sectionEls.length - 1, index))

  function goTo(index: number, smooth = true) {
    const target = clamp(index)
    const el = sectionEls[target]
    const container = scroller.value
    if (!el || !container) return

    const animated = smooth && !reduceMotion
    container.scrollTo({
      top: offsetOf(el),
      behavior: animated ? 'smooth' : 'auto',
    })
    activeIndex.value = target
    // 平滑滚动期间禁止 syncActiveFromScroll 反推：否则滚动起点会先把 activeIndex
    // 拍回上一屏、再随滚动改回目标，URL 与分屏高亮/入场动画会来回抖动。动画
    // 结束后再交还给滚动事件。定时器时长与滚动动画 + 惯性宽限保持一致。
    animating = animated
    window.clearTimeout(animTimer)
    if (animated) {
      animTimer = window.setTimeout(() => {
        animating = false
      }, SCROLL_DURATION + LOCK_GRACE)
    }
    // 切屏时清掉面板滚动的临时状态，避免把上一屏的惯性算到新屏上
    panelScrolling = false
    panelEdgeUntil = 0
    wheelAccum = 0
  }

  const next = () => goTo(activeIndex.value + 1)
  const prev = () => goTo(activeIndex.value - 1)

  function lock() {
    locked = true
    window.clearTimeout(lockTimer)
    lockTimer = window.setTimeout(() => {
      locked = false
    }, SCROLL_DURATION + LOCK_GRACE)
  }

  /** 当前 section 内部的可滚动面板在此方向上是否还有余量 */
  function panelCanScroll(sectionEl: HTMLElement, deltaY: number) {
    const panel = sectionEl.querySelector<HTMLElement>('[data-scrollable]')
    if (!panel) return false
    const max = panel.scrollHeight - panel.clientHeight
    if (max <= 1) return false
    return deltaY > 0 ? panel.scrollTop < max - 1 : panel.scrollTop > 1
  }

  /** section 内的横向多栏滚动区（使用条款等） */
  const xPanelOf = (sectionEl: HTMLElement | undefined) =>
    sectionEl?.querySelector<HTMLElement>('[data-scrollable-x]') ?? null

  /** 横向滚动区在此方向上是否还有余量 */
  function panelCanScrollX(panel: HTMLElement, deltaX: number) {
    const max = panel.scrollWidth - panel.clientWidth
    if (max <= 1) return false
    return deltaX > 0 ? panel.scrollLeft < max - 1 : panel.scrollLeft > 1
  }

  function syncActiveFromScroll() {
    if (animating) return
    const container = scroller.value
    if (!container || sectionEls.length === 0) return
    const probe = container.scrollTop + container.clientHeight / 2
    let index = 0
    for (let i = 0; i < sectionEls.length; i += 1) {
      const top = offsetOf(sectionEls[i])
      if (top <= probe) index = i
      else break
    }
    activeIndex.value = index
  }

  function onWheel(event: WheelEvent) {
    const container = scroller.value
    if (!container || suspended?.value) return

    const rawDeltaX = event.deltaX
    const delta = event.deltaY

    // 归一化：部分浏览器/设备会把一次滚动拆成大量小 delta
    const mode = event.deltaMode
    const normalized = mode === 1 ? delta * 16 : mode === 2 ? delta * container.clientHeight : delta

    const currentEl = sectionEls[activeIndex.value]

    // 横向优先：Shift+滚轮或触控板的横向手势 → 滚动 section 内的横向多栏区。
    // 只要该区存在横向余量就完全接管（到边也不翻页），避免误触整屏切换。
    const shiftWheel = event.shiftKey && rawDeltaX === 0
    const horizontal = shiftWheel ? normalized : rawDeltaX
    const horizontalIntent =
      horizontal !== 0 && (shiftWheel || Math.abs(rawDeltaX) > Math.abs(delta))
    const xPanel = xPanelOf(currentEl)
    if (currentEl && horizontalIntent && xPanel && xPanel.scrollWidth - xPanel.clientWidth > 1) {
      event.preventDefault()
      if (panelCanScrollX(xPanel, horizontal)) {
        xPanel.scrollLeft += horizontal
      }
      wheelAccum = 0
      panelScrolling = false
      return
    }

    if (delta === 0) return

    // 空闲即重置：只有紧跟在面板滚动之后的惯性才会被吃掉
    window.clearTimeout(wheelIdleTimer)
    wheelIdleTimer = window.setTimeout(() => {
      wheelAccum = 0
      panelScrolling = false
      panelEdgeUntil = 0
    }, WHEEL_IDLE)

    // 面板还能滚：交给原生滚动，且不计入翻页累积
    if (currentEl && panelCanScroll(currentEl, normalized)) {
      panelScrolling = true
      wheelAccum = 0
      return
    }

    // 到这里说明要翻页，阻断原生滚动
    event.preventDefault()

    const now = performance.now()

    // 刚把面板滚到边界：这一下多半是同一次手势的惯性，直接吃掉并进入冷却
    if (panelScrolling) {
      panelScrolling = false
      wheelAccum = 0
      panelEdgeUntil = now + PANEL_EDGE_COOLDOWN
      return
    }

    // 冷却期内不翻页，要求用户重新开始一次手势
    if (now < panelEdgeUntil) {
      wheelAccum = 0
      return
    }

    if (locked) return

    wheelAccum += Math.abs(normalized)
    if (wheelAccum < WHEEL_THRESHOLD) return

    wheelAccum = 0
    lock()
    if (normalized > 0) next()
    else prev()
  }

  /**
   * 键盘翻页前先看分屏内部的面板还能不能滚。
   * 能滚就滚面板（约一屏的 90%），而不是直接翻页。
   */
  function scrollPanelBy(sectionEl: HTMLElement | undefined, direction: 1 | -1) {
    const panel = sectionEl?.querySelector<HTMLElement>('[data-scrollable]')
    if (!panel) return false
    const max = panel.scrollHeight - panel.clientHeight
    if (max <= 1) return false
    const step = panel.clientHeight * 0.9
    const target = Math.max(0, Math.min(max, panel.scrollTop + direction * step))
    if (target === panel.scrollTop) return false
    panel.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' })
    return true
  }

  /** ←/→ 键滚动横向多栏区（约一屏的 90%） */
  function scrollPanelXBy(sectionEl: HTMLElement | undefined, direction: 1 | -1) {
    const panel = xPanelOf(sectionEl)
    if (!panel) return false
    const max = panel.scrollWidth - panel.clientWidth
    if (max <= 1) return false
    const step = panel.clientWidth * 0.9
    const target = Math.max(0, Math.min(max, panel.scrollLeft + direction * step))
    if (target === panel.scrollLeft) return false
    panel.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' })
    return true
  }

  function onKeydown(event: KeyboardEvent) {
    if (suspended?.value) return

    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable="true"]')) return

    switch (event.key) {
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        event.preventDefault()
        // 面板还能往下滚就先滚面板，滚到底再翻页
        if (scrollPanelBy(sectionEls[activeIndex.value], 1)) break
        if (locked) break
        lock()
        next()
        break
      case 'ArrowUp':
      case 'PageUp':
        event.preventDefault()
        if (scrollPanelBy(sectionEls[activeIndex.value], -1)) break
        if (locked) break
        lock()
        prev()
        break
      case 'ArrowRight':
        event.preventDefault()
        scrollPanelXBy(sectionEls[activeIndex.value], 1)
        break
      case 'ArrowLeft':
        event.preventDefault()
        scrollPanelXBy(sectionEls[activeIndex.value], -1)
        break
      case 'Home':
        event.preventDefault()
        goTo(0)
        break
      case 'End':
        event.preventDefault()
        goTo(sectionEls.length - 1)
        break
      default:
        break
    }
  }

  /** 支持 #download 这类深链：配布时可直接分享某一屏 */
  function applyHash(smooth = false) {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    if (!id) return false
    const index = sectionEls.findIndex((el) => el.dataset.section === id)
    if (index < 0) return false
    goTo(index, smooth)
    return true
  }

  function onHashChange() {
    applyHash(true)
  }

  function setup() {
    const container = scroller.value
    if (!container) return

    sectionEls = querySections()
    sectionCount.value = sectionEls.length
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // 只有精确指针（鼠标）+ 足够宽的视口才接管滚轮。
    // 触屏与窄屏保留原生 scroll-snap，手感更自然。
    const coarse = window.matchMedia('(pointer: coarse)').matches
    hijacking.value =
      !coarse && !reduceMotion && window.innerWidth > 860 && sectionEls.length > 1

    if (hijacking.value) {
      container.addEventListener('wheel', onWheel, { passive: false })
    }
    container.addEventListener('scroll', syncActiveFromScroll, { passive: true })
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('hashchange', onHashChange)

    if (!applyHash(false)) {
      syncActiveFromScroll()
    }
  }

  function teardown() {
    const container = scroller.value
    container?.removeEventListener('wheel', onWheel)
    container?.removeEventListener('scroll', syncActiveFromScroll)
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('hashchange', onHashChange)
    window.clearTimeout(lockTimer)
    window.clearTimeout(wheelIdleTimer)
    window.clearTimeout(animTimer)
  }

  /** 移动端断点变化时重新判定是否接管 */
  function handleResize() {
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const shouldHijack =
      !coarse &&
      !reduceMotion &&
      window.innerWidth > 860 &&
      (scroller.value?.querySelectorAll('[data-section]').length ?? 0) > 1

    if (shouldHijack === hijacking.value) return

    const container = scroller.value
    if (!container) return

    if (shouldHijack) container.addEventListener('wheel', onWheel, { passive: false })
    else container.removeEventListener('wheel', onWheel)

    hijacking.value = shouldHijack
  }

  onMounted(() => {
    setup()
    window.addEventListener('resize', handleResize)
  })

  onBeforeUnmount(() => {
    teardown()
    window.removeEventListener('resize', handleResize)
  })

  return {
    activeIndex,
    sectionCount,
    hijacking,
    goTo,
    next,
    prev,
  }
}
