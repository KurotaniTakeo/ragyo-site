/**
 * 全屏滚动的分屏定义。
 *
 * 顺序即页面顺序，id 同时用于：
 *   - 锚点深链（#download）
 *   - Navigation rail 的当前项高亮
 *   - i18n 的 nav.<id> 与 sections.<id>.*
 */
import type { IconName } from '@/components/icons'

export interface SectionDef {
  id: string
  icon: IconName
  /** 内容是否可能超过一屏，需要内部滚动 */
  scrollable?: boolean
}

export const sections: SectionDef[] = [
  { id: 'hero', icon: 'home' },
  { id: 'about', icon: 'info' },
  { id: 'samples', icon: 'graphic_eq' },
  { id: 'character', icon: 'person' },
  { id: 'terms', icon: 'gavel', scrollable: true },
  { id: 'download', icon: 'download' },
  { id: 'changelog', icon: 'history', scrollable: true },
  { id: 'credits', icon: 'favorite', scrollable: true },
  { id: 'surprise', icon: 'auto_awesome' },
]

export type SectionId = (typeof sections)[number]['id']

export const sectionIds = sections.map((s) => s.id)

export const isSectionId = (value: string): value is SectionId =>
  sectionIds.includes(value as SectionId)
