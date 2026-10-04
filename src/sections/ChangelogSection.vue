<script setup lang="ts">
/**
 * 更新履歴。
 * 条目数据放在 i18n 里（是散文），版本号与日期留在组件内以便后续替换为数据驱动。
 */
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import BrandIcon from '@/components/BrandIcon.vue'
import M3Icon from '@/components/M3Icon.vue'
import type { BrandIconName } from '@/components/brandIcons'
import { changelogLinks, type ChangelogLink } from '@/data/changelog'
import { sections } from '@/data/sections'

defineProps<{ active: boolean }>()

interface ChangelogEntry {
  version: string
  date: string | null
  notes: string[]
}

const { t, tm } = useI18n()

const entries = () => tm('changelog.entries') as unknown as ChangelogEntry[]

/** 平台 → 品牌图标 */
const platformIcons: Record<ChangelogLink['platform'], BrandIconName> = {
  Bilibili: 'bilibili',
  X: 'x',
}

const linksFor = (version: string) => changelogLinks[version] ?? []
</script>

<template>
  <SectionShell id="changelog" :active="active">
    <SectionHeader
      :index="7"
      :total="sections.length"
      section-id="changelog"
      :lead="t('changelog.lead')"
    />

    <ol class="timeline">
      <li v-for="entry in entries()" :key="entry.version" class="timeline-item" data-reveal>
        <span class="timeline-marker" aria-hidden="true" />
        <div class="timeline-card">
          <header class="timeline-head">
            <h3 class="timeline-version md-title-large">v{{ entry.version }}</h3>
            <span class="timeline-date md-label-medium">
              {{ entry.date ?? t('changelog.datePending') }}
            </span>
          </header>
          <ul class="timeline-notes">
            <li v-for="(note, i) in entry.notes" :key="i" class="md-body-medium">{{ note }}</li>
          </ul>

          <ul v-if="linksFor(entry.version).length" class="timeline-links">
            <li v-for="link in linksFor(entry.version)" :key="link.platform">
              <a
                v-ripple
                class="changelog-link md-state-layer md-label-medium"
                :href="link.url"
                target="_blank"
                rel="noopener noreferrer"
                :title="link.platform"
                :aria-label="link.platform"
              >
                <BrandIcon :name="platformIcons[link.platform]" :size="16" />
                <span>{{ link.platform }}</span>
                <M3Icon name="open_in_new" :size="14" />
              </a>
            </li>
          </ul>
        </div>
      </li>
    </ol>
  </SectionShell>
</template>

<style scoped>
.timeline {
  list-style: none;
  margin: 0;
  padding: 0 0 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  /* 内容比一屏矮时铺满剩余高度（条目内部再拉伸卡片） */
  flex: 1 1 auto;
}

/* 时间线竖轴 */
.timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background-color: var(--md-sys-color-outline-variant);
}

.timeline-item {
  position: relative;
  /* 内容比一屏矮时，条目各自拉伸，卡片背景铺满，不留空白 */
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

.timeline-marker {
  position: absolute;
  left: -20px;
  top: 8px;
  width: 11px;
  height: 11px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 4px var(--md-sys-color-surface);
}

.timeline-card {
  padding: 16px 20px;
  border-radius: var(--md-sys-shape-corner-medium);
  background-color: var(--md-sys-color-surface-container);
  /* 跟着拉伸的条目一起铺满 */
  flex: 1 1 auto;
}

.timeline-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.timeline-version {
  margin: 0;
  color: var(--md-sys-color-primary);
  font-variant-numeric: tabular-nums;
}

.timeline-date {
  color: var(--md-sys-color-on-surface-variant);
}

.timeline-notes {
  margin: 0;
  padding-left: 1.1em;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--md-sys-color-on-surface-variant);
}

/* 配布链接：与笔记同一卡片内，胶囊样式与制作名单的社交链接一致 */
.timeline-links {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.changelog-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-primary);
  transition:
    background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard),
    color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}
</style>
