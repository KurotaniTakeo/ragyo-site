/**
 * 更新日志的结构化数据：各版本附带的配布链接。
 *
 * 说明性文案（notes）是散文，放在 src/i18n/locales/*.json 的 changelog.entries；
 * 这里只放不随语言变化的版本号与 URL。版本号与 i18n 条目一一对应。
 */
export interface ChangelogLink {
  /** 平台名，作为专有名词不参与翻译 */
  platform: 'Bilibili' | 'X'
  url: string
}

/** 版本号 → 该版本的配布链接 */
export const changelogLinks: Record<string, ChangelogLink[]> = {
  '1.0': [
    { platform: 'Bilibili', url: 'https://t.bilibili.com/1253796323482665025' },
    { platform: 'X', url: 'https://x.com/Luowei_Roui/status/2105578327914561893?s=20' },
  ],
}
