<script setup lang="ts">
/**
 * 声库介绍。
 *
 * 重点是把 character.yaml 里的 subbanks 结构翻译成一眼能看懂的形态：
 *   1. 关键规格一览
 *   2. 音域条 —— 三个音阶在 C1–B7 上的实际占位与重叠
 *   3. 每个音阶的通常音色 / Soft 音色文件后缀
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import M3Card from '@/components/M3Card.vue'
import { fullRange, pitchRanges, voicebank } from '@/data/voicebank'
import { sections } from '@/data/sections'

defineProps<{ active: boolean }>()

const { t } = useI18n()

const total = sections.length
const span = fullRange.high - fullRange.low + 1

/** 各音阶在总音域上的相对宽度，用 flex 分配，间隙自动吸收 */
const bars = computed(() =>
  pitchRanges.map((range) => ({
    ...range,
    flex: range.high - range.low + 1,
    share: Math.round(((range.high - range.low + 1) / span) * 100),
  })),
)

const specs = computed(() => [
  { key: 'type', label: t('about.labels.type'), value: t('about.values.type') },
  { key: 'pitches', label: t('about.labels.pitches'), value: t('about.values.pitches') },
  { key: 'tones', label: t('about.labels.tones'), value: t('about.values.tones') },
  { key: 'range', label: t('about.labels.range'), value: voicebank.toneRange },
  { key: 'engines', label: t('about.labels.engines'), value: t('about.values.engines') },
  { key: 'encoding', label: t('about.labels.encoding'), value: voicebank.textEncoding },
])
</script>

<template>
  <SectionShell id="about" :active="active">
    <SectionHeader
      :index="2"
      :total="total"
      section-id="about"
      :lead="t('about.lead')"
    />

    <div class="about-grid">
      <M3Card class="spec-card" padding="md" data-reveal>
        <dl class="spec-list">
          <div v-for="spec in specs" :key="spec.key" class="spec-row">
            <dt class="md-label-medium">{{ spec.label }}</dt>
            <dd class="md-title-small">{{ spec.value }}</dd>
          </div>
        </dl>
      </M3Card>

      <M3Card class="range-card" padding="md" data-reveal style="--reveal-delay: 80ms">
        <h3 class="card-title md-title-medium">{{ t('about.subbanksTitle') }}</h3>
        <p class="card-lead md-body-small">{{ t('about.subbanksLead') }}</p>

        <div class="range-bar" role="img" :aria-label="`${fullRange.low} – ${fullRange.high}`">
          <div
            v-for="bar in bars"
            :key="bar.id"
            class="range-segment"
            :style="{ flex: bar.flex }"
          >
            <span class="range-label md-label-small">{{ bar.id }}</span>
          </div>
        </div>

        <ul class="subbank-list">
          <li v-for="bar in bars" :key="bar.id" class="subbank-row">
            <span class="subbank-tone md-title-small">{{ bar.toneRange }}</span>
            <span class="subbank-files md-label-small">
              <span class="subbank-tag">{{ t('about.toneDefault') }}&nbsp;{{ bar.normal }}</span>
              <span class="subbank-tag is-soft">{{ t('about.toneSoft') }}&nbsp;{{ bar.soft }}</span>
            </span>
          </li>
        </ul>
      </M3Card>
    </div>

    <div class="about-notes" data-reveal style="--reveal-delay: 160ms">
      <p class="note md-body-medium">
        <strong>{{ t('about.enginesTitle') }}</strong>
        {{ t('about.enginesNote') }}
      </p>
      <p class="source md-body-small">{{ t('about.sourceNote') }}</p>
    </div>
  </SectionShell>
</template>

<style scoped>
.about-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: clamp(14px, 2vw, 24px);
  align-items: start;
}

.spec-list {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.spec-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
}

.spec-row + .spec-row {
  box-shadow: inset 0 1px 0 var(--md-sys-color-outline-variant);
}

.spec-row dt {
  color: var(--md-sys-color-on-surface-variant);
  flex: none;
}

.spec-row dd {
  margin: 0;
  text-align: right;
  color: var(--md-sys-color-on-surface);
}

.card-title {
  margin: 0 0 6px;
  color: var(--md-sys-color-on-surface);
}

.card-lead {
  margin: 0 0 18px;
  color: var(--md-sys-color-on-surface-variant);
}

/* 音域条：宽度按半音数分配，因此 F4 档明显最长，与真实音域一致 */
.range-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 18px;
}

.range-segment {
  position: relative;
  height: 34px;
  border-radius: var(--md-sys-shape-corner-small);
  background-color: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  transition: background-color var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard);
}

.range-segment:nth-child(2) {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.range-segment:nth-child(3) {
  background-color: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}

/* Material 连接件规范：相邻两侧的内角收小，外角保持 */
.range-segment:not(:first-child) {
  border-start-start-radius: var(--md-sys-shape-corner-extra-small);
  border-end-start-radius: var(--md-sys-shape-corner-extra-small);
}

.range-segment:not(:last-child) {
  border-start-end-radius: var(--md-sys-shape-corner-extra-small);
  border-end-end-radius: var(--md-sys-shape-corner-extra-small);
}

.range-label {
  font-weight: 700;
  letter-spacing: 0.06em;
}

.subbank-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.subbank-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 0;
}

.subbank-row + .subbank-row {
  box-shadow: inset 0 1px 0 var(--md-sys-color-outline-variant);
}

.subbank-tone {
  color: var(--md-sys-color-on-surface);
  font-variant-numeric: tabular-nums;
}

.subbank-files {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}

.subbank-tag {
  padding: 3px 9px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface-variant);
  /* 药丸含「普通 / 一般」等汉字，等宽体不一定覆盖 CJK，直接沿用正文无衬线体，
     避免简体/英文下回退到宋体、Courier 等衬线字体 */
  font-family: var(--app-font-sans);
  letter-spacing: 0.04em;
}

.subbank-tag.is-soft {
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-primary) 22%,
    var(--md-sys-color-surface-container-highest)
  );
  color: var(--md-sys-color-primary);
}

.about-notes {
  margin-top: clamp(16px, 2.4vh, 26px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  max-width: 92ch;
}

.note strong {
  color: var(--md-sys-color-on-surface);
  font-weight: 600;
  margin-right: 6px;
}

.source {
  margin: 0;
  color: var(--md-sys-color-outline);
}

@media (max-width: 980px) {
  .about-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* 矮屏压缩 */
@media (max-height: 860px) {
  .spec-row {
    padding: 8px 0;
  }

  .card-lead {
    margin-bottom: 12px;
  }

  .range-bar {
    height: 30px;
    margin-bottom: 12px;
  }

  .subbank-row {
    padding: 6px 0;
  }

  .about-notes {
    margin-top: 12px;
  }
}
</style>
