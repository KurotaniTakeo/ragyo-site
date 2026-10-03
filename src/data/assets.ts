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

/** Hero 主视觉：公式1・半身像・红色领带清晰（放大展示） */
export const HERO_IMAGE = 'character.pockets-smile-costume-1-bust' satisfies ImageKey

/** 公式1（红领带）・手插兜・闭嘴微笑 */
export const COSTUME_1_IMAGE = 'character.pockets-smile-costume-1' satisfies ImageKey

/** 公式2（无领带黑衬衫）・手插兜・闭嘴微笑 */
export const COSTUME_2_IMAGE = 'character.pockets-smile-costume-2' satisfies ImageKey

/** 设定图：正面 + 背面双视图 */
export const SHEET_IMAGE = 'character.front-back' satisfies ImageKey

/** 角色画廊 */
export const GALLERY_IMAGES = [
  'character.pockets-smile-costume-1',
  'character.pockets-smile-costume-2',
  'character.front-back',
] satisfies ImageKey[]

/** 表情变体：两套造型各自的手插兜张嘴 / 非插兜微笑 / 非插兜张嘴 */
export const VARIANT_IMAGES = [
  'character.pockets-open-mouth-costume-1',
  'character.pockets-open-mouth-costume-2',
  'character.smile-costume-1',
  'character.smile-costume-2',
  'character.open-mouth-costume-1',
  'character.open-mouth-costume-2',
] satisfies ImageKey[]

export const getImage = (key: ImageKey): GeneratedImage => images[key]
