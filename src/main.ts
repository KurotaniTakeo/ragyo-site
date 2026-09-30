import { ViteSSG } from 'vite-ssg'
import { ripple } from '@/directives/ripple'
import { createI18nInstance } from '@/i18n'
import { routes } from '@/router'
import App from './App.vue'
import './styles/main.css'

/**
 * 入口。
 *
 * 用 vite-ssg 的 ViteSSG 而不是 createApp：
 * 构建时会把 /ja/ /zh/ /en/ 各预渲染成一份带完整文案与 head 标签的静态 HTML，
 * 这正是三语站点能被社交平台正确抓取 OGP 的前提。
 */
export const createApp = ViteSSG(
  App,
  { routes },
  ({ app }) => {
    app.use(createI18nInstance())
    app.directive('ripple', ripple)
  },
)
