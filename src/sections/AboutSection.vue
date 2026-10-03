<script setup lang="ts">
/**
 * 声库介绍。
 *
 * 重点是把 character.yaml 里的 subbanks 结构翻译成一眼能看懂的形态：
 *   1. 关键规格一览
 *   2. 音域条 —— 三个音阶在 C2–B4 上的实际占位与重叠，
 *      悬停时光标指向哪就显示哪个音高（见 usePitchHover）
 *   3. 每个音阶的通常 / Soft / Power 音色文件后缀
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import M3Card from '@/components/M3Card.vue'
import SpecPill from '@/components/SpecPill.vue'
import { usePitchHover } from '@/composables/usePitchHover'
import { fullRange, pitchRanges, tones, voicebank } from '@/data/voicebank'
import { sections } from '@/data/sections'

defineProps<{ active: boolean }>()

const { t } = useI18n()

const total = sections.length
const span = fullRange.high - fullRange.low + 1

/** 音域条悬停：跟手显示音名，参考线做缓动 */
const rangeBar = ref<HTMLElement | null>(null)
const {
  active: hoverActive,
  x: hoverX,
  note: hoverNote,
  index: hoverIndex,
  onPointerEnter: onRangeEnter,
  onPointerMove: onRangeMove,
  onPointerLeave: onRangeLeave,
} = usePitchHover(rangeBar, { low: fullRange.low, high: fullRange.high })

/** 各音阶在总音域上的相对宽度，用 flex 分配，间隙自动吸收 */
const bars = computed(() =>
  pitchRanges.map((range) => ({
    ...range,
    flex: range.high - range.low + 1,
    share: Math.round(((range.high - range.low + 1) / span) * 100),
  })),
)

interface SpecRow {
  key: string
  label: string
  /** 纯文本值；与 pills 二选一 */
  value?: string
  /** 有值时渲染成药丸列表，取代 value */
  pills?: { text: string; tone?: 'soft' | 'normal' | 'power' }[]
}

const specs = computed<SpecRow[]>(() => [
  { key: 'type', label: t('about.labels.type'), value: t('about.values.type') },
  // 音高 / 音色不再显示数量，改为列出药丸，与右卡片的信息一致
  {
    key: 'pitches',
    label: t('about.labels.pitches'),
    pills: pitchRanges.map((pitch) => ({ text: pitch.id })),
  },
  {
    key: 'tones',
    label: t('about.labels.tones'),
    pills: tones.map((tone) => ({ text: tone.name, tone: tone.key })),
  },
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
            <dd class="md-title-small">
              <span v-if="spec.pills" class="spec-pills">
                <SpecPill
                  v-for="pill in spec.pills"
                  :key="pill.text"
                  :tone="pill.tone"
                >{{ pill.text }}</SpecPill>
              </span>
              <template v-else>{{ spec.value }}</template>
            </dd>
          </div>
        </dl>
      </M3Card>

      <M3Card class="range-card" padding="md" data-reveal style="--reveal-delay: 80ms">
        <h3 class="card-title md-title-medium">{{ t('about.subbanksTitle') }}</h3>
        <p class="card-lead md-body-small">{{ t('about.subbanksLead') }}</p>

        <div
          ref="rangeBar"
          class="range-bar"
          role="img"
          :aria-label="`${fullRange.low} – ${fullRange.high}`"
          @pointerenter="onRangeEnter"
          @pointermove="onRangeMove"
          @pointerleave="onRangeLeave"
        >
          <div
            v-for="(bar, i) in bars"
            :key="bar.id"
            class="range-segment"
            :class="{ 'is-hovered': hoverActive && hoverIndex === i }"
            :style="{ flex: bar.flex }"
            :data-range-segment="''"
            :data-low="bar.low"
            :data-high="bar.high"
          >
            <span class="range-label md-label-small">{{ bar.id }}</span>
          </div>

          <!-- 跟手浮标：竖线用缓动位置，气泡读数始终对准真实光标；对辅助技术隐藏 -->
          <div
            class="range-line"
            :class="{ 'is-visible': hoverActive }"
            :style="{ transform: `translateX(${hoverX}px)` }"
            aria-hidden="true"
          />
          <div
            class="range-note md-label-small"
            :class="{ 'is-visible': hoverActive }"
            :style="{ left: `clamp(22px, ${hoverX}px, calc(100% - 22px))` }"
            aria-hidden="true"
          >{{ hoverNote }}</div>
        </div>

        <div class="subbank-table" role="table" :aria-label="t('about.subbanksTitle')">
          <div class="subbank-head" role="row">
            <span class="subbank-th" role="columnheader">{{ t('about.labels.pitches') }}</span>
            <span
              v-for="tone in tones"
              :key="tone.key"
              class="subbank-th is-tone"
              role="columnheader"
            >{{ tone.name }}</span>
          </div>
          <div v-for="bar in bars" :key="bar.id" class="subbank-tr" role="row">
            <span class="subbank-pitch" role="rowheader">
              <span class="subbank-pitch-id">{{ bar.id }}</span>
              <span class="subbank-pitch-range">{{ bar.toneRange }}</span>
            </span>
            <span
              v-for="tone in tones"
              :key="tone.key"
              class="subbank-td"
              role="cell"
            >{{ bar[tone.key] }}</span>
          </div>
        </div>
      </M3Card>
    </div>

    <div class="about-notes" data-reveal style="--reveal-delay: 160ms">
      <p class="note md-body-medium">{{ t('about.enginesNote') }}</p>
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

/* 音高 / 音色药丸：作为 dd 的内联内容右对齐，换行时末行也贴右 */
.spec-pills {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
  vertical-align: middle;
}

.card-title {
  margin: 0 0 6px;
  color: var(--md-sys-color-on-surface);
}

.card-lead {
  margin: 0 0 18px;
  color: var(--md-sys-color-on-surface-variant);
}

/* 音域条：宽度按半音数分配，B2 档覆盖范围最广，与各档真实音域一致 */
.range-bar {
  position: relative;
  display: flex;
  gap: 4px;
  margin-bottom: 18px;
  cursor: crosshair;
}

/* 音域条：三段统一为品牌紫的明度阶（越高音越亮）。
   原先用 primary/secondary/tertiary 容器色，在紫底上会串出暖棕与赤红，故弃用。 */
.range-segment {
  position: relative;
  height: 34px;
  border-radius: var(--md-sys-shape-corner-small);
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-surface-bright) 32%,
    var(--md-sys-color-surface-container)
  );
  color: var(--md-sys-color-on-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  transition:
    background-color var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-standard),
    box-shadow var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.range-segment:nth-child(2) {
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-surface-bright) 58%,
    var(--md-sys-color-surface-container)
  );
}

.range-segment:nth-child(3) {
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-surface-bright) 84%,
    var(--md-sys-color-surface-container)
  );
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

/* 指针所在音阶：叠一道描边，不改底色以保留三段本身的明度递进 */
.range-segment.is-hovered {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--md-sys-color-primary) 72%, transparent);
}

/* 悬停浮标：竖线对位到光标 x（由 JS 缓动），顶部气泡显示音名 */
.range-line,
.range-note {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.range-line.is-visible,
.range-note.is-visible {
  opacity: 1;
}

.range-line {
  top: 0;
  left: 0;
  width: 2px;
  height: 34px;
  margin-left: -1px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--md-sys-color-surface-container) 55%, transparent);
  will-change: transform;
}

.range-note {
  bottom: calc(100% + 2px);
  transform: translateX(-50%);
  padding: 2px 8px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-inverse-surface);
  color: var(--md-sys-color-inverse-on-surface);
  font-weight: 700;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 录入音高与音色：去药丸后改为对齐网格，行 = 音高，列 = 音色 */
.subbank-table {
  display: flex;
  flex-direction: column;
}

.subbank-head,
.subbank-tr {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr));
  align-items: center;
  gap: 8px;
}

.subbank-head {
  padding-bottom: 6px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.subbank-th {
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-label-small-size);
  line-height: var(--md-sys-typescale-label-small-line);
  font-weight: 500;
  letter-spacing: 0.04em;
}

.subbank-th.is-tone,
.subbank-td {
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.subbank-tr {
  padding: 9px 0;
}

.subbank-tr + .subbank-tr {
  box-shadow: inset 0 1px 0 var(--md-sys-color-outline-variant);
}

.subbank-pitch {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  color: var(--md-sys-color-on-surface);
}

.subbank-pitch-id {
  font-size: var(--md-sys-typescale-title-small-size);
  line-height: var(--md-sys-typescale-title-small-line);
  font-weight: 500;
  letter-spacing: 0.02em;
}

.subbank-pitch-range {
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.subbank-td {
  color: var(--md-sys-color-on-surface);
  font-family: var(--app-font-sans);
  font-size: var(--md-sys-typescale-title-small-size);
  line-height: var(--md-sys-typescale-title-small-line);
  letter-spacing: 0.04em;
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

  .subbank-tr {
    padding: 6px 0;
  }

  .about-notes {
    margin-top: 12px;
  }
}
</style>
