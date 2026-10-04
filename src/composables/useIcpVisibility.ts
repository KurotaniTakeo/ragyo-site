import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

/**
 * ICP 备案号的遮挡检测。
 *
 * 备案号固定在视口左下角，但各分屏的内容（卡片、条款底部按钮等）与固定 UI
 * （左侧导航轨、移动端导航胶囊）可能压在同一位置。本 composable 用几何相交
 * 判断「当前屏是否会盖住备案号」，供 App.vue 决定是否隐藏。
 *
 * 测量要点：
 *   1. 只扫描当前激活分屏、`.section-nav` 与 `.app-bar`，不遍历全页；
 *   2. 对分屏内元素按分屏自身偏移做归一化（`-sectionRect.left/top`），等价于
 *      「该分屏已吸附到位」的坐标。这样切屏瞬间即可得到稳定结果，无需等待
 *      0.5s 的滚动动画，也就不会先闪一下备案号；
 *   3. 只把「真的在绘制」的元素算作遮挡（媒体、控件、背景、自身文字），
 *      跳过纯布局容器、`pointer-events: none` 与隐藏元素，避免把透明容器误判；
 *   4. 相交需在横向、纵向都达到阈值，避免边缘擦到几像素就隐藏。
 *
 * 语言切换会改变文案宽度、字体异步加载会改变行高，入场动画（data-reveal）
 * 会有最多 18px 位移，因此除即时测量外，还在 `settleDelay` 后补测一次修正。
 */

/** 纯布局容器：即使整块铺满视口也不算「内容」 */
const LAYOUT_TAGS = new Set(['HTML', 'BODY', 'MAIN', 'NAV'])
const LAYOUT_CLASSES = new Set([
  'snap-scroller',
  'snap-section',
  'section-body',
  'section-panel',
  'section-inner',
  'section-nav',
  'app-bar',
])

/** 媒体元素一律视为绘制内容 */
const MEDIA_TAGS = new Set(['IMG', 'VIDEO', 'CANVAS', 'PICTURE', 'SVG'])

/** 表单控件 / 链接：其可点击区域压住备案号即算遮挡 */
const CONTROL_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'])

/** 判定遮挡所需的最小重叠尺寸（px）：边缘擦过不计 */
const MIN_OVERLAP_X = 4
const MIN_OVERLAP_Y = 4

function isLayout(el: Element): boolean {
  if (LAYOUT_TAGS.has(el.tagName)) return true
  for (const cls of el.classList) {
    if (LAYOUT_CLASSES.has(cls)) return true
  }
  return false
}

/** 元素是否在绘制内容：背景、自身文字、媒体或控件 */
function paints(el: Element): boolean {
  const tag = el.tagName
  if (MEDIA_TAGS.has(tag) || CONTROL_TAGS.has(tag)) return true
  for (const node of el.childNodes) {
    if (node.nodeType === 3 && node.textContent?.trim()) return true
  }
  const style = getComputedStyle(el)
  if (style.backgroundColor !== 'rgba(0, 0, 0, 0)') return true
  if (style.backgroundImage !== 'none') return true
  return false
}

/** 元素自身可见（祖先的 display:none 会使其矩形归零，自然被排除） */
function isVisible(el: Element): boolean {
  const style = getComputedStyle(el)
  if (style.pointerEvents === 'none') return false
  if (style.visibility === 'hidden' || style.display === 'none') return false
  return parseFloat(style.opacity) !== 0
}

export interface UseIcpVisibilityOptions {
  /** 当前屏序号 */
  activeIndex: Ref<number>
  /** 备案号元素；须始终渲染（隐藏用 visibility，保证隐藏时仍可测量） */
  icpRef: Ref<HTMLElement | null>
  /** 当前语言，文案宽度变化后需要重测 */
  locale: Ref<string>
  /** 切屏 / 入场动画结束后的补测延迟（ms） */
  settleDelay?: number
}

export function useIcpVisibility({
  activeIndex,
  icpRef,
  locale,
  settleDelay = 700,
}: UseIcpVisibilityOptions) {
  /** 当前屏是否遮挡了备案号（首页由调用方单独豁免） */
  const covered = ref(false)

  function measure() {
    const icp = icpRef.value
    if (!icp) {
      covered.value = false
      return
    }
    const icpRect = icp.getBoundingClientRect()
    if (icpRect.width === 0 || icpRect.height === 0) {
      covered.value = false
      return
    }

    // 扫描根节点 + 其坐标归一化偏移（分屏用自身偏移换算到「吸附到位」位置）
    const roots: Array<{ el: Element; dx: number; dy: number }> = []
    const section = document.querySelector('.snap-section[data-active="true"]')
    if (section) {
      const sr = section.getBoundingClientRect()
      roots.push({ el: section, dx: -sr.left, dy: -sr.top })
    }
    for (const selector of ['.section-nav', '.app-bar']) {
      const el = document.querySelector(selector)
      if (el) roots.push({ el, dx: 0, dy: 0 })
    }

    for (const { el: root, dx, dy } of roots) {
      for (const el of root.querySelectorAll('*')) {
        if (el === icp || el.contains(icp) || icp.contains(el)) continue
        if (isLayout(el)) continue

        const rect = el.getBoundingClientRect()
        const left = rect.left + dx
        const top = rect.top + dy
        const right = rect.right + dx
        const bottom = rect.bottom + dy
        const overlapX = Math.min(icpRect.right, right) - Math.max(icpRect.left, left)
        const overlapY = Math.min(icpRect.bottom, bottom) - Math.max(icpRect.top, top)
        if (overlapX < MIN_OVERLAP_X || overlapY < MIN_OVERLAP_Y) continue

        if (isVisible(el) && paints(el)) {
          covered.value = true
          return
        }
      }
    }
    covered.value = false
  }

  let frame = 0
  let settleTimer = 0

  /** 合并到下一帧测量，并预约一次动画结束后的补测 */
  function schedule() {
    if (import.meta.env.SSR) return
    window.cancelAnimationFrame(frame)
    frame = window.requestAnimationFrame(measure)
    window.clearTimeout(settleTimer)
    settleTimer = window.setTimeout(measure, settleDelay)
  }

  watch(activeIndex, schedule)
  watch(locale, schedule)

  onMounted(() => {
    schedule()
    document.fonts?.ready.then(schedule)
    window.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)
  })

  onBeforeUnmount(() => {
    window.cancelAnimationFrame(frame)
    window.clearTimeout(settleTimer)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('orientationchange', schedule)
  })

  return { covered }
}
