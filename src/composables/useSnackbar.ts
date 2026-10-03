import { readonly, ref } from 'vue'

/**
 * 全局 Snackbar。
 * 提取码复制、链接失效提示等场景共用同一条消息通道。
 * 宿主组件见 components/SnackbarHost.vue，在 App.vue 挂载一次。
 */

/** 锚点矩形：有值时提示显示在锚点正上方，否则默认底部居中 */
export interface SnackbarAnchor {
  left: number
  top: number
  width: number
}

export interface SnackbarOptions {
  duration?: number
  /** 传入触发元素后，提示会显示在该元素的正上方 */
  anchor?: HTMLElement | null
}

const message = ref<string | null>(null)
const anchor = ref<SnackbarAnchor | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

export function showSnackbar(text: string, options: SnackbarOptions = {}) {
  const { duration = 2600, anchor: target = null } = options

  message.value = text
  anchor.value = target
    ? (() => {
        const rect = target.getBoundingClientRect()
        return { left: rect.left, top: rect.top, width: rect.width }
      })()
    : null

  clearTimeout(timer)
  timer = setTimeout(() => {
    message.value = null
    anchor.value = null
  }, duration)
}

export function useSnackbar() {
  return {
    message: readonly(message),
    anchor: readonly(anchor),
    show: showSnackbar,
  }
}
