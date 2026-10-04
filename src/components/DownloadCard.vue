<script setup lang="ts">
/**
 * 下载渠道卡片。
 *
 * 本站不自建文件托管，只提供网盘链接，因此这里没有文件校验、断点续传等信息，
 * 改为呈现版本号与打包日期，并在链接未就绪时渲染为「准备中」而不是死链。
 */
import { useI18n } from 'vue-i18n'
import M3Card from './M3Card.vue'
import M3Icon from './M3Icon.vue'
import CopyChip from './CopyChip.vue'
import type { Mirror } from '@/data/downloads'

defineProps<{
  mirrors: Mirror[]
  /** 当前语言是否为中文。非中文时提示国内网盘，中文时提示 Google Drive */
  isChinese: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <M3Card class="download-card" padding="none">
    <ul class="mirror-list">
      <li v-for="mirror in mirrors" :key="mirror.platform" class="mirror-row">
        <div class="mirror-main">
          <M3Icon name="download" :size="20" class="mirror-icon" />
          <div class="mirror-text">
            <span class="mirror-name md-title-medium">{{ t(`download.platforms.${mirror.platform}`) }}</span>
          </div>
        </div>

        <div class="mirror-actions">
          <CopyChip
            v-if="mirror.code"
            :label="t('download.extractCode')"
            :value="mirror.code"
          />

          <a
            v-if="mirror.url"
            v-ripple
            class="mirror-open md-state-layer md-label-large"
            :href="mirror.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>{{ t('download.open') }}</span>
            <M3Icon name="open_in_new" :size="18" />
          </a>

          <span v-else class="mirror-pending md-label-large">
            {{ t('common.pending') }}
          </span>
        </div>

        <p v-if="!isChinese && mirror.mainlandOnly" class="mirror-hint md-body-small">
          {{ t('download.overseasHint', { platform: t(`download.platforms.${mirror.platform}`) }) }}
        </p>
        <p v-else-if="isChinese && !mirror.mainlandOnly" class="mirror-hint md-body-small">
          {{ t('download.gdriveHint') }}
        </p>
      </li>
    </ul>
  </M3Card>
</template>

<style scoped>
.download-card {
  overflow: hidden;
}

.mirror-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mirror-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 16px 24px;
  min-height: 72px;
}

.mirror-row + .mirror-row {
  box-shadow: inset 0 1px 0 var(--md-sys-color-outline-variant);
}

.mirror-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.mirror-icon {
  color: var(--md-sys-color-primary);
}

.mirror-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mirror-hint {
  /* 独占一行显示在下方，避免把「打开」按钮挤到下一行 */
  flex-basis: 100%;
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.mirror-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  /* 始终靠右，即使换行也不会跑到左侧 */
  margin-left: auto;
  /* 窄屏换行成整行后，内容也贴右，「打开」固定在最右侧 */
  justify-content: flex-end;
}

.mirror-open {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 20px;
  border-radius: var(--md-sys-shape-corner-full);
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  white-space: nowrap;
}

.mirror-pending {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 20px;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface-variant);
  box-shadow: inset 0 0 0 1px var(--md-sys-color-outline-variant);
  white-space: nowrap;
}

@media (max-width: 600px) {
  .mirror-row {
    align-items: flex-start;
  }

  .mirror-actions {
    width: 100%;
  }
}
</style>
