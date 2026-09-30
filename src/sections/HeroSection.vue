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
          sizes="(max-width: 860px) 88vw, 46vw"
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
  max-width: 1440px;
  margin: 0 auto;
  padding: calc(
      var(--app-bar-height) + var(--app-section-top-gap) + env(safe-area-inset-top, 0px)
    )
    0 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.8fr);
  /* 单行占满高度：立绘列拿到确定高度，height:100% 才能真正生效、避免整屏被撑高 */
  grid-template-rows: minmax(0, 1fr);
  align-items: center;
  gap: clamp(12px, 2vw, 40px);
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
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
  min-height: 0;
}

/* 立绘身后的墨蓝色光晕：用主色做一层极低透明度的径向渐变，
   让人像与背景之间产生材质关系，同时保持「纯色简约」 */
.hero-figure-glow {
  position: absolute;
  /* 只向上略扩；四周用 closest-side 收在元素内 —— 渐变在边缘恰好为 0，不会裁出硬边 */
  inset: -4% 0 0;
  background: radial-gradient(
    closest-side at 50% 46%,
    color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent),
    transparent
  );
  pointer-events: none;
}

/* ResponsiveImage 内部用 <picture>（display:contents）包裹，
   尺寸样式需穿透到真正的 <img> */
:deep(.hero-image) {
  position: relative;
  height: 100%;
  max-height: 100%;
  width: auto;
  max-width: 100%;
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
    min-height: 0;
  }

  :deep(.hero-image) {
    height: 100%;
    max-height: 44dvh;
  }

  .hero-scroll {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-scroll-icon {
    animation: none;
  }
}
</style>
