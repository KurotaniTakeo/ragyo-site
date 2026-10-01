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
  /** 最近一次高亮请求，目标分屏据此播放短暂高亮 */
  highlightRequest: Ref<HighlightRequest | null>
  /** 请求在跳转后短暂高亮某个子目标 */
  requestHighlight: (section: string, target: string) => void
}

/**
 * 一次「跳转后短暂高亮」的请求。
 *
 * 跨分屏的强调动作（例如从下载区跳到制作名单里的作者）不能直接操作 DOM，
 * 因此由发起方写入请求、目标分屏自行读取并播放高亮。
 */
export interface HighlightRequest {
  /** 目标分屏 id */
  section: string
  /** 该分屏内的子目标 key，由目标分屏自行解释 */
  target: string
  /** 自增序号，保证重复点击同一目标也能重新触发 */
  token: number
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
