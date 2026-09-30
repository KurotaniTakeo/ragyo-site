import type { Directive, DirectiveBinding } from 'vue'

/**
 * Material 涟漪（ripple）指令。
 *
 * 用法：<button v-ripple>…</button>
 *
 * 实现要点：
 *   - 涟漪元素由指令动态插入，动画结束后自行移除，不留残余节点；
 *   - 通过 currentColor 着色，因此按钮换色无需改指令；
 *   - prefers-reduced-motion 下直接不产生涟漪。
 */

interface RippleEl extends HTMLElement {
  __rippleCleanup?: () => void
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function createRipple(event: PointerEvent, host: RippleEl) {
  const rect = host.getBoundingClientRect()
  // 涟漪直径取矩形对角线，保证从任意位置扩散都能覆盖整个元素
  const diameter = Math.hypot(rect.width, rect.height)
  const radius = diameter / 2

  const ripple = document.createElement('span')
  ripple.className = 'md-ripple'
  ripple.setAttribute('aria-hidden', 'true')
  ripple.style.width = `${diameter}px`
  ripple.style.height = `${diameter}px`
  ripple.style.left = `${event.clientX - rect.left - radius}px`
  ripple.style.top = `${event.clientY - rect.top - radius}px`

  host.appendChild(ripple)
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
}

export const ripple: Directive<RippleEl, boolean | undefined> = {
  mounted(el: RippleEl, binding: DirectiveBinding<boolean | undefined>) {
    if (binding.value === false) return

    el.classList.add('md-ripple-host')

    const onPointerDown = (event: PointerEvent) => {
      // 只响应主键；键盘触发的 click 也走这里，坐标取元素中心
      if (event.button !== 0 || prefersReducedMotion()) return
      createRipple(event, el)
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.__rippleCleanup = () => el.removeEventListener('pointerdown', onPointerDown)
  },

  unmounted(el: RippleEl) {
    el.__rippleCleanup?.()
    delete el.__rippleCleanup
  },
}

export default ripple
