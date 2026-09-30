/**
 * 站点级配置。
 *
 * SITE_URL 在确定托管方案后填写（例如 https://ragyo.example.com）。
 * 未填写时：
 *   - hreflang 与 canonical 退化为相对路径
 *   - OGP 图片地址退化为相对路径（部分抓取器不支持，属已知取舍）
 * 填写后这些标签会自动切换为绝对地址。
 */
export const SITE_URL: string | null = null

/** 三语 OGP 图输出目录，由 scripts/gen-og.mjs 生成 */
export const OG_IMAGE_DIR = '/og'

/** 三语 OGP 图尺寸 */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 }
