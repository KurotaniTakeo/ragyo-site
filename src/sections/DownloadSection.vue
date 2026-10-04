<script setup lang="ts">
/**
 * 下载区。
 *
 * 本站不自建文件托管，只提供 Google Drive / 百度網盤 / 夸克網盤 三个渠道，
 * 因此没有校验值、断点续传等信息，改为版本号 + 打包日期。
 * 链接未提供前，DownloadCard 会渲染为「准备中」而不是死链。
 */
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  watch,
  type ComponentPublicInstance,
} from 'vue'
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import M3Card from '@/components/M3Card.vue'
import M3Icon from '@/components/M3Icon.vue'
import DownloadCard from '@/components/DownloadCard.vue'
import {
  allMirrorsPending,
  downloadMeta,
  illustrationMirrors,
  mirrors,
  orderMirrors,
} from '@/data/downloads'
import { authorCreditKey } from '@/data/credits'
import { sections } from '@/data/sections'
import { useScrollContext } from '@/composables/useScrollContext'

defineProps<{ active: boolean }>()

const { t, tm, locale } = useI18n()
const { goToId, requestHighlight, highlightRequest } = useScrollContext()

/* ------------------------------------------------------------ 高亮 */

/** 从角色页「下载立绘」跳来时，短暂强调立绘下载卡片；时长与 CSS 动画总时长一致 */
const HIGHLIGHT_DURATION = 1800

const illustrationHighlighted = ref(false)
const illustrationCard = ref<ComponentPublicInstance | null>(null)
let highlightTimer = 0

watch(
  () => highlightRequest.value,
  (request) => {
    if (!request || request.section !== 'download' || request.target !== 'illustration') return
    illustrationHighlighted.value = true
    window.clearTimeout(highlightTimer)
    highlightTimer = window.setTimeout(() => {
      illustrationHighlighted.value = false
    }, HIGHLIGHT_DURATION)

    // 立绘卡片常位于分屏下方：只滚动分屏内部面板把它带进视野，
    // 不去动外层 .snap-scroller 的整屏吸附，避免两套滚动打架。
    nextTick(() => {
      const el = illustrationCard.value?.$el as HTMLElement | undefined
      const panel = el?.closest<HTMLElement>('[data-scrollable]')
      if (!el || !panel) return
      const panelRect = panel.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      panel.scrollTo({
        top: panel.scrollTop + (elRect.top - panelRect.top) - 16,
        behavior: 'smooth',
      })
    })
  },
)

onBeforeUnmount(() => window.clearTimeout(highlightTimer))

/** 按当前语言重排渠道：中文下 Google Drive 沉底 */
const orderedMirrors = computed(() => orderMirrors(mirrors, locale.value))
const orderedIllustrationMirrors = computed(() => orderMirrors(illustrationMirrors, locale.value))

/** 跳到制作名单并短暂高亮原作者 */
const onContactAuthor = () => {
  goToId('credits')
  requestHighlight('credits', authorCreditKey)
}

const installKeys = ['download.installSteps', 'download.installStepsUtau'] as const
const installTitles = ['download.installTitle', 'download.installTitleUtau'] as const
const installIcons = ['verified', 'download'] as const

const steps = (key: string) => tm(key) as unknown as string[]
</script>

<template>
  <SectionShell id="download" :active="active">
    <SectionHeader
      :index="6"
      :total="sections.length"
      section-id="download"
      :lead="t('download.lead')"
    />

    <div class="download-grid">
      <div class="download-main">
        <div class="meta-row" data-reveal>
          <span class="meta-item">
            <span class="meta-label md-label-small">{{ t('download.metaVersion') }}</span>
            <span class="meta-value md-title-small">{{ downloadMeta.version }}</span>
          </span>
          <span class="meta-item">
            <span class="meta-label md-label-small">{{ t('download.metaPackagedAt') }}</span>
            <span class="meta-value md-title-small">
              {{ downloadMeta.packagedAt ?? t('common.pending') }}
            </span>
          </span>
          <span class="meta-item">
            <span class="meta-label md-label-small">{{ t('download.metaSize') }}</span>
            <span class="meta-value md-title-small">
              {{ downloadMeta.size ?? t('common.pending') }}
            </span>
          </span>
        </div>

        <h3 class="group-title md-title-medium" data-reveal>
          {{ t('download.groups.voicebank') }}
        </h3>

        <p class="group-note md-body-small" data-reveal>
          {{ t('download.voicebankNote') }}
        </p>

        <DownloadCard
          :mirrors="orderedMirrors"
          :is-chinese="locale === 'zh'"
          data-reveal
          style="--reveal-delay: 60ms"
        />

        <p v-if="allMirrorsPending" class="pending-note md-body-small" data-reveal>
          {{ t('download.pendingBody') }}
        </p>
        <p v-else class="pending-note md-body-small" data-reveal>
          <i18n-t keypath="download.feedback" scope="global">
            <template #author>
              <a class="feedback-link" href="#credits" @click.prevent="onContactAuthor">
                {{ t('download.feedbackAuthor') }}
              </a>
            </template>
          </i18n-t>
        </p>

        <h3 class="group-title md-title-medium" data-reveal style="--reveal-delay: 90ms">
          {{ t('download.groups.illustration') }}
        </h3>

        <DownloadCard
          ref="illustrationCard"
          class="illustration-card"
          :class="{ 'is-highlighted': illustrationHighlighted }"
          :mirrors="orderedIllustrationMirrors"
          :is-chinese="locale === 'zh'"
          data-reveal
          style="--reveal-delay: 120ms"
        />
      </div>

      <div class="install-column" data-reveal style="--reveal-delay: 120ms">
        <M3Card
          v-for="(key, index) in installKeys"
          :key="key"
          class="install-card"
          padding="md"
          tone="low"
        >
          <h3 class="install-title md-title-medium">
            <M3Icon :name="installIcons[index]" :size="18" />
            {{ t(installTitles[index]) }}
          </h3>
          <ol class="install-steps">
            <li v-for="(step, i) in steps(key)" :key="i" class="md-body-medium">
              <span class="step-index md-label-small" aria-hidden="true">{{ i + 1 }}</span>
              <span>{{ step }}</span>
            </li>
          </ol>
        </M3Card>
      </div>
    </div>
  </SectionShell>
</template>

<style scoped>
.download-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: clamp(14px, 2vw, 24px);
  align-items: start;
}

.download-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: clamp(16px, 3vw, 36px);
  flex-wrap: wrap;
  padding: 4px 4px 12px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  color: var(--md-sys-color-on-surface-variant);
  letter-spacing: 0.06em;
}

.meta-value {
  color: var(--md-sys-color-on-surface);
  font-variant-numeric: tabular-nums;
}

.group-title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

/* 声库分组的小字说明：紧贴标题下方，与卡片之间仍保留原有间距 */
.group-note {
  margin: -8px 0 0;
  color: var(--md-sys-color-on-surface-variant);
}

.pending-note {
  margin: 0;
  color: var(--md-sys-color-outline);
}

/* 「下载立绘」跳转后的强调：主题色加粗边框脉冲两下（与制作名单的高亮一致） */
.illustration-card.is-highlighted {
  animation: illustration-highlight 900ms var(--md-sys-motion-easing-emphasized) 2;
}

@keyframes illustration-highlight {
  0%,
  100% {
    box-shadow: 0 0 0 0 transparent;
  }

  50% {
    box-shadow: 0 0 0 3px var(--md-sys-color-primary);
  }
}

@media (prefers-reduced-motion: reduce) {
  .illustration-card.is-highlighted {
    animation: none;
    box-shadow: 0 0 0 3px var(--md-sys-color-primary);
  }
}

/* 「联系作者」：跳转到制作名单的正文内链接 */
.feedback-link {
  color: var(--md-sys-color-primary);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  border-radius: 2px;
  transition: color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

@media (hover: hover) {
  .feedback-link:hover {
    color: var(--md-sys-color-on-surface);
  }
}

.feedback-link:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
  text-decoration: none;
}

.install-column {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.install-title {
  margin: 0 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--md-sys-color-on-surface);
}

.install-title :deep(svg) {
  color: var(--md-sys-color-primary);
}

.install-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.install-steps li {
  display: flex;
  gap: 10px;
  align-items: baseline;
  color: var(--md-sys-color-on-surface-variant);
}

.step-index {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-primary);
  font-weight: 700;
  translate: 0 2px;
}

@media (max-width: 860px), (pointer: coarse) and (orientation: portrait) {
  .download-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* 矮屏压缩 */
@media (max-height: 860px) {
  .download-main,
  .install-column {
    gap: 10px;
  }

  .meta-row {
    padding-bottom: 8px;
  }

  .install-steps {
    gap: 8px;
  }
}
</style>
