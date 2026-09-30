import { readonly, ref } from 'vue'

/**
 * 全局 Snackbar。
 * 提取码复制、链接失效提示等场景共用同一条消息通道。
 * 宿主组件见 components/SnackbarHost.vue，在 App.vue 挂载一次。
 */
const message = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

export function showSnackbar(text: string, duration = 2600) {
  message.value = text
  clearTimeout(timer)
  timer = setTimeout(() => {
    message.value = null
  }, duration)
}

export function useSnackbar() {
  return {
    message: readonly(message),
    show: showSnackbar,
  }
}
