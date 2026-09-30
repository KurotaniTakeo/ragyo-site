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
          sizes="(max-width: 980px) 90vw, 46vw"
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
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: clamp(14px, 2vw, 24px);
  align-items: stretch;
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
  min-height: 0;
  border-radius: var(--md-sys-shape-corner-large);
  /* 不加 overflow: hidden —— 透明底立绘无需在圆角处裁切，
     且它可能与 ResponsiveImage 内部 <picture> 的 display:contents 组合产生问题 */
  background: radial-gradient(
    closest-side at 50% 42%,
    color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent),
    transparent
  );
}

/* ResponsiveImage 内部用 <picture>（display:contents）包裹，
   尺寸样式需穿透到真正的 <img> */
:deep(.sheet-image) {
  height: 100%;
  max-height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  object-position: bottom center;
  background-size: contain;
  background-position: bottom center;
}

.character-figure figcaption {
  color: var(--md-sys-color-on-surface-variant);
  padding-bottom: 4px;
}

@media (max-width: 980px) {
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
    height: auto;
    max-height: 40dvh;
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
