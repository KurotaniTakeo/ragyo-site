<script setup lang="ts">
/**
 * 首屏。
 *
 * 立绘是透明底 PNG，因此可以让它直接立在暗色背景上，
 * 不需要卡片或遮罩。左侧文字、右侧人像，窄屏改为上下堆叠。
 */
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import M3Button from '@/components/M3Button.vue'
import ResponsiveImage from '@/components/ResponsiveImage.vue'
import M3Icon from '@/components/M3Icon.vue'
import { HERO_IMAGE } from '@/data/assets'
import { voicebank } from '@/data/voicebank'
import type { Locale } from '@/i18n'

defineProps<{ active: boolean }>()

const emit = defineEmits<{ navigate: [sectionId: string] }>()

const { t, locale } = useI18n()
</script>

<template>
  <SectionShell id="hero" bleed :active="active">
    <div class="hero">
      <div class="hero-text">
        <p class="hero-kicker md-label-large" data-reveal>
          <M3Icon name="graphic_eq" :size="16" />
          {{ t('hero.kicker') }}
        </p>

        <h1 class="hero-name" data-reveal style="--reveal-delay: 60ms">
          <span class="hero-name-main md-display-large">
            {{ voicebank.name[locale as Locale] }}
          </span>
          <span class="hero-name-reading md-title-large">
            {{ voicebank.reading[locale as Locale] }}
          </span>
        </h1>

        <p class="hero-tagline md-headline-small" data-reveal style="--reveal-delay: 120ms">
          {{ t('hero.tagline') }}
        </p>

        <p class="hero-facts md-body-medium" data-reveal style="--reveal-delay: 180ms">
          {{ t('hero.facts') }}
        </p>

        <div class="hero-actions" data-reveal style="--reveal-delay: 240ms">
          <M3Button icon="download" @click="emit('navigate', 'download')">
            {{ t('hero.ctaPrimary') }}
          </M3Button>
          <M3Button variant="tonal" icon="graphic_eq" @click="emit('navigate', 'samples')">
            {{ t('hero.ctaSecondary') }}
          </M3Button>
        </div>

        <p class="hero-version md-label-medium" data-reveal style="--reveal-delay: 300ms">
          {{ t('hero.version', { version: voicebank.version }) }}
          <span class="hero-version-sep" aria-hidden="true">·</span>
          {{ voicebank.libraryName }}
        </p>
      </div>

      <div class="hero-figure" data-reveal style="--reveal-delay: 80ms">
        <div class="hero-figure-glow" aria-hidden="true" />
        <ResponsiveImage
          :image-key="HERO_IMAGE"
          :alt="t('character.alt.outfitB')"
          eager
          sizes="(max-width: 860px) 100vw, (min-width: 2200px) 1260px, (min-width: 1920px) 1080px, 62vw"
          class="hero-image"
        />
      </div>

      <p class="hero-scroll md-label-small" aria-hidden="true">
        <M3Icon name="arrow_upward" :size="14" class="hero-scroll-icon" />
        {{ t('common.scrollHint') }}
      </p>
    </div>
  </SectionShell>
</template>

<style scoped>
.hero {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  /* 比内容栅格（1180px）宽：大屏上把更多横向空间让给立绘，
     否则立绘列过窄会被 contain 压小。留白由自身的 padding 负责。 */
  max-width: min(1920px, 100%);
  margin: 0 auto;
  padding: calc(
      var(--app-bar-height) + var(--app-section-top-gap) + env(safe-area-inset-top, 0px)
    )
    clamp(20px, 5vw, 96px)
    0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.55fr);
  /* 单行占满高度：立绘列拿到确定高度，height:100% 才能真正生效、避免整屏被撑高 */
  grid-template-rows: minmax(0, 1fr);
  align-items: center;
  gap: clamp(12px, 2vw, 40px);
}

/* 大屏进一步把横向空间倾斜给立绘 */
@media (min-width: 1400px) {
  .hero {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.85fr);
  }
}

/* 超宽屏再放宽上限，让立绘有机会吃满整屏高度 */
@media (min-width: 2200px) {
  .hero {
    max-width: 2200px;
  }
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

/* 桌面端：文字块在左栏内水平居中，避免贴住视口最左侧。
   用 justify-self 收缩为内容宽度再居中，不会溢出栏宽；
   窄屏是单列（文字本就要占满宽度），所以只在 ≥861px 生效。 */
@media (min-width: 861px) {
  .hero-text {
    justify-self: center;
  }
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--md-sys-color-tertiary);
  letter-spacing: 0.06em;
}

.hero-name {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}

.hero-name-main {
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--md-sys-color-on-surface);
}

.hero-name-reading {
  color: var(--md-sys-color-primary);
  /* 与左侧大字底部对齐：抵消两种字号行盒的内部行距差 */
  padding-bottom: 2px;
}

.hero-tagline {
  max-width: 26ch;
  color: var(--md-sys-color-on-surface);
  font-weight: 500;
}

.hero-facts {
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
}

.hero-version {
  color: var(--md-sys-color-on-surface-variant);
  letter-spacing: 0.04em;
}

.hero-version-sep {
  margin: 0 6px;
  opacity: 0.6;
}

.hero-figure {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  align-self: stretch;
  width: 100%;
  min-height: 0;
}

/* 立绘身后的墨蓝色光晕：用主色做一层极低透明度的径向渐变，
   让人像与背景之间产生材质关系，同时保持「纯色简约」 */
.hero-figure-glow {
  position: absolute;
  /* 只向上略扩；四周用 closest-side 收在元素内 —— 渐变在边缘恰好为 0，不会裁出硬边 */
  inset: -4% 0 0;
  background: radial-gradient(
    closest-side at 48% 46%,
    color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent),
    transparent
  );
  pointer-events: none;
}

/* ResponsiveImage 内部用 <picture>（display:contents）包裹，
   尺寸样式需穿透到真正的 <img> */
:deep(.hero-image) {
  position: relative;
  /* 填满立绘列：列宽与行高任一先到极限，contain 都会等比缩放，
     因此不会变形，也不会再依赖 width:auto + 父级高度才能算对 */
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: bottom center;
  background-size: contain;
  background-position: bottom center;
}

.hero-scroll {
  position: absolute;
  left: 50%;
  bottom: 18px;
  translate: -50% 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--md-sys-color-on-surface-variant);
  letter-spacing: 0.1em;
}

.hero-scroll-icon {
  rotate: 180deg;
  animation: hero-scroll-bounce 2.4s var(--md-sys-motion-easing-standard) infinite;
}

@keyframes hero-scroll-bounce {
  0%,
  100% {
    translate: 0 0;
    opacity: 0.5;
  }
  50% {
    translate: 0 4px;
    opacity: 1;
  }
}

@media (max-width: 860px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    align-items: start;
    padding-top: calc(
      var(--app-bar-height) + var(--app-section-top-gap) + env(safe-area-inset-top, 0px)
    );
    gap: 8px;
  }

  .hero-name-main {
    font-size: 2.75rem;
    line-height: 3.25rem;
  }

  .hero-tagline {
    max-width: 100%;
  }

  .hero-figure {
    justify-content: center;
    align-items: flex-end;
    /* 给立绘一个下限：文字行长时也不会把立绘行压到 0；
       超出部分交给 SectionShell 的面板内滚，而不是裁掉立绘 */
    min-height: min(40dvh, 64vw);
  }

  :deep(.hero-image) {
    /* 行高由 minmax(0,1fr) 提供，height:100% 会把它填满；
       不再用 44dvh 硬切，避免高屏出现大片空洞、矮屏把立绘压扁 */
    height: 100%;
    max-height: 100%;
  }

  .hero-scroll {
    display: none;
  }
}

/* 矮屏（横屏手机 / 小窗口）：压缩文字节奏，把更多高度让给立绘 */
@media (max-width: 860px) and (max-height: 720px) {
  .hero {
    gap: 6px;
  }

  .hero-text {
    gap: 8px;
  }

  .hero-name-main {
    font-size: 2.25rem;
    line-height: 2.75rem;
  }

  .hero-actions {
    margin-top: 2px;
  }
}

/* 横屏手机：单列上下堆叠放不下文字 + 立绘，改为左右并排 */
@media (max-width: 860px) and (orientation: landscape) {
  .hero {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    grid-template-rows: minmax(0, 1fr);
    align-items: center;
    gap: 16px;
  }

  .hero-figure {
    min-height: 0;
  }
}

/* 竖屏 / 窄高视口：立绘列窄而行高高，居中可以避免上半屏大片空白 */
@media (min-width: 861px) and (max-aspect-ratio: 4 / 5) {
  :deep(.hero-image) {
    object-position: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-scroll-icon {
    animation: none;
  }
}
</style>
