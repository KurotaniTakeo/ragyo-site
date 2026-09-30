/**
 * 复制到剪贴板。
 *
 * navigator.clipboard 只在安全上下文（https / localhost）可用，
 * 本地用 file:// 预览或非 https 部署时需要一个兜底方案，
 * 否则百度網盤提取码这种高频操作会直接失效。
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* 落到下面的兜底实现 */
    }
  }

  if (typeof document === 'undefined') return false

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-1000px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)

  try {
    textarea.select()
    const ok = document.execCommand('copy')
    return ok
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}
