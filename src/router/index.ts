import type { RouteRecordRaw } from 'vue-router'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@/i18n'

/**
 * 站点只有一页（9 个全屏分屏），路由的唯一职责是三语前缀。
 *
 * 每个语言一条独立路由，而不是用 /:locale 动态参数：
 * vite-ssg 会为每条静态路由预渲染一份 HTML，
 * 这样 /ja/ /zh/ /en/ 各自拥有正确的 <html lang>、<title> 与 OGP 标签，
 * 社交平台抓取与 hreflang 才能真正生效。
 */
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: `/${DEFAULT_LOCALE}/`,
  },
  ...SUPPORTED_LOCALES.map((locale) => ({
    path: `/${locale}/`,
    name: `home-${locale}`,
    component: () => import('@/views/HomePage.vue'),
    meta: { locale: locale satisfies Locale },
  })),
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: `/${DEFAULT_LOCALE}/`,
  },
]
