<script setup lang="ts">
/**
 * 更新履歴。
 * 条目数据放在 i18n 里（是散文），版本号与日期留在组件内以便后续替换为数据驱动。
 */
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import { sections } from '@/data/sections'

defineProps<{ active: boolean }>()

interface ChangelogEntry {
  version: string
  date: string | null
  notes: string[]
}

const { t, tm } = useI18n()

const entries = () => tm('changelog.entries') as unknown as ChangelogEntry[]
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
</style>
