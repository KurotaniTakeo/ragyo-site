<script setup lang="ts">
/**
 * 单个全屏分屏的外壳。
 *
 * 统一处理四件事：
 *   1. 100dvh 高度 + scroll-snap 对齐（不用 100vh，手机地址栏会截断）
 *   2. 顶栏与导航轨的避让内边距
 *   3. 进入视口时的淡入位移（由 active 驱动，reduced-motion 下自动关闭）
 *   4. 内容超出一屏时在面板内滚动：全屏翻页逻辑会先让面板滚到底，
 *      之后才翻到下一屏（见 useFullPageScroll 的 [data-scrollable]）
 *
 * 注意 [data-scrollable] 是滚动接管逻辑的判定依据，必须渲染出来。
 */
withDefaults(
  defineProps<{
    /** 同时作为锚点 id、data-section 与 i18n 键 */
    id: string
    /** 是否为当前屏 */
    active?: boolean
    /** 内容通铺到视口边缘，不加最大宽度限制 */
    bleed?: boolean
    /** 放宽最大宽度（长文分屏在大屏上排多栏时使用） */
    wide?: boolean
  }>(),
  { active: false, bleed: false, wide: false },
)
</script>

<template>
  <section
    :id="id"
    class="snap-section"
    :data-section="id"
    :data-active="active ? 'true' : 'false'"
    :aria-hidden="active ? undefined : 'true'"
  >
    <div class="section-body" :class="{ 'is-bleed': bleed }">
      <div class="section-panel" data-scrollable>
        <div class="section-inner" :class="{ 'is-wide': wide }">
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-top: calc(
    var(--app-bar-height) + var(--app-section-top-gap) + env(safe-area-inset-top, 0px)
  );
  padding-bottom: 24px;
}

.section-body.is-bleed {
  padding-top: 0;
  /* 通铺分屏（首屏）不留底部留白，让立绘与发光贴到视口底部 */
  padding-bottom: 0;
}

/* 桌面布局：鼠标宽屏，或横屏触屏（横屏平板）。为左侧导轨让出内边距 */
@media (min-width: 861px) and (pointer: fine), (min-width: 861px) and (orientation: landscape) {
  .section-body {
    padding-left: var(--app-rail-width);
  }

  .section-body.is-bleed {
    padding-left: 0;
  }
}

/* 移动布局：窄屏，或触屏竖屏（手机 / 竖屏平板） */
@media (max-width: 860px), (pointer: coarse) and (orientation: portrait) {
  /* 分屏铺到真正的视口底部（底部被固定导航盖住）；底部间隔改由
     .section-inner 的尾部内边距提供（规则见下方 .section-inner 之后），
     于是「间隔」只在滚到最底时露出，滚动中途内容一直铺到导航栏，
     不再有一条常驻的空白带。 */
  .section-body {
    padding-bottom: 0;
  }

  /* 通铺分屏（首屏）：立绘贴到底栏，由固定底栏盖住即可。 */
  .section-body.is-bleed {
    padding-bottom: 0;
  }
}

/* 内容面板：内容放得下时无滚动条（整屏翻页手感不变），
   超出时在面板内滚动，保证底部内容始终可达。 */
.section-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  /* 横向必须放行：移动端外层 .snap-scroller 才是横向整屏翻页容器，而面板本身
     overflow-x: hidden，横滑在面板上属于 x 轴 overscroll。若这里用 contain，手势
     不会链式传给外层，屏幕就永远翻不动。纵向保持 contain，余量仍在面板内消化。 */
  overscroll-behavior-x: auto;
  overscroll-behavior-y: contain;
  /* 固定预留滚动条槽位，避免不同分屏之间出现横向位移 */
  scrollbar-gutter: stable;
}

/* 通铺分屏（bleed）不受内容栅格的最大宽度约束：
   否则 HeroSection 自身的 max-width 永远到不了，立绘会被挤在 1180px 窄带里。
   留白与上限改由分屏自身管理（见 HeroSection 的 .hero）。 */
.section-body.is-bleed .section-inner {
  max-width: none;
  padding-inline: 0;
}

.section-inner {
  width: 100%;
  max-width: var(--app-content-max);
  margin: 0 auto;
  padding: 0 var(--app-gutter);
  /* 撑满面板，让各分屏内部的 flex:1 与图片 height:100% 真正生效 */
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  /* 内容比视口矮时整组垂直居中（上下留白均匀）；
     内容更高时 safe 会回落为顶对齐，避免顶部被裁 */
  justify-content: center;
  justify-content: safe center;
}

/* 移动端底部间隔：放在 .section-inner 基础规则之后，避免被其 padding/flex 覆盖。
   flex-basis auto + 不收缩：内容矮时 grow 撑满面板；内容高时盒子随内容增长，
   尾部内边距因此落在滚动末端，只有滚到底才露出间隔。 */
@media (max-width: 860px), (pointer: coarse) and (orientation: portrait) {
  .section-inner {
    flex: 1 0 auto;
    padding-bottom: calc(var(--app-bottom-nav) + var(--app-section-bottom-gap));
  }

  .section-body.is-bleed .section-inner {
    padding-bottom: 0;
  }
}

/* 放宽最大宽度：长文分屏在大屏上排多栏，不被 1180px 的栅格钉成窄条 */
.section-inner.is-wide {
  max-width: var(--app-content-wide);
}

/* 进入视口时的浮现：由 active 属性驱动，避免为每个元素挂 observer */
.snap-section [data-reveal] {
  opacity: 0;
  transform: translateY(18px);
  transition:
    opacity var(--md-sys-motion-duration-long4) var(--md-sys-motion-easing-emphasized-decelerate),
    transform var(--md-sys-motion-duration-long4) var(--md-sys-motion-easing-emphasized-decelerate);
  transition-delay: var(--reveal-delay, 0ms);
}

.snap-section[data-active='true'] [data-reveal] {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .snap-section [data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
