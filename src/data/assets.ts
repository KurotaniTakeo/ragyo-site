/**
 * 图像资产的语义化入口。
 *
 * 立绘原稿以 assets/illustration/character/*.png 的英文名命名（如
 * pockets-smile-costume-1.png），作者后续可能改名，因此业务代码一律通过这里的
 * 语义化键引用，不出现具体文件名。命名规范与中文原名对照见
 * assets/illustration/character/README.md；
 * 文件名与派生规则的唯一事实来源是 scripts/assets.manifest.json。
 */
import { images, type GeneratedImage, type ImageKey } from './assets.generated'

export { images }
export type { GeneratedImage, ImageKey }

/** Hero 主视觉：公式2・非插兜・闭嘴的发光版本（柔和发光取代硬描边；下半身由前端裁剪隐藏，不裁素材） */
export const HERO_IMAGE = 'character.smile-costume-2-glow' satisfies ImageKey

/** Hero 背景：背面立绘，半透明叠在主视觉右后方 */
export const HERO_BACKDROP_IMAGE = 'character.back-view' satisfies ImageKey

/** 设定图：正面 + 背面双视图 */
export const SHEET_IMAGE = 'character.front-back' satisfies ImageKey

export const getImage = (key: ImageKey): GeneratedImage => images[key]

/* ------------------------------------------------------------------
 * 立绘展示器（CharacterViewer）
 *
 * 常规立绘的「造型 × 插兜 × 表情」2×2×2 组合全部有稿，因此三个选择器
 * 任意组合都能解析到一张图，无需回退。背面立绘只有一张单视图，没有
 * 上述变体，故由展示器单独切换（见 VIEWER_BACK_IMAGE）。
 * ------------------------------------------------------------------ */

/** 造型：公式1（红领带）/ 公式2（黑毛衣·无领带） */
export type CostumeId = 'costume-1' | 'costume-2'

/** 姿势：pockets 插兜 / natural 自然（非插兜） */
export type PoseId = 'pockets' | 'natural'

/** 表情：smile 闭嘴微笑 / open-mouth 张嘴 */
export type ExpressionId = 'smile' | 'open-mouth'

/**
 * 正面常规立绘的组合矩阵，键为 `${pose}-${expression}-${costume}`。
 * 显式列出而非拼接：既保证类型安全，也让「哪些组合存在」一目了然。
 */
export const VIEWER_FRONT_IMAGES: Record<`${PoseId}-${ExpressionId}-${CostumeId}`, ImageKey> = {
  'pockets-smile-costume-1': 'character.pockets-smile-costume-1',
  'pockets-smile-costume-2': 'character.pockets-smile-costume-2',
  'pockets-open-mouth-costume-1': 'character.pockets-open-mouth-costume-1',
  'pockets-open-mouth-costume-2': 'character.pockets-open-mouth-costume-2',
  'natural-smile-costume-1': 'character.smile-costume-1',
  'natural-smile-costume-2': 'character.smile-costume-2',
  'natural-open-mouth-costume-1': 'character.open-mouth-costume-1',
  'natural-open-mouth-costume-2': 'character.open-mouth-costume-2',
}

/** 背面立绘：单视图，无造型/姿势/表情变体 */
export const VIEWER_BACK_IMAGE = 'character.back-view' satisfies ImageKey

/** 把三个维度解析为具体的立绘语义键 */
export const resolveViewerImage = (
  costume: CostumeId,
  pose: PoseId,
  expression: ExpressionId,
): ImageKey => VIEWER_FRONT_IMAGES[`${pose}-${expression}-${costume}`]
