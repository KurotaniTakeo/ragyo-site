<script setup lang="ts">
/**
 * 角色介绍。
 *
 * 左栏是设定与作画备忘（这些内容直接来自配布文件的 readme，是二创者最需要的信息），
 * 右栏是设定图（正面 + 背面双视图，立体地展示耳麦、尾巴与服装）。
 */
import { useI18n } from 'vue-i18n'
import SectionShell from '@/components/SectionShell.vue'
import SectionHeader from '@/components/SectionHeader.vue'
import M3Card from '@/components/M3Card.vue'
import ResponsiveImage from '@/components/ResponsiveImage.vue'
import { SHEET_IMAGE } from '@/data/assets'
import { voicebank } from '@/data/voicebank'
import { sections } from '@/data/sections'

defineProps<{ active: boolean }>()

const { t, tm } = useI18n()

const designNotes = () => tm('character.designNotes') as string[]
const likes = () => tm('character.likes') as string[]
</script>

<template>
  <SectionShell id="character" :active="active">
    <SectionHeader
      :index="4"
      :total="sections.length"
      section-id="character"
      :lead="t('character.lead')"
    />

    <div class="character-grid">
      <div class="character-info">
        <M3Card padding="md" data-reveal>
          <h3 class="card-title md-title-medium">{{ t('character.profileTitle') }}</h3>
          <dl class="profile-list">
            <div class="profile-row">
              <dt class="md-label-medium">{{ t('character.profile.age') }}</dt>
              <dd class="md-title-small">{{ voicebank.profile.age }}</dd>
            </div>
            <div class="profile-row">
              <dt class="md-label-medium">{{ t('character.profile.height') }}</dt>
              <dd class="md-title-small">{{ voicebank.profile.height }}</dd>
            </div>
            <div class="profile-row">
              <dt class="md-label-medium">{{ t('character.profile.weight') }}</dt>
              <dd class="md-title-small">{{ voicebank.profile.weight }}</dd>
            </div>
            <div class="profile-row">
              <dt class="md-label-medium">{{ t('character.profile.likes') }}</dt>
              <dd class="likes">
                <span v-for="like in likes()" :key="like" class="like-tag md-label-small">
                  {{ like }}
                </span>
              </dd>
            </div>
          </dl>
        </M3Card>

        <M3Card class="notes-card" padding="md" data-reveal style="--reveal-delay: 80ms">
          <h3 class="card-title md-title-medium">{{ t('character.designTitle') }}</h3>
          <ul class="note-list">
            <li v-for="(note, index) in designNotes()" :key="index" class="note-item">
              <span class="note-index md-label-small" aria-hidden="true">
                {{ String(index + 1).padStart(2, '0') }}
              </span>
              <span class="md-body-medium">{{ note }}</span>
            </li>
          </ul>
          <p class="gallery-note md-body-small">{{ t('character.galleryNote') }}</p>
        </M3Card>
      </div>

      <figure class="character-figure" data-reveal style="--reveal-delay: 60ms">
        <ResponsiveImage
          :image-key="SHEET_IMAGE"
          :alt="t('character.alt.sheet')"
          sizes="(max-width: 860px) 90vw, 520px"
          class="sheet-image"
        />
        <figcaption class="md-label-small">{{ t('character.galleryTitle') }}</figcaption>
      </figure>
    </div>
  </SectionShell>
</template>

<style scoped>
.character-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: clamp(14px, 2vw, 24px);
  /* 居中而非拉伸：整行仍由 flex:1 撑满一屏，但信息卡与设定图各自按
     内容高度在行内垂直居中，避免设计备忘卡被拉出大片空白 */
  align-items: center;
  min-height: 0;
  flex: 1;
}

.character-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  min-height: 0;
}

.card-title {
  margin: 0 0 12px;
  color: var(--md-sys-color-on-surface);
}

.profile-list {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.profile-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
}

.profile-row + .profile-row {
  box-shadow: inset 0 1px 0 var(--md-sys-color-outline-variant);
}

.profile-row dt {
  color: var(--md-sys-color-on-surface-variant);
}

.profile-row dd {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.likes {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.like-tag {
  padding: 3px 10px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface);
}

.notes-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.note-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note-item {
  display: flex;
  gap: 10px;
  align-items: baseline;
  color: var(--md-sys-color-on-surface-variant);
}

.note-index {
  color: var(--md-sys-color-tertiary);
  font-weight: 700;
  flex: none;
}

.gallery-note {
  margin: 14px 0 0;
  padding-top: 12px;
  box-shadow: inset 0 1px 0 var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-outline);
}

.character-figure {
  margin: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 0;
  border-radius: var(--md-sys-shape-corner-large);
  /* 不加 overflow: hidden —— 透明底立绘无需在圆角处裁切，
     且它可能与 ResponsiveImage 内部 <picture> 的 display:contents 组合产生问题 */
  /* 与首页主视觉同一套：立绘暗部与背景 #505678 近乎同色，用主色光晕拉开轮廓 */
  background: radial-gradient(
    closest-side at 50% 42%,
    color-mix(in srgb, var(--md-sys-color-primary) 40%, transparent),
    color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent) 58%,
    transparent 82%
  );
}

/* ResponsiveImage 内部用 <picture>（display:contents）包裹，
   尺寸样式需穿透到真正的 <img> */
:deep(.sheet-image) {
  /* 双列时填满立绘列：行高由左栏内容决定，避免设定图自身把整行拉高；
     contain 保证宽/高任一先到极限都不变形。设定图上下有透明留白，
     用 center 垂直居中比贴底更平衡。 */
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  background-size: contain;
  background-position: center;
}

.character-figure figcaption {
  color: var(--md-sys-color-on-surface-variant);
  padding-bottom: 4px;
}

/* 断点与 AppBar / NavigationRail / SectionShell 对齐（860px），
   避免 861–980px 区间出现「桌面导轨 + 单列内容」的错配 */
@media (max-width: 860px) {
  .character-grid {
    grid-template-columns: minmax(0, 1fr);
    /* 单列时不再强行撑满一屏：让网格按内容高度排布，
       否则行高会被压扁、立绘被 overflow 裁掉。内容超高交给面板内滚。 */
    flex: none;
  }

  .character-figure {
    order: -1;
  }

  :deep(.sheet-image) {
    /* 满宽度 + 自然高度：设定图铺满整行，不再被高度上限压成
       居中的小图、两侧留下大片空白。超出视口交给面板内滚。 */
    width: 100%;
    height: auto;
    max-height: none;
    object-position: center bottom;
  }
}

/* 矮屏（横屏手机 / 小窗口）：满宽设定图会过高，收回高度上限保证可用 */
@media (max-width: 860px) and (max-height: 720px) {
  :deep(.sheet-image) {
    width: auto;
    max-height: 48dvh;
  }
}

/* 横屏手机：单列上下堆叠时设定图会掉到首屏之外，改为左右并排 */
@media (max-width: 860px) and (orientation: landscape) {
  .character-grid {
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
    align-items: stretch;
    /* 横屏视口高度很小：不强行塞进一屏，让行高随内容增长，
       设定图拿到足够高度、由面板内滚查看，而不是缩成一枚小图 */
    flex: none;
  }

  .character-figure {
    order: 0;
    min-height: 0;
  }

  :deep(.sheet-image) {
    width: 100%;
    height: 100%;
    max-height: 100%;
    object-position: center;
  }
}

/* 矮屏压缩，尽量让角色页整体落进一屏 */
@media (max-height: 860px) {
  .character-grid {
    gap: 14px;
  }

  .character-info {
    gap: 10px;
  }

  .card-title {
    margin-bottom: 8px;
  }

  .profile-row {
    padding: 6px 0;
  }

  .note-list {
    gap: 8px;
  }

  .gallery-note {
    margin-top: 10px;
    padding-top: 8px;
  }
}
</style>
