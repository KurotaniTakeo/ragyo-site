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
import M3Button from '@/components/M3Button.vue'
import ResponsiveImage from '@/components/ResponsiveImage.vue'
import CharacterViewer from '@/components/CharacterViewer.vue'
import { useScrollContext } from '@/composables/useScrollContext'
import { SHEET_IMAGE } from '@/data/assets'
import { voicebank } from '@/data/voicebank'
import { sections } from '@/data/sections'

defineProps<{ active: boolean }>()

const { t, tm } = useI18n()
const { goToId, requestHighlight } = useScrollContext()

const designNotes = () => tm('character.designNotes') as string[]
const likes = () => tm('character.likes') as string[]

/** 跳到下载区并高亮「立绘」那一组下载卡片 */
const goToIllustrationDownload = () => {
  goToId('download')
  requestHighlight('download', 'illustration')
}
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
        <div class="character-media">
          <span class="character-glow" aria-hidden="true" />
          <span class="character-dots" aria-hidden="true" />
          <ResponsiveImage
            :image-key="SHEET_IMAGE"
            :alt="t('character.alt.sheet')"
            sizes="(max-width: 1024px) 90vw, 520px"
            class="sheet-image"
          />
        </div>
        <figcaption class="md-label-small">{{ t('character.galleryTitle') }}</figcaption>
        <div class="character-actions">
          <CharacterViewer />
          <M3Button variant="tonal" icon="download" @click="goToIllustrationDownload">
            {{ t('character.downloadIllust') }}
          </M3Button>
        </div>
      </figure>
    </div>
  </SectionShell>
</template>

<style scoped>
/* 让品牌头不参与收缩：矮屏时收缩量全部由网格承担，标题不被压行 */
:deep(.section-header) {
  flex: none;
}

.character-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: clamp(14px, 2vw, 24px);
  /* 顶对齐：两栏内容各自贴顶，立绘列与卡片列齐平 */
  align-items: start;
  min-height: 0;
  /* 不强制撑满面板（flex-grow: 0）：内容按自身高度排布，由 SectionShell 的
     .section-inner 做垂直居中；同时允许收缩（flex-shrink: 1），矮屏时网格
     连同立绘一起收进一屏，避免出现内部滚动 */
  flex: 0 1 auto;
}

.character-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  min-height: 0;
  /* 压在立绘光晕之上：光晕向卡片一侧扩散时会被不透明卡片挡住 */
  position: relative;
  z-index: 1;
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
  /* 顶对齐的同时拉伸到整行高度：立绘列比卡片高，若不拉伸会向下溢出、
     把图注与按钮挤出视口；拉伸后由 .character-media 收缩吸收高度 */
  align-self: stretch;
  min-height: 0;
  /* 不加 overflow: hidden —— 透明底立绘无需在圆角处裁切，
     且它可能与 ResponsiveImage 内部 <picture> 的 display:contents 组合产生问题 */
}

/* 立绘与其身后的光晕同处一层，图注与按钮留在层外 */
.character-media {
  position: relative;
  width: 100%;
  /* 桌面为内容高度（basis auto 不会凭空拉伸）；横屏等受限高度时再随行高伸展 */
  flex: 1 1 auto;
  min-height: 0;
}

/* 立绘周围的背景：用独立绝对定位层复刻首页那套叠加效果（见 HeroSection.vue），
   而不用给容器铺背景——所有渐变都以 transparent 收尾，四边不触边，
   因此没有硬边或可见边框；离立绘较远处仍是纯色 surface。
   层盒向四周（尤其左侧）外扩，效果铺得更开；压到卡片一侧的部分由
   .character-info 的不透明卡片盖住。 */
.character-glow {
  position: absolute;
  /* 底边只向下探 8%（小于图注+按钮所占高度），避免绝对定位层溢出滚动容器、
     凭空撑出内部滚动；左右与顶部多扩以铺开效果 */
  inset: -8% -16% -8% -18%;
  z-index: 0;
  pointer-events: none;
  background:
    /* 头部附近的暖光：取调色板的 tertiary（暖浅红），只作一点提亮 */
    radial-gradient(
      closest-side at 50% 16%,
      color-mix(in srgb, var(--md-sys-color-tertiary) 22%, transparent),
      color-mix(in srgb, var(--md-sys-color-tertiary) 7%, transparent) 48%,
      transparent 78%
    ),
    /* 主色轮廓光晕：立绘暗部与背景近乎同色，用它拉开轮廓 */
    radial-gradient(
      closest-side at 48% 44%,
      color-mix(in srgb, var(--md-sys-color-primary) 26%, transparent),
      color-mix(in srgb, var(--md-sys-color-primary) 9%, transparent) 58%,
      transparent 82%
    ),
    /* 首页式的浅色光团：偏 #baaebb，为画面加一层明暗纵深。
       一并改用 closest-side，保证四周未到边缘就已透明，不留矩形硬边。 */
    radial-gradient(
      closest-side at 50% 62%,
      color-mix(in srgb, var(--md-sys-color-surface) 45%, #baaebb) 0%,
      color-mix(in srgb, var(--md-sys-color-surface) 80%, #baaebb) 45%,
      transparent 80%
    );
}

/* 点阵：首页同款，径向遮罩只让立绘附近显形，向外淡出（closest-side 保证不触边） */
.character-dots {
  position: absolute;
  inset: -8% -16% -8% -18%;
  z-index: 0;
  pointer-events: none;
  background-image: radial-gradient(
    circle at 1px 1px,
    color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent) 1.35px,
    transparent 1.65px
  );
  background-size: 22px 22px;
  -webkit-mask-image: radial-gradient(closest-side at 50% 45%, #000, transparent 80%);
  mask-image: radial-gradient(closest-side at 50% 45%, #000, transparent 80%);
}

/* ResponsiveImage 内部用 <picture>（display:contents）包裹，
   尺寸样式需穿透到真正的 <img> */
:deep(.sheet-image) {
  /* 双列时填满立绘列：行高由左栏内容决定，避免设定图自身把整行拉高；
     contain 保证宽/高任一先到极限都不变形。
     顶对齐：行高大于图片自然高度时，透明信箱只落在底部，立绘顶在
     任意分辨率都贴齐 figure 顶，不会因垂直居中而随分辨率漂移。 */
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: top center;
  background-size: contain;
  background-position: top center;
}

.character-figure figcaption {
  color: var(--md-sys-color-on-surface-variant);
  padding-bottom: 4px;
}

/* 「查看立绘」与「下载立绘」并排，换行时居中 */
.character-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

/* 断点与 AppBar / NavigationRail / SectionShell 对齐（窄屏或触屏竖屏），
   避免出现「桌面导轨 + 单列内容」的错配 */
@media (max-width: 860px), (pointer: coarse) and (orientation: portrait) {
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

/* 平板竖屏：宽度足够，恢复两栏（信息 + 立绘），避免首屏只剩一张大设定图 */
@media (pointer: coarse) and (orientation: portrait) and (min-width: 700px) {
  .character-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  }

  .character-figure {
    order: 0;
  }

  :deep(.sheet-image) {
    width: 100%;
    height: 100%;
    max-height: 100%;
    object-position: top center;
  }
}

/* 矮屏（横屏手机 / 小窗口）：满宽设定图会过高，收回高度上限保证可用 */
@media (max-width: 860px) and (max-height: 720px),
  (pointer: coarse) and (orientation: portrait) and (max-height: 720px) {
  :deep(.sheet-image) {
    width: auto;
    max-height: 48dvh;
    /* 图片此时不再是满宽，而 <img> 是块级元素、默认靠左；
       用自动外边距把它在 .character-media 里水平居中。 */
    margin-inline: auto;
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
    object-position: top center;
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
