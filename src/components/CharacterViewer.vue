<script setup lang="ts">
/**
 * 角色立绘展示器。
 *
 * 右栏的入口按钮打开一个近全屏弹窗：用三组分段按钮（造型 / 插兜 / 表情）
 * 在 8 套常规立绘间切换，另有「正面 / 背面」独立切换 —— 背面只有单视图，
 * 选中时三组选择器置灰禁用。
 *
 * 立绘支持滚轮缩放、拖拽平移与双指捏合（见 usePanZoom）。打开期间挂起
 * 全屏翻页，避免键盘翻页在弹窗背后换屏。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import M3Button from './M3Button.vue'
import M3Dialog from './M3Dialog.vue'
import M3Icon from './M3Icon.vue'
import ResponsiveImage from './ResponsiveImage.vue'
import SegmentedButton from './SegmentedButton.vue'
import { usePanZoom } from '@/composables/usePanZoom'
import { useScrollContext } from '@/composables/useScrollContext'
import {
  VIEWER_BACK_IMAGE,
  resolveViewerImage,
  type CostumeId,
  type ExpressionId,
  type PoseId,
} from '@/data/assets'

type FacingId = 'front' | 'back'

const { t } = useI18n()
const { suspended } = useScrollContext()

const open = ref(false)
const facing = ref<FacingId>('front')
const costume = ref<CostumeId>('costume-1')
const pose = ref<PoseId>('pockets')
const expression = ref<ExpressionId>('smile')

const isBack = computed(() => facing.value === 'back')

const imageKey = computed(() =>
  isBack.value ? VIEWER_BACK_IMAGE : resolveViewerImage(costume.value, pose.value, expression.value),
)

/* 选项用字面量 i18n 键构造，避免模板里拼动态键；
   value 显式标注为对应的 Id 类型，防止值与解析键不一致（曾把 'open-mouth' 写成 'openMouth'） */
const costumeOptions = computed<{ value: CostumeId; label: string }[]>(() => [
  { value: 'costume-1', label: t('character.viewer.costume1') },
  { value: 'costume-2', label: t('character.viewer.costume2') },
])
const poseOptions = computed<{ value: PoseId; label: string }[]>(() => [
  { value: 'pockets', label: t('character.viewer.posePockets') },
  { value: 'natural', label: t('character.viewer.poseNatural') },
])
const expressionOptions = computed<{ value: ExpressionId; label: string }[]>(() => [
  { value: 'smile', label: t('character.viewer.expressionSmile') },
  { value: 'open-mouth', label: t('character.viewer.expressionOpen') },
])
const facingOptions = computed<{ value: FacingId; label: string }[]>(() => [
  { value: 'front', label: t('character.viewer.facingFront') },
  { value: 'back', label: t('character.viewer.facingBack') },
])

const setCostume = (value: string) => {
  costume.value = value as CostumeId
}
const setPose = (value: string) => {
  pose.value = value as PoseId
}
const setExpression = (value: string) => {
  expression.value = value as ExpressionId
}
const setFacing = (value: string) => {
  facing.value = value as FacingId
}

const labelOf = (options: readonly { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? ''

const alt = computed(() =>
  isBack.value
    ? t('character.viewer.altBack')
    : t('character.viewer.altFront', {
        costume: labelOf(costumeOptions.value, costume.value),
        pose: labelOf(poseOptions.value, pose.value),
        expression: labelOf(expressionOptions.value, expression.value),
      }),
)

/* -------------------- 平移 / 缩放 -------------------- */

const stage = ref<HTMLElement | null>(null)
const { scale, x, y, dragging, reset, zoomBy } = usePanZoom(stage, { min: 1, max: 6 })

const transformStyle = computed(() => ({
  transform: `translate3d(${x.value}px, ${y.value}px, 0) scale(${scale.value})`,
}))

// 换选项 / 切正面背面都保留当前的缩放与平移，只做交叉淡入；
// 每次打开弹窗时才回到适应视图。
watch(open, (value) => {
  suspended.value = value
  if (value) reset()
})

onBeforeUnmount(() => {
  if (open.value) suspended.value = false
})
</script>

<template>
  <M3Button variant="outlined" icon="open_in_full" @click="open = true">
    {{ t('character.viewer.open') }}
  </M3Button>

  <M3Dialog
    :open="open"
    :label="t('character.viewer.title')"
    size="full"
    @close="open = false"
  >
    <div class="viewer">
      <h3 class="viewer-title md-title-medium">{{ t('character.viewer.title') }}</h3>

      <div class="viewer-controls">
        <div class="control">
          <span class="control-label md-label-medium">{{ t('character.viewer.facingLabel') }}</span>
          <SegmentedButton
            :options="facingOptions"
            :model-value="facing"
            :aria-label="t('character.viewer.facingLabel')"
            @update:model-value="setFacing"
          />
        </div>

        <div class="control">
          <span class="control-label md-label-medium">{{ t('character.viewer.costumeLabel') }}</span>
          <SegmentedButton
            :options="costumeOptions"
            :model-value="costume"
            :disabled="isBack"
            :aria-label="t('character.viewer.costumeLabel')"
            @update:model-value="setCostume"
          />
        </div>

        <div class="control">
          <span class="control-label md-label-medium">{{ t('character.viewer.poseLabel') }}</span>
          <SegmentedButton
            :options="poseOptions"
            :model-value="pose"
            :disabled="isBack"
            :aria-label="t('character.viewer.poseLabel')"
            @update:model-value="setPose"
          />
        </div>

        <div class="control">
          <span class="control-label md-label-medium">
            {{ t('character.viewer.expressionLabel') }}
          </span>
          <SegmentedButton
            :options="expressionOptions"
            :model-value="expression"
            :disabled="isBack"
            :aria-label="t('character.viewer.expressionLabel')"
            @update:model-value="setExpression"
          />
        </div>
      </div>

      <p v-if="isBack" class="viewer-note md-body-small" role="status">
        {{ t('character.viewer.backNote') }}
      </p>

      <div
        ref="stage"
        class="viewer-stage"
        :class="{ 'is-dragging': dragging }"
      >
        <Transition name="variant" mode="out-in">
          <div :key="imageKey" class="viewer-layer" :style="transformStyle">
            <ResponsiveImage
              :image-key="imageKey"
              :alt="alt"
              :eager="true"
              sizes="(max-width: 600px) 92vw, (max-width: 1120px) 60vw, 720px"
              class="viewer-image"
              draggable="false"
            />
          </div>
        </Transition>
      </div>

      <div class="viewer-foot">
        <span class="viewer-hint md-body-small">{{ t('character.viewer.hint') }}</span>

        <div class="viewer-zoom">
          <button
            v-ripple
            class="zoom-button md-state-layer"
            type="button"
            :aria-label="t('character.viewer.zoomOut')"
            @click="zoomBy(-0.5)"
          >
            <M3Icon name="zoom_out" :size="20" />
          </button>
          <button
            v-ripple
            class="zoom-button md-state-layer"
            type="button"
            :aria-label="t('character.viewer.reset')"
            @click="reset"
          >
            <M3Icon name="refresh" :size="20" />
          </button>
          <button
            v-ripple
            class="zoom-button md-state-layer"
            type="button"
            :aria-label="t('character.viewer.zoomIn')"
            @click="zoomBy(0.5)"
          >
            <M3Icon name="zoom_in" :size="20" />
          </button>
        </div>
      </div>
    </div>
  </M3Dialog>
</template>

<style scoped>
.viewer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  /* 右上角为 M3Dialog 的关闭按钮留白 */
  padding: 20px 20px 16px;
}

.viewer-title {
  margin: 0;
  padding-right: 44px;
  color: var(--md-sys-color-on-surface);
}

/* 四组都是「2 个选项」的短选择器，按内容宽度紧凑左对齐、窄屏换行即可，
   不再用会把选择器拉满列宽的等分网格 */
.viewer-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px 20px;
}

.control {
  display: flex;
  flex-direction: column;
  gap: 6px;
  /* 关键：阻止 .segmented 被拉伸到容器宽度，只占两个选项的宽度 */
  align-items: flex-start;
}

.control-label {
  color: var(--md-sys-color-on-surface-variant);
}

.viewer-note {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.viewer-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: var(--md-sys-shape-corner-large);
  /* 沿用首页那套背景（见 HeroSection.vue）：暗→浅(#baaebb)线性渐变 +
     主色/第三色径向光晕 + 点阵。立绘暗部与背景近乎同色，靠光晕拉开轮廓。 */
  background: linear-gradient(
    180deg,
    var(--md-sys-color-surface) 0%,
    var(--md-sys-color-surface) 48%,
    color-mix(in srgb, var(--md-sys-color-surface) 62%, #baaebb) 68%,
    color-mix(in srgb, var(--md-sys-color-surface) 12%, #baaebb) 86%,
    #baaebb 100%
  );
  isolation: isolate;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

/* 光晕层：中央主色把人像从暗色顶部托出，右上/左下两团给纯色渐变加纵深 */
.viewer-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(
      closest-side at 50% 44%,
      color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent),
      color-mix(in srgb, var(--md-sys-color-primary) 7%, transparent) 58%,
      transparent 82%
    ),
    radial-gradient(
      120% 80% at 88% 16%,
      color-mix(in srgb, var(--md-sys-color-primary) 24%, transparent),
      transparent 60%
    ),
    radial-gradient(
      90% 70% at 8% 90%,
      color-mix(in srgb, var(--md-sys-color-tertiary) 20%, transparent),
      transparent 65%
    );
}

/* 点阵层：径向遮罩只让中部显形 */
.viewer-stage::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image: radial-gradient(
    circle at 1px 1px,
    color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent) 1.35px,
    transparent 1.65px
  );
  background-size: 22px 22px;
  -webkit-mask-image: radial-gradient(75% 65% at 50% 42%, #000, transparent 78%);
  mask-image: radial-gradient(75% 65% at 50% 42%, #000, transparent 78%);
}

.viewer-stage.is-dragging {
  cursor: grabbing;
}

.viewer-layer {
  position: absolute;
  inset: 0;
  /* 压在光晕与点阵之上 */
  z-index: 1;
  transform-origin: center;
  will-change: transform;
}

/* 图片只作被变换的层；指针事件交给舞台统一处理 */
:deep(.viewer-image) {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  background-size: contain;
  background-position: center;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.viewer-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.viewer-hint {
  color: var(--md-sys-color-on-surface-variant);
}

.viewer-zoom {
  display: flex;
  gap: 4px;
}

.zoom-button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface-variant);
}

/* 换图时的交叉淡入 */
.variant-enter-active,
.variant-leave-active {
  transition: opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.variant-enter-from,
.variant-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .viewer {
    gap: 10px;
    padding: 14px 12px 12px;
  }

  .viewer-hint {
    font-size: 0.75rem;
  }
}
</style>
