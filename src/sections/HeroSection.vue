<script setup lang="ts">
/**
 * 首屏。
 *
 * 立绘是透明底 PNG，因此可以让它直接立在背景上，不需要卡片或遮罩。
 * 背景自暗色 surface 渐变到下方的 #baaebb，白色的半透明描边立绘
 * 叠在一层半透明的背面立绘之前；左侧文字、右侧人像，窄屏改为上下堆叠。
 */
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import M3Button from '@/components/M3Button.vue'
import ResponsiveImage from '@/components/ResponsiveImage.vue'
import M3Icon from '@/components/M3Icon.vue'
import { HERO_BACKDROP_IMAGE, HERO_IMAGE } from '@/data/assets'
import { voicebank } from '@/data/voicebank'
import type { Locale } from '@/i18n'

defineProps<{ active: boolean }>()

const emit = defineEmits<{ navigate: [sectionId: string] }>()

const { t, locale } = useI18n()
</script>

<template>
  <SectionShell id="hero" class="hero-shell" bleed :active="active">
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
        <ResponsiveImage
          :image-key="HERO_BACKDROP_IMAGE"
          alt=""
          aria-hidden="true"
          sizes="(max-width: 860px) 70vw, 36vw"
          class="hero-backdrop"
        />
        <div class="hero-figure-glow" aria-hidden="true" />
        <div class="hero-clip">
          <ResponsiveImage
            :image-key="HERO_IMAGE"
            :alt="t('character.alt.outfitB')"
            eager
            sizes="(max-width: 860px) 120vw, (min-width: 2200px) 1800px, 78vw"
            class="hero-image"
          />
        </div>
      </div>

      <div class="hero-scroll" aria-hidden="true">
        <M3Icon name="arrow_upward" :size="18" class="hero-scroll-icon" />
        <span class="hero-scroll-label md-label-large">{{ t('common.scrollHint') }}</span>
      </div>
    </div>
  </SectionShell>
</template>

<style scoped>
/* 背景渐变挂在分屏根节点上（而非 .hero）：
   .hero 有 1920px 的宽度上限，超宽屏下两侧会露出纯色；挂到分屏则始终铺满。
   顶部维持暗色 surface，向下过渡到委托人指定的 #baaebb。 */
.hero-shell {
  background: linear-gradient(
    180deg,
    var(--md-sys-color-surface) 0%,
    var(--md-sys-color-surface) 48%,
    color-mix(in srgb, var(--md-sys-color-surface) 62%, #baaebb) 68%,
    color-mix(in srgb, var(--md-sys-color-surface) 12%, #baaebb) 86%,
    #baaebb 100%
  );
}

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
  gap: 18px;
  min-width: 0;
}

/* 桌面端：文字块在左栏内居中后再整体右移、上移。
   右移让它更靠近画面中部；上移让它落在整页（含顶栏）中心偏上的位置。
   窄屏是单列（文字本就要占满宽度），所以只在 ≥861px 生效。 */
@media (min-width: 861px) {
  .hero-text {
    justify-self: center;
    translate: clamp(40px, 5vw, 96px) -5vh;
  }
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--md-sys-color-tertiary);
  letter-spacing: 0.06em;
  font-size: 0.95rem;
  line-height: 1.35rem;
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
  /* 比 md-display-large 略大，填补首屏偏空的感觉 */
  font-size: 3.875rem;
  line-height: 4.35rem;
}

.hero-name-reading {
  color: var(--md-sys-color-primary);
  /* 与左侧大字底部对齐：抵消两种字号行盒的内部行距差 */
  padding-bottom: 2px;
  font-size: 1.5rem;
  line-height: 1.9rem;
}

.hero-tagline {
  max-width: 26ch;
  color: var(--md-sys-color-on-surface);
  /* 首页文案使用衬线体，营造「书写」的质感；正文仍用无衬线体 */
  font-family: var(--app-font-serif);
  font-weight: 500;
  font-size: 1.65rem;
  line-height: 2.2rem;
}

.hero-facts {
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
  font-size: 0.95rem;
  line-height: 1.4rem;
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
  font-size: 0.82rem;
  line-height: 1.1rem;
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

/* 背景里的背面立绘：绝对定位到主视觉右后方，压暗成半透明剪影。
   底部用 mask 渐隐，避免在浅色渐变上裁出一条生硬的底边。
   它是纯装饰（aria-hidden），因此不进无障碍树，也不参与栅格。 */
:deep(.hero-backdrop) {
  position: absolute;
  right: 0;
  bottom: 0;
  height: 110%;
  width: auto;
  max-width: none;
  object-fit: contain;
  object-position: bottom right;
  opacity: 0.32;
  z-index: 0;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);
}

/* 立绘身后的光晕：用主色做一层径向渐变，把人像从同色系背景里托出来。
   立绘身上有 #545873 一类与背景 #505678 近乎同色的暗部，只靠底色无法拉开轮廓，
   需要这层明暗落差；同时它仍是柔和暖光，保持「纯色简约」。 */
.hero-figure-glow {
  position: absolute;
  /* 只向上略扩；四周用 closest-side 收在元素内 —— 渐变在边缘恰好为 0，不会裁出硬边 */
  inset: -4% 0 0;
  background: radial-gradient(
    closest-side at 48% 46%,
    color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent),
    color-mix(in srgb, var(--md-sys-color-primary) 6%, transparent) 58%,
    transparent 82%
  );
  pointer-events: none;
  z-index: 0;
}

/* 主立绘的裁剪容器：overflow:hidden 会把放大的立绘真正裁掉，
   这样溢出的下半身才不会被算进父级的可滚动高度、把首屏撑长。
   （不能用 clip-path：它只影响绘制，不影响可滚动溢出区域。） */
.hero-clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 1;
}

/* ResponsiveImage 内部用 <picture>（display:contents）包裹，
   尺寸样式需穿透到真正的 <img> */
:deep(.hero-image) {
  position: absolute;
  top: 0;
  left: 50%;
  translate: -50% 0;
  /* 放大到裁剪容器高的 190% 并顶端对齐：容器可见的高度 = 1/1.9 ≈ 52.6%，
     正好裁到胯部。数值按「至少到胯部」对照参考图调整。 */
  height: 190%;
  width: auto;
  max-width: none;
  max-height: none;
  object-fit: contain;
  object-position: top center;
  background-size: contain;
  background-position: top center;
}

.hero-scroll {
  position: absolute;
  left: 50%;
  bottom: clamp(16px, 3vh, 28px);
  translate: -50% 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 18px 8px 14px;
  border-radius: var(--md-sys-shape-corner-full);
  /* 用浅色胶囊 + 深色文字（M3 的 inverse 配色）：
     桌面端落在浅色渐变上、窄屏又常压在深色立绘上，这组配色在两种底色上都清晰 */
  color: var(--md-sys-color-inverse-on-surface);
  background: color-mix(in srgb, var(--md-sys-color-inverse-surface) 84%, transparent);
  backdrop-filter: blur(3px);
  letter-spacing: 0.12em;
  z-index: 2;
}

.hero-scroll-icon {
  rotate: 180deg;
  animation: hero-scroll-bounce 1.8s var(--md-sys-motion-easing-standard) infinite;
}

@keyframes hero-scroll-bounce {
  0%,
  100% {
    translate: 0 -1px;
    opacity: 0.45;
  }
  50% {
    translate: 0 3px;
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

@media (prefers-reduced-motion: reduce) {
  .hero-scroll-icon {
    animation: none;
  }
}
</style>
