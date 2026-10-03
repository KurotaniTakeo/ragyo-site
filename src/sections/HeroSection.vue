<script setup lang="ts">
/**
 * 首屏。
 *
 * 立绘是透明底 PNG，因此可以让它直接立在背景上，不需要卡片或遮罩。
 * 左侧文字与右侧立绘并排；立绘拉伸占满内容高度、贴到视口底部，
 * 文字块上下居中并略向画面中部靠拢，底部中央保留原来的滚动提示胶囊。
 *
 * 背景在原有暗→浅的线性渐变之上，再叠静态径向光晕、点阵与一层左下可读性遮罩
 * （伪元素，只绘制一次）；超大「羅」水印用描边字压在标题之后。全部零新增资源。
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
      <div class="hero-text">
        <span class="hero-watermark" aria-hidden="true">羅</span>

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

        <p class="hero-version md-label-medium" data-reveal style="--reveal-delay: 300ms">
          {{ t('hero.version', { version: voicebank.version }) }}
          <span class="hero-version-sep" aria-hidden="true">·</span>
          {{ voicebank.libraryName }}
        </p>
      </div>

      <div class="hero-figure" data-reveal style="--reveal-delay: 80ms">
        <div class="hero-backdrop-clip" aria-hidden="true">
          <ResponsiveImage
            :image-key="HERO_BACKDROP_IMAGE"
            alt=""
            aria-hidden="true"
            sizes="(max-width: 860px) 70vw, 36vw"
            class="hero-backdrop"
          />
        </div>
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

/* 静态叠加层。顺序（自上而下）：
   1. 左侧可读性遮罩 —— 文字整体偏左下，正落在渐变的浅色段（#baaebb），
      用一层由 surface 派生的暗色径向把左侧压回去，约 55% 宽度处渐隐，不影响立绘；
   2. 右上 / 左下两团光晕 —— 给纯色渐变加纵深。
   色调全部由 token 派生，随调色板重新生成而同步。 */
.hero-shell::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background:
    radial-gradient(
      120% 100% at -14% 58%,
      color-mix(in srgb, var(--md-sys-color-surface) 92%, transparent) 0%,
      color-mix(in srgb, var(--md-sys-color-surface) 78%, transparent) 30%,
      color-mix(in srgb, var(--md-sys-color-surface) 40%, transparent) 52%,
      transparent 70%
    ),
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
   两栏栅格
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
  /* 单行占满高度：立绘列拿到确定高度，才能拉伸到视口底部 */
  grid-template-rows: minmax(0, 1fr);
  /* 文字块上下居中；立绘靠 align-self: stretch 继续铺满整行、贴到视口底部。 */
  align-items: center;
  column-gap: clamp(12px, 2.5vw, 56px);
}

/* 超大「羅」水印：描边空心字，位于文字块内、压在文字之下。
   贴在文字块的左上方，只有右下角略微压到标题；随文字块一起移动。纯装饰，不进无障碍树。 */
.hero-watermark {
  position: absolute;
  left: -0.16em;
  top: 0;
  translate: 0 -62%;
  z-index: -1;
  font-weight: 800;
  font-size: clamp(180px, 26vw, 420px);
  line-height: 0.8;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in srgb, var(--md-sys-color-on-surface) 14%, transparent);
  pointer-events: none;
  user-select: none;
}

.hero-text,
.hero-figure {
  position: relative;
  z-index: 1;
}

/* ------------------------------------------------------------ 左侧文字块 */
.hero-text {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  /* 水印是文字块内的绝对定位负 z-index 元素，用 isolation 把它锁在
     文字块自己的层叠上下文里（压在文字下、背景上）。 */
  isolation: isolate;
}

/* 桌面端：整块在中栏内居中后再略微右移，向画面中部靠拢；
   垂直方向仍由父级 align-items: end 贴底。窄屏单列时取消。 */
@media (min-width: 861px) {
  .hero-text {
    justify-self: center;
    translate: clamp(20px, 2.6vw, 56px) 0;
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
  /* 贴底后落在渐变浅色段；用全不透明的 on-surface，实测对比度约 4.7–5.1:1 */
  color: var(--md-sys-color-on-surface);
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

.hero-version {
  color: var(--md-sys-color-on-surface);
  letter-spacing: 0.04em;
  font-size: 0.82rem;
  line-height: 1.1rem;
  white-space: nowrap;
}

.hero-version-sep {
  margin: 0 6px;
  opacity: 0.6;
}

/* 滚动提示：绝对定位到底部中央（沿用改动前的位置与胶囊样式）。 */
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

/* ------------------------------------------------------------ 立绘 */
.hero-figure {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  /* 立绘只用绝对定位的子元素绘制，没有流内内容撑高；
     必须显式 stretch，否则整列塌成 0 高、图片高度随之归零。 */
  align-self: stretch;
  width: 100%;
  min-height: 0;
}

/* 背影立绘的裁剪容器：与主立绘同法——放大后从底部硬裁，只留上半身。
   它是纯装饰（aria-hidden），不进无障碍树，也不参与栅格。 */
.hero-backdrop-clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

:deep(.hero-backdrop) {
  position: absolute;
  /* 以主立绘圆心（= 列中心）为基准，用相对自身宽度的位移做固定右移：
     背影与主立绘都按高度缩放，因此两者的相对几何在各窗口下保持一致，
     不会出现被主立绘完全遮挡、或离得过远的情况。 */
  left: 50%;
  top: 12%;
  height: 190%;
  width: auto;
  max-width: none;
  translate: 23% 0;
  object-fit: contain;
  object-position: top center;
  opacity: 0.32;
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
   （不能用 clip-path：它只影响绘制，不影响可滚动溢出区域。）
   左右边缘再叠一层水平渐隐遮罩：够宽的视口下立绘会被完整放开、离边缘较远
   因而不受影响；窄屏/高屏上被裁切的位置则变成柔和淡出，而不是一刀切。
   默认裁到列宽；仅在够宽且较扁的视口上向两侧放开（见下方媒体查询）。 */
.hero-clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 1;
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 40px,
    #000 calc(100% - 40px),
    transparent 100%
  );
  mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 40px,
    #000 calc(100% - 40px),
    transparent 100%
  );
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

/* 够宽且较扁的视口：角色内容比列宽，向两侧放开裁剪框才不会被切；
   这类视口下角色左缘不会越过文字块，因此不会遮挡文字。 */
@media (min-width: 1360px) and (min-aspect-ratio: 3 / 2) {
  .hero-clip {
    left: -18%;
    right: -18%;
  }
}

@media (max-width: 860px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
    /* 立绘行的下界写在行轨上（而非 .hero-figure 的 min-height）：
       否则 1fr 行高不足时，被 min-height 撑大的立绘会溢出到下一行。 */
    grid-template-rows: auto minmax(min(34dvh, 58vw), 1fr);
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
    align-items: flex-end;
  }

  /* 窄屏让出横向空间：水印在单列里只会挤占内容 */
  .hero-watermark {
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

/* 单列（竖屏）时主立绘只占一列，背影若仍按列中心右移会大半跑到视口外；
   这里改回贴右缘，让背影收在主立绘右侧。 */
@media (max-width: 860px) and (orientation: portrait) {
  :deep(.hero-backdrop) {
    left: auto;
    right: 0;
    translate: none;
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
   高度极紧，这里进一步压缩字阶，保证文字块放得下。 */
@media (max-width: 860px) and (orientation: landscape) {
  .hero {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
    grid-template-rows: minmax(0, 1fr);
    align-items: center;
    column-gap: 16px;
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
    min-height: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-scroll-icon {
    animation: none;
  }
}
</style>
