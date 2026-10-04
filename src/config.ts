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

/**
 * 中国大陆 ICP 备案号（当前为占位数据，格式与真实备案号一致）。
 *
 * 显示规则：
 *   - 移动端 / 平板竖屏：仅首屏展示；
 *   - 电脑端横屏：所有页面常驻左下角。
 * 取得正式备案号后替换此字符串，并把 ICP_IS_PLACEHOLDER 改为 false 即可，链接指向 ICP_URL。
 */
export const ICP_LICENSE: string | null = '京ICP备2026000000号-1'

/** 当前 ICP_LICENSE 是否为占位数据；为 true 时在备案号后括号注明「占位」 */
export const ICP_IS_PLACEHOLDER = true

/** 工信部备案管理系统（备案号链接指向此处） */
export const ICP_URL = 'https://beian.miit.gov.cn/'
