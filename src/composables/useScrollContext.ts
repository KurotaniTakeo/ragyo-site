import { inject, provide, type InjectionKey, type Ref } from 'vue'

/**
 * 全屏滚动的共享上下文。
 *
 * 滚动容器由 App.vue 持有（它需要同时驱动顶栏的滚动态与导航轨的高亮），
 * 但「跳到第几屏」这个动作要从 Hero 的 CTA、导航轨、哈希深链等多处触发，
 * 因此用 provide/inject 下发，避免每个 section 都去操作 DOM。
 */
export interface ScrollContext {
  /** 当前屏序号 */
  activeIndex: Ref<number>
  /** 是否由脚本接管了滚轮（桌面端为 true） */
  hijacking: Ref<boolean>
  /** 是否暂时挂起接管（例如打开了 Dialog） */
  suspended: Ref<boolean>
  /** 跳到指定序号 */
  goTo: (index: number) => void
  /** 跳到指定 section id */
  goToId: (id: string) => void
}

export const SCROLL_CONTEXT_KEY: InjectionKey<ScrollContext> = Symbol('ragyo-scroll-context')

export function provideScrollContext(context: ScrollContext) {
  provide(SCROLL_CONTEXT_KEY, context)
}

export function useScrollContext(): ScrollContext {
  const context = inject(SCROLL_CONTEXT_KEY)
  if (!context) {
    throw new Error('useScrollContext() 必须在 provideScrollContext() 之后使用')
  }
  return context
}
