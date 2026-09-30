<script setup lang="ts">
/**
 * 利用規約。
 *
 * 規約正文在三语下都相当长，通常超过一屏。SectionShell 的面板支持内部滚动，
 * 全屏翻页逻辑会先让面板滚到底，之后才翻到下一屏（见 useFullPageScroll）。
 */
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import M3Card from '@/components/M3Card.vue'
import { sections } from '@/data/sections'

defineProps<{ active: boolean }>()

interface TermsBlock {
  heading: string
  numbered?: boolean
  items: string[]
}

const { t, tm } = useI18n()

const blocks = () => tm('terms.blocks') as unknown as TermsBlock[]
const contact = () => tm('terms.contact') as string[]
const copyright = () => tm('terms.copyright') as string[]
</script>

<template>
  <SectionShell id="terms" :active="active">
    <SectionHeader
      :index="5"
      :total="sections.length"
      section-id="terms"
      :lead="t('terms.lead')"
    />

    <div class="terms-body">
      <div class="terms-columns">
        <section v-for="(block, index) in blocks()" :key="index" class="terms-block">
          <h3 class="block-heading md-title-medium">{{ block.heading }}</h3>
          <ol v-if="block.numbered" class="block-items is-numbered">
            <li v-for="(item, i) in block.items" :key="i" class="md-body-medium">
              {{ item }}
            </li>
          </ol>
          <p v-else-if="block.items.length" class="block-items md-body-medium">
            {{ block.items[0] }}
          </p>
        </section>

        <section class="terms-block">
          <h3 class="block-heading md-title-medium">{{ t('terms.contactTitle') }}</h3>
          <ul class="block-items is-plain">
            <li v-for="(item, i) in contact()" :key="i" class="md-body-medium">{{ item }}</li>
          </ul>
        </section>

        <M3Card class="copyright-card" padding="md">
          <h3 class="block-heading md-title-medium">{{ t('terms.copyrightTitle') }}</h3>
          <ul class="block-items is-plain">
            <li v-for="(item, i) in copyright()" :key="i" class="md-body-small">{{ item }}</li>
          </ul>
          <p class="source md-body-small">{{ t('terms.sourceNote') }}</p>
        </M3Card>
      </div>
    </div>
  </SectionShell>
</template>

<style scoped>
.terms-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 桌面端排成两栏，把长文从「一条细长的柱」变成更好读的版面 */
.terms-columns {
  column-count: 2;
  column-gap: clamp(24px, 4vw, 56px);
  column-rule: 1px solid var(--md-sys-color-outline-variant);
}

.terms-block {
  break-inside: avoid;
  margin-bottom: 20px;
}

.block-heading {
  margin: 0 0 8px;
  color: var(--md-sys-color-primary);
}

.block-items {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--md-sys-color-on-surface-variant);
}

.block-items.is-numbered {
  counter-reset: terms;
}

.block-items.is-numbered li {
  counter-increment: terms;
  display: flex;
  gap: 10px;
}

.block-items.is-numbered li::before {
  content: counter(terms) '.';
  flex: none;
  min-width: 1.4em;
  color: var(--md-sys-color-tertiary);
  font-variant-numeric: tabular-nums;
}

.block-items.is-plain li {
  display: block;
}

.copyright-card {
  break-inside: avoid;
  margin-bottom: 20px;
}

.source {
  margin: 12px 0 0;
  color: var(--md-sys-color-outline);
}

@media (max-width: 980px) {
  .terms-columns {
    column-count: 1;
    column-rule: none;
  }
}
</style>
