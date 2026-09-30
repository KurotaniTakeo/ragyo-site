/**
 * 图像资产的语义化入口。
 *
 * 立绘原稿以 assets/illustration/character/1.png–7.png 命名，作者后续可能改名，
 * 因此业务代码一律通过这里的语义化键引用，不出现具体文件名。
 * 文件名与派生规则的唯一事实来源是 scripts/assets.manifest.json。
 */
import { images, type GeneratedImage, type ImageKey } from './assets.generated'

export { images }
export type { GeneratedImage, ImageKey }

/** Hero 主视觉：服装 B・半身像・红色领带清晰（放大展示） */
export const HERO_IMAGE = 'character.outfit-b-bust' satisfies ImageKey

/** 服装 A・夹克扣起 */
export const OUTFIT_A_IMAGE = 'character.outfit-a' satisfies ImageKey

/** 服装 B・红色领带 */
export const OUTFIT_B_IMAGE = 'character.outfit-b' satisfies ImageKey

/** 设定图：正面 + 背面双视图 */
export const SHEET_IMAGE = 'character.sheet' satisfies ImageKey

/** 角色画廊 */
export const GALLERY_IMAGES = [
  'character.outfit-b',
  'character.outfit-a',
  'character.sheet',
] satisfies ImageKey[]

export const getImage = (key: ImageKey): GeneratedImage => images[key]
