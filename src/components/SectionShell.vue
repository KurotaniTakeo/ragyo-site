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
  }>(),
  { active: false, bleed: false },
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
        <div class="section-inner">
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

@media (min-width: 861px) {
  .section-body {
    padding-left: var(--app-rail-width);
  }

  .section-body.is-bleed {
    padding-left: 0;
  }
}

@media (max-width: 860px) {
  .section-body {
    padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
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
  overscroll-behavior: contain;
  /* 固定预留滚动条槽位，避免不同分屏之间出现横向位移 */
  scrollbar-gutter: stable;
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
