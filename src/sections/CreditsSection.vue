<script setup lang="ts">
/**
 * 制作名单与联系方式。
 *
 * 角色名与社交账号是专有名词，放在数据层不参与翻译；
 * 只有「担当什么」的描述走 i18n。
 * 没有确切网址的账号只显示 handle 纯文本，不渲染成假链接。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import M3Card from '@/components/M3Card.vue'
import M3Icon from '@/components/M3Icon.vue'
import M3Button from '@/components/M3Button.vue'
import BrandIcon from '@/components/BrandIcon.vue'
import type { BrandIconName } from '@/components/brandIcons'
import {
  credits,
  officialLinkHubs,
  orderLinkHubs,
  orderSocialLinks,
  authorCreditKey,
  type SocialLink,
} from '@/data/credits'
import { voicebank } from '@/data/voicebank'
import { sections } from '@/data/sections'
import { useScrollContext } from '@/composables/useScrollContext'
import type { Locale } from '@/i18n'

defineProps<{ active: boolean }>()

const { t, te, locale } = useI18n()
const { highlightRequest } = useScrollContext()

/** 社交链接与官方合集按当前语言重排（简中大陆优先，其余语言海外优先） */
const orderedCredits = computed(() =>
  credits.map((credit) => ({ ...credit, links: orderSocialLinks(credit.links, locale.value) })),
)
const orderedLinkHubs = computed(() => orderLinkHubs(officialLinkHubs, locale.value))

/** 平台 → 品牌图标 */
const platformIcons: Record<SocialLink['platform'], BrandIconName> = {
  X: 'x',
  Bilibili: 'bilibili',
  GitHub: 'github',
  YouTube: 'youtube',
  Facebook: 'facebook',
}

const platformIcon = (platform: SocialLink['platform']): BrandIconName => platformIcons[platform]

/* ------------------------------------------------------------ 高亮 */

/** 高亮持续时长，与 CSS 脉冲动画总时长一致 */
const HIGHLIGHT_DURATION = 1800

const highlightedKey = ref<string | null>(null)
let highlightTimer = 0

watch(
  () => highlightRequest.value,
  (request) => {
    if (!request || request.section !== 'credits') return
    highlightedKey.value = request.target
    window.clearTimeout(highlightTimer)
    highlightTimer = window.setTimeout(() => {
      highlightedKey.value = null
    }, HIGHLIGHT_DURATION)
  },
)

onBeforeUnmount(() => window.clearTimeout(highlightTimer))
</script>

<template>
  <SectionShell id="credits" :active="active">
    <SectionHeader
      :index="8"
      :total="sections.length"
      section-id="credits"
      :lead="t('credits.lead')"
    />

    <ul class="credit-list">
      <li
        v-for="(credit, index) in orderedCredits"
        :key="credit.key"
        :class="{ 'is-highlighted': highlightedKey === credit.key }"
      >
        <M3Card
          class="credit-card"
          :class="{ 'is-official': credit.key === authorCreditKey }"
          padding="md"
          :tone="index === 0 ? 'high' : 'base'"
          data-reveal
          :style="`--reveal-delay: ${index * 60}ms`"
        >
          <div class="credit-head">
            <img
              v-if="credit.avatar"
              class="credit-avatar credit-avatar-img"
              :src="credit.avatar"
              alt=""
              width="44"
              height="44"
              loading="lazy"
              decoding="async"
            />
            <span v-else class="credit-avatar md-title-large" aria-hidden="true">
              {{ credit.name[locale as Locale].slice(0, 1) }}
            </span>
            <div class="credit-id">
              <span class="credit-name md-title-medium">{{ credit.name[locale as Locale] }}</span>
              <span class="credit-role md-body-small">{{ t(`credits.roles.${credit.key}`) }}</span>
            </div>
          </div>

          <ul class="credit-links">
            <li v-for="link in credit.links" :key="link.platform">
              <a
                v-if="link.url"
                v-ripple
                class="credit-link md-state-layer md-label-medium"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                :title="link.platform"
                :aria-label="`${link.platform} ${link.handle}`"
              >
                <BrandIcon :name="platformIcon(link.platform)" :size="16" />
                <span class="link-handle">{{ link.handle }}</span>
                <M3Icon name="open_in_new" :size="14" />
              </a>
              <span v-else class="credit-link is-static md-label-medium" :title="link.platform">
                <BrandIcon :name="platformIcon(link.platform)" :size="16" />
                <span class="link-handle">{{ link.handle }}</span>
              </span>
            </li>
          </ul>

          <p
            v-if="te(`credits.notes.${credit.key}`)"
            class="credit-note md-body-small"
          >
            {{ t(`credits.notes.${credit.key}`) }}
          </p>
        </M3Card>
      </li>
    </ul>

    <div class="credits-footer" data-reveal style="--reveal-delay: 200ms">
      <p class="copyright md-body-small">
        {{ t('credits.copyrightNote') }}
      </p>
      <div class="credits-links-group">
        <p id="credits-links-title" class="credits-links-title md-label-large">
          {{ t('credits.linkHubsTitle') }}
        </p>
        <ul class="credits-links" aria-labelledby="credits-links-title">
          <li v-for="hub in orderedLinkHubs" :key="hub.region" class="credits-link-item">
            <M3Button
              variant="outlined"
              icon="open_in_new"
              :href="hub.url"
              external
            >
              {{ hub.platform }}
            </M3Button>
            <span class="credits-link-region md-body-small">
              {{ t(`credits.linkHubs.${hub.region}`) }}
            </span>
          </li>
        </ul>
      </div>
      <p class="footer-rights md-body-small">
        {{ t('footer.rights') }}
        <span class="footer-sep" aria-hidden="true">·</span>
        {{ voicebank.libraryName }}
      </p>
    </div>
  </SectionShell>
</template>

<style scoped>
.credit-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.credit-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
}

/* 作者卡与试听区的官方配布稿同样用主色描边，强调其官方身份 */
.credit-card.is-official {
  border: 2px solid var(--md-sys-color-primary);
}

/* 「联系作者」跳转后的短暂强调：主题色描边脉冲两下 */
.credit-list li.is-highlighted .credit-card {
  animation: credit-highlight 900ms var(--md-sys-motion-easing-emphasized) 2;
}

@keyframes credit-highlight {
  0%,
  100% {
    box-shadow: 0 0 0 0 transparent;
  }

  50% {
    box-shadow: 0 0 0 3px var(--md-sys-color-primary);
  }
}

@media (prefers-reduced-motion: reduce) {
  .credit-list li.is-highlighted .credit-card {
    animation: none;
    box-shadow: 0 0 0 2px var(--md-sys-color-primary);
  }
}

.credit-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

/* 无头像时回退为姓氏首字 + 容器色色块 */
.credit-avatar {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

/* 自托管头像：与视频封面一样直接引用本地文件 */
.credit-avatar-img {
  object-fit: cover;
}

.credit-id {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.credit-name {
  color: var(--md-sys-color-on-surface);
}

.credit-role {
  color: var(--md-sys-color-on-surface-variant);
}

/* 补充说明（如前端代码的协作来源），比角色描述更弱 */
.credit-note {
  margin: 0;
  color: var(--md-sys-color-outline);
}

.credit-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 卡片内的胶囊按钮：品牌图标 + handle */
.credit-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 5px 12px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface-variant);
  transition:
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.credit-link:not(.is-static) {
  color: var(--md-sys-color-primary);
}

.credit-link.is-static {
  cursor: default;
}

.link-handle {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.credits-footer {
  margin-top: clamp(16px, 2.6vh, 28px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

/* 官方链接合集：标题在上，每个平台按钮下方标注适用地区 */
.credits-links-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.credits-links-title {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.credits-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.credits-link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.credits-link-region {
  margin: 0;
  color: var(--md-sys-color-outline);
}

.copyright,
.footer-rights {
  margin: 0;
  color: var(--md-sys-color-outline);
}

.footer-sep {
  margin: 0 6px;
}

/* 矮屏压缩 */
@media (max-height: 860px) {
  .credit-list {
    gap: 10px;
  }

  .credit-card {
    gap: 10px;
  }

  .credits-footer {
    margin-top: 12px;
    gap: 8px;
  }

  .credits-links-group {
    gap: 6px;
  }

  .credits-link-item {
    gap: 4px;
  }

  .credits-links {
    gap: 8px;
  }
}
</style>
