<script setup lang="ts">
/**
 * 制作名单与联系方式。
 *
 * 角色名与社交账号是专有名词，放在数据层不参与翻译；
 * 只有「担当什么」的描述走 i18n。
 * 没有确切网址的账号只显示 handle 纯文本，不渲染成假链接。
 */
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import M3Card from '@/components/M3Card.vue'
import M3Icon from '@/components/M3Icon.vue'
import M3Button from '@/components/M3Button.vue'
import BrandIcon from '@/components/BrandIcon.vue'
import type { BrandIconName } from '@/components/brandIcons'
import { credits, officialLinkHubs, type SocialLink } from '@/data/credits'
import { voicebank } from '@/data/voicebank'
import { sections } from '@/data/sections'
import type { Locale } from '@/i18n'

defineProps<{ active: boolean }>()

const { t, locale } = useI18n()

/** 平台 → 品牌图标 */
const platformIcon = (platform: SocialLink['platform']): BrandIconName =>
  platform === 'X' ? 'x' : 'bilibili'
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
      <li v-for="(credit, index) in credits" :key="credit.key">
        <M3Card
          class="credit-card"
          padding="md"
          :tone="index === 0 ? 'high' : 'base'"
          data-reveal
          :style="`--reveal-delay: ${index * 60}ms`"
        >
          <div class="credit-head">
            <span class="credit-avatar md-title-large" aria-hidden="true">
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
        </M3Card>
      </li>
    </ul>

    <div class="credits-footer" data-reveal style="--reveal-delay: 200ms">
      <p class="copyright md-body-small">
        {{ t('credits.copyrightNote') }}
      </p>
      <div class="credits-links">
        <M3Button
          v-for="hub in officialLinkHubs"
          :key="hub.region"
          variant="outlined"
          icon="open_in_new"
          :href="hub.url"
          external
        >
          {{ t(`credits.linkHubs.${hub.region}`) }}
        </M3Button>
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

.credit-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

/* 头像用姓氏首字 + 容器色，避免额外引入图片 */
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

/* 官方链接合集：大陆 / 海外两个按钮并排，窄屏自动换行 */
.credits-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

  .credits-links {
    gap: 8px;
  }
}
</style>
