<script setup lang="ts">
/**
 * 首屏。
 *
 * 立绘是透明底 PNG，因此可以让它直接立在背景上，不需要卡片或遮罩。
 * 结构改为三段式栅格：顶栏（编号 + 品牌）/ 主区（文字 + 立绘）/ 底栏（滚动提示 + 版本）。
 * 文字块贴主区下缘，与立绘下缘、底栏发丝线形成一条暗含的基准线，收住左上角的空白。
 *
 * 背景在原有暗→浅的线性渐变之上，再叠一层静态径向光晕与点阵（伪元素，只绘制一次）；
 * 超大「羅」水印用描边字压在标题之后，作为纯装饰填缝。全部零新增资源。
 */
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import M3Button from '@/components/M3Button.vue'
import ResponsiveImage from '@/components/ResponsiveImage.vue'
import M3Icon from '@/components/M3Icon.vue'
import { HERO_BACKDROP_IMAGE, HERO_IMAGE } from '@/data/assets'
import { pitchRanges, voicebank } from '@/data/voicebank'
import type { Locale } from '@/i18n'

defineProps<{ active: boolean }>()

const emit = defineEmits<{ navigate: [sectionId: string] }>()

const { t, locale } = useI18n()
</script>

<template>
  <SectionShell id="hero" class="hero-shell" bleed :active="active">
    <div class="hero">
      <span class="hero-watermark" aria-hidden="true">羅</span>

      <div class="hero-meta" data-reveal>
        <span class="hero-index md-label-large">
          <span class="hero-index-num">01</span>
          <span class="hero-index-sep" aria-hidden="true">/</span>
          <span class="hero-index-name">{{ t('hero.indexLabel') }}</span>
        </span>
        <span class="hero-brand md-label-medium" aria-hidden="true">
          {{ voicebank.slug.toUpperCase() }} {{ voicebank.type }}
        </span>
      </div>

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

        <dl class="hero-spec" data-reveal style="--reveal-delay: 180ms">
          <div class="hero-spec-row">
            <dt>{{ t('hero.spec.labels.type') }}</dt>
            <dd>{{ voicebank.type }}</dd>
          </div>
          <div class="hero-spec-row">
            <dt>{{ t('hero.spec.labels.pitches') }}</dt>
            <dd>{{ pitchRanges.length }}</dd>
          </div>
          <div class="hero-spec-row">
            <dt>{{ t('hero.spec.labels.tones') }}</dt>
            <dd>{{ voicebank.subbanks.length }}</dd>
          </div>
          <div class="hero-spec-row">
            <dt>{{ t('hero.spec.labels.range') }}</dt>
            <dd>{{ voicebank.toneRange }}</dd>
          </div>
        </dl>

        <div class="hero-actions" data-reveal style="--reveal-delay: 240ms">
          <M3Button icon="download" @click="emit('navigate', 'download')">
            {{ t('hero.ctaPrimary') }}
          </M3Button>
          <M3Button variant="tonal" icon="graphic_eq" @click="emit('navigate', 'samples')">
            {{ t('hero.ctaSecondary') }}
          </M3Button>
        </div>
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

      <div class="hero-foot" data-reveal style="--reveal-delay: 300ms">
        <div class="hero-scroll" aria-hidden="true">
          <M3Icon name="arrow_upward" :size="18" class="hero-scroll-icon" />
          <span class="hero-scroll-label md-label-large">{{ t('common.scrollHint') }}</span>
        </div>

        <p class="hero-version md-label-medium">
          {{ t('hero.version', { version: voicebank.version }) }}
          <span class="hero-version-sep" aria-hidden="true">·</span>
          {{ voicebank.libraryName }}
        </p>
      </div>
    </div>
  </SectionShell>
</template>

<style scoped>
/* ------------------------------------------------------------------
   分屏背景：挂在分屏根节点上（而非 .hero）——.hero 有 1920px 宽度上限，
   超宽屏下两侧会露出纯色；挂到分屏则始终铺满。
   顶部维持暗色 surface，向下过渡到委托人指定的 #baaebb。

   contain: paint 让分屏成为独立绘制层：伪元素的负 z-index 因此压在
   分屏自身背景之上、内容之下，且不会为动画元素逐帧重绘。 */
.hero-shell {
  --hero-hairline: color-mix(in srgb, var(--md-sys-color-on-surface) 16%, transparent);

  background: linear-gradient(
    180deg,
    var(--md-sys-color-surface) 0%,
    var(--md-sys-color-surface) 48%,
    color-mix(in srgb, var(--md-sys-color-surface) 62%, #baaebb) 68%,
    color-mix(in srgb, var(--md-sys-color-surface) 12%, #baaebb) 86%,
    #baaebb 100%
  );
  isolation: isolate;
  contain: paint;
}

/* 静态径向光晕：给纯色渐变加纵深。色调由 token 派生，随调色板重新生成而同步。 */
.hero-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background:
    radial-gradient(
      120% 80% at 88% 18%,
      color-mix(in srgb, var(--md-sys-color-primary) 26%, transparent),
      transparent 60%
    ),
    radial-gradient(
      90% 70% at 8% 92%,
      color-mix(in srgb, var(--md-sys-color-tertiary) 22%, transparent),
      transparent 65%
    );
}

/* 点阵：一行 radial-gradient 平铺，再用遮罩收成有走向的光斑。 */
.hero-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: radial-gradient(
    circle at 1px 1px,
    color-mix(in srgb, var(--md-sys-color-on-surface) 9%, transparent) 1.2px,
    transparent 1.5px
  );
  background-size: 22px 22px;
  -webkit-mask-image: radial-gradient(75% 65% at 62% 42%, #000, transparent 78%);
  mask-image: radial-gradient(75% 65% at 62% 42%, #000, transparent 78%);
}

/* ------------------------------------------------------------------
   三段式栅格
------------------------------------------------------------------ */
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-areas:
    'meta figure'
    'text figure'
    'foot foot';
  align-items: end;
  column-gap: clamp(12px, 2.5vw, 56px);
  row-gap: clamp(8px, 1.6vh, 20px);
}

/* 超大「羅」水印：描边空心字，压在标题之后偏左，把标题与左侧空白缝起来。
   纯装饰，不参与无障碍树。 */
.hero-watermark {
  position: absolute;
  left: -0.04em;
  top: 50%;
  translate: 0 -50%;
  z-index: 0;
  font-weight: 800;
  font-size: clamp(180px, 26vw, 420px);
  line-height: 0.8;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in srgb, var(--md-sys-color-on-surface) 14%, transparent);
  pointer-events: none;
  user-select: none;
}

/* 其余内容抬到水印之上 */
.hero-meta,
.hero-text,
.hero-foot,
.hero-figure {
  position: relative;
  z-index: 1;
}

/* ---------------------------------------------------- 顶栏：编号 + 品牌 */
.hero-meta {
  grid-area: meta;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.hero-index {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  letter-spacing: 0.12em;
  color: var(--md-sys-color-on-surface-variant);
}

.hero-index-num {
  color: var(--md-sys-color-tertiary);
  font-variant-numeric: tabular-nums;
}

.hero-index-sep {
  opacity: 0.5;
}

.hero-index-name {
  text-transform: uppercase;
}

.hero-brand {
  letter-spacing: 0.2em;
  color: var(--md-sys-color-on-surface-variant);
  white-space: nowrap;
}

/* ------------------------------------------------------------ 主区文字块 */
.hero-text {
  grid-area: text;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
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
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--md-sys-color-on-surface);
  /* 字阶拉大本身就是最好的填充物，随视口流体缩放。 */
  font-size: clamp(3rem, 6.5vw, 6.5rem);
  line-height: 1.08;
}

.hero-name-reading {
  color: var(--md-sys-color-primary);
  /* 与左侧大字底部对齐：抵消两种字号行盒的内部行距差 */
  padding-bottom: 0.28em;
  font-size: 1.5rem;
  line-height: 1.9rem;
}

.hero-tagline {
  max-width: 26ch;
  color: var(--md-sys-color-on-surface);
  /* 首页文案使用衬线体，营造「书写」的质感；正文仍用无衬线体 */
  font-family: var(--app-font-serif);
  font-weight: 400;
  font-size: 1.65rem;
  line-height: 2.2rem;
  text-wrap: balance;
}

/* 规格表：把一行 facts 拆成多行键值，每行一条发丝分割线。 */
.hero-spec {
  display: grid;
  margin: 4px 0 0;
  max-width: min(28rem, 100%);
  border-top: 1px solid var(--hero-hairline);
}

.hero-spec-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24px;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px solid var(--hero-hairline);
}

.hero-spec dt {
  color: var(--md-sys-color-on-surface-variant);
  letter-spacing: 0.04em;
  font-size: 0.82rem;
  line-height: 1.1rem;
}

.hero-spec dd {
  margin: 0;
  text-align: right;
  color: var(--md-sys-color-on-surface);
  font-variant-numeric: tabular-nums;
  font-size: 0.9rem;
  line-height: 1.1rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}

/* ------------------------------------------------------------ 底栏 */
.hero-foot {
  grid-area: foot;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: clamp(10px, 1.6vh, 18px);
  border-top: 1px solid var(--hero-hairline);
}

.hero-version {
  color: var(--md-sys-color-on-surface-variant);
  letter-spacing: 0.04em;
  font-size: 0.82rem;
  line-height: 1.1rem;
  white-space: nowrap;
}

.hero-version-sep {
  margin: 0 6px;
  opacity: 0.6;
}

/* 滚动提示：从绝对居中的胶囊改为底栏内联，避免与底栏重叠。
   不再使用 backdrop-filter（全屏分屏上容易触发大范围重绘）。 */
.hero-scroll {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 16px 7px 12px;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-inverse-on-surface);
  background: color-mix(in srgb, var(--md-sys-color-inverse-surface) 88%, transparent);
  letter-spacing: 0.12em;
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

/* ------------------------------------------------------------ 立绘 */
.hero-figure {
  grid-area: figure;
  grid-row: 1 / 3;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  /* 立绘只用绝对定位的子元素绘制，没有流内内容撑高；
     必须显式 stretch，否则整列塌成 0 高、图片高度随之归零。 */
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

/* ------------------------------------------------------------------
   响应式
------------------------------------------------------------------ */
@media (max-width: 860px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    /* 立绘行的下界写在行轨上（而非 .hero-figure 的 min-height）：
       否则 1fr 行高不足时，被 min-height 撑大的立绘会溢出到下一行、压住底栏。 */
    grid-template-rows: auto auto minmax(min(34dvh, 58vw), 1fr) auto;
    grid-template-areas:
      'meta'
      'text'
      'figure'
      'foot';
    align-items: start;
    row-gap: 10px;
  }

  .hero-text {
    gap: 12px;
  }

  .hero-spec-row {
    padding: 6px 0;
  }

  .hero-figure {
    grid-row: auto;
    align-items: flex-end;
    min-height: 0;
  }

  .hero-foot {
    align-self: end;
  }

  /* 窄屏让出横向空间：水印与品牌字样在单列里只会挤占内容 */
  .hero-watermark,
  .hero-brand {
    display: none;
  }

  .hero-name-main {
    font-size: 2.75rem;
    line-height: 3rem;
  }

  .hero-tagline {
    max-width: 100%;
  }
}

/* 矮屏（横屏手机 / 小窗口）：压缩文字节奏，把更多高度让给立绘 */
@media (max-width: 860px) and (max-height: 720px) {
  .hero {
    row-gap: 6px;
  }

  .hero-text {
    gap: 8px;
  }

  .hero-name-main {
    font-size: 2.25rem;
    line-height: 2.5rem;
  }

  .hero-actions {
    margin-top: 2px;
  }

  /* 高度实在不够时收起规格表，保证按钮与版本号仍在一屏内 */
  .hero-spec {
    display: none;
  }
}

/* 横屏手机：单列上下堆叠放不下文字 + 立绘，改为左右并排。
   高度极紧，这里进一步压缩字阶并收起顶栏编号行，保证文字块不溢出到顶栏之上。 */
@media (max-width: 860px) and (orientation: landscape) {
  .hero {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-areas:
      'meta figure'
      'text figure'
      'foot foot';
    align-items: end;
    column-gap: 16px;
  }

  .hero-meta {
    display: none;
  }

  .hero-text {
    gap: 6px;
  }

  .hero-name-main {
    font-size: 2rem;
    line-height: 2.25rem;
  }

  .hero-tagline {
    font-size: 1.35rem;
    line-height: 1.8rem;
  }

  .hero-figure {
    grid-row: 1 / 3;
    min-height: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-scroll-icon {
    animation: none;
  }
}
</style>
