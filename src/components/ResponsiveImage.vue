<script setup lang="ts">
/**
 * 响应式立绘。
 *
 * 立绘原稿是 9927×14720 的透明底 PNG，直接使用会拖垮首屏，
 * 因此一律引用 scripts/gen-images.mjs 派生的多档位 AVIF / WebP，
 * 并把 20px 的 LQIP 作为背景色垫在下面，避免加载完成前的空洞。
 *
 * LQIP 必须在本体加载完成后撤掉：立绘是透明底，放大后的模糊剪影会从
 * 边缘与发丝缝隙里透出来，看起来像一圈「神秘影子」。
 *
 * 外层用 <picture> 声明 AVIF 与 WebP 两个 <source>，由浏览器挑格式；
 * 传入的 class / 属性（如 hero-image、sheet-image）通过 v-bind="$attrs"
 * 落在真正的 <img> 上，保证既有布局样式不失效。外层 display:contents
 * 让 <img> 直接参与父级 flex/grid，百分比高度仍能正确解析。
 */
import { computed, onMounted, ref } from 'vue'
import { getImage, type ImageKey } from '@/data/assets'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    imageKey: ImageKey
    /** 无障碍描述；装饰性图片传空字符串 */
    alt: string
    /** 与 CSS 布局一致的 sizes 提示，用于让浏览器挑对尺寸 */
    sizes?: string
    /** 首屏图片应设为 true，会提升优先级并关闭懒加载 */
    eager?: boolean
    /** 宽高比容器，避免图片加载完成时布局跳动 */
    fit?: 'contain' | 'cover'
  }>(),
  { sizes: '100vw', eager: false, fit: 'contain' },
)

const image = computed(() => getImage(props.imageKey))

const imgEl = ref<HTMLImageElement | null>(null)
const loaded = ref(false)

onMounted(() => {
  // 命中缓存时 load 事件可能早于监听绑定，需要主动查一次 complete。
  if (imgEl.value?.complete) loaded.value = true
})
</script>

<template>
  <picture class="responsive-picture">
    <source type="image/avif" :srcset="image.avifSrcset" :sizes="sizes" />
    <source type="image/webp" :srcset="image.srcset" :sizes="sizes" />
    <img
      ref="imgEl"
      v-bind="$attrs"
      class="responsive-image"
      :class="[`fit-${fit}`, { 'is-loading': !loaded }]"
      :src="image.src"
      :srcset="image.srcset"
      :sizes="sizes"
      :width="image.width"
      :height="image.height"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
      :style="loaded ? null : { backgroundImage: `url(${image.lqip})` }"
      @load="loaded = true"
    />
  </picture>
</template>

<style scoped>
/* 让 <img> 取代 <picture> 直接参与父级布局（flex/grid 子项、百分比高度） */
.responsive-picture {
  display: contents;
}

.responsive-image {
  width: 100%;
  height: auto;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* LQIP 是 20px 宽的极低清占位图，直接拉伸会是一大块马赛克；
   加载完成前用模糊把它柔化，加载后（.is-loading 移除）恢复清晰。 */
.responsive-image.is-loading {
  filter: blur(20px);
}

.fit-contain {
  object-fit: contain;
}

.fit-cover {
  height: 100%;
  object-fit: cover;
}
</style>
