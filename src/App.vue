<script setup lang="ts">
/**
 * 应用外壳。
 *
 * 这里持有全站唯一的滚动容器（.snap-scroller）：
 *   - 全屏翻页的接管逻辑需要它
 *   - 顶栏的「已滚动」状态需要监听它的 scroll
 *   - 导航轨与各分屏的 active 状态都从它派生
 * 因此放在最外层，而不是放进某个页面组件。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppBar from '@/components/AppBar.vue'
import NavigationRail from '@/components/NavigationRail.vue'
import SnackbarHost from '@/components/SnackbarHost.vue'
import { useFullPageScroll } from '@/composables/useFullPageScroll'
import {
  provideScrollContext,
  type HighlightRequest,
} from '@/composables/useScrollContext'
import { sections } from '@/data/sections'
import { voicebank } from '@/data/voicebank'
import {
  DEFAULT_LOCALE,
  HREFLANG,
  HTML_LANG,
  LOCALE_STORAGE_KEY,
  OG_LOCALE,
  SUPPORTED_LOCALES,
  isLocale,
  type Locale,
} from '@/i18n'
import { OG_IMAGE_DIR, SITE_URL } from '@/config'
import { FONT_STYLESHEET } from '@/styles/fonts'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n({ useScope: 'global' })

/* ---------------------------------------------------------------- 语言 */

const currentLocale = computed<Locale>(() => (isLocale(route.meta.locale) ? route.meta.locale : DEFAULT_LOCALE))

// 语言以路由为准：这样 SSG 预渲染的每一份 HTML 都带着正确的 lang 与文案
watch(currentLocale, (value) => {
  locale.value = value
}, { immediate: true })

function switchLocale(next: string) {
  if (!isLocale(next)) return
  // 记住手动选择，下次从根路径进入时优先使用
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
  } catch {
    /* 隐私模式下 localStorage 可能不可用，忽略即可 */
  }
  if (next === currentLocale.value) return
  router.push({ path: `/${next}/`, hash: window.location.hash || undefined })
}

/* ------------------------------------------------------------ 滚动容器 */

const scroller = ref<HTMLElement | null>(null)
const suspended = ref(false)
const scrolled = ref(false)

const { activeIndex, hijacking, goTo } = useFullPageScroll({ scroller, suspended })

const goToId = (id: string) => {
  const index = sections.findIndex((section) => section.id === id)
  if (index >= 0) goTo(index)
}

/* ------------------------------------------------------------ 跳转高亮 */

// 只负责发出一份请求；何时结束高亮由目标分屏自己决定
const highlightRequest = ref<HighlightRequest | null>(null)
let highlightToken = 0

const requestHighlight = (section: string, target: string) => {
  highlightToken += 1
  highlightRequest.value = { section, target, token: highlightToken }
}

provideScrollContext({
  activeIndex,
  hijacking,
  suspended,
  goTo,
  goToId,
  highlightRequest,
  requestHighlight,
})

function onScroll() {
  const el = scroller.value
  if (!el) return
  // 桌面纵向翻页看 scrollTop；触屏横向翻页看 scrollLeft
  scrolled.value = el.scrollTop + el.scrollLeft > 8
}

// 用 replaceState 而非 pushState：翻页不应污染浏览器历史，
// 但保留 hash 让 #download 这类深链可以直接分享。
watch(activeIndex, (index) => {
  if (import.meta.env.SSR) return
  const id = sections[index]?.id
  if (!id) return
  // 已经是这个 hash 就不重复写：避免同一屏被反推多次时地址栏闪动
  if (window.location.hash === `#${id}`) return
  const url = `${window.location.pathname}${window.location.search}#${id}`
  window.history.replaceState(null, '', url)
})

onMounted(() => {
  scroller.value?.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  scroller.value?.removeEventListener('scroll', onScroll)
})

/* ------------------------------------------------------- head / SEO */

const origin = SITE_URL ?? ''

const ogImage = computed(() => `${origin}${OG_IMAGE_DIR}/${currentLocale.value}.png`)

useHead(() => {
  const siteName = `${voicebank.name[currentLocale.value]} / ${voicebank.libraryName}`

  return {
    htmlAttrs: { lang: HTML_LANG[currentLocale.value] },
    title: t('meta.title'),
    meta: [
      { name: 'description', content: t('meta.description') },
      { property: 'og:type', content: 'profile' },
      { property: 'og:site_name', content: siteName },
      { property: 'og:title', content: t('meta.title') },
      { property: 'og:description', content: t('meta.description') },
      { property: 'og:image', content: ogImage.value },
      { property: 'og:locale', content: OG_LOCALE[currentLocale.value] },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    link: [
      // 当前语言的字族样式表：按路由注入，避免把 6 套 CJK 字族全打进主包
      { rel: 'stylesheet', href: FONT_STYLESHEET[currentLocale.value] },
      { rel: 'canonical', href: `${origin}/${currentLocale.value}/` },
      ...SUPPORTED_LOCALES.map((item) => ({
        rel: 'alternate',
        hreflang: HREFLANG[item],
        href: `${origin}/${item}/`,
      })),
      { rel: 'alternate', hreflang: 'x-default', href: `${origin}/${DEFAULT_LOCALE}/` },
    ],
  }
})
</script>

<template>
  <a class="skip-link md-label-large" href="#main">{{ t('common.skipToContent') }}</a>

  <AppBar
    :scrolled="scrolled"
    :locale="currentLocale"
    @update:locale="switchLocale"
    @select-hero="goToId('hero')"
  />

  <NavigationRail :active-index="activeIndex" @select="goTo" />

  <div
    ref="scroller"
    class="snap-scroller"
    :data-hijack="hijacking ? 'on' : 'off'"
    tabindex="-1"
  >
    <RouterView />
  </div>

  <SnackbarHost />
</template>

<style scoped>
.skip-link {
  position: fixed;
  top: 8px;
  left: 50%;
  translate: -50% -200%;
  z-index: 2000;
  padding: 10px 20px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-inverse-surface);
  color: var(--md-sys-color-inverse-on-surface);
  transition: translate var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized);
}

.skip-link:focus-visible {
  translate: -50% 0;
}
</style>
