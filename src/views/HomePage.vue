<script setup lang="ts">
/**
 * 单页视图：按顺序渲染 9 个全屏分屏。
 *
 * 这里不持有滚动状态 —— 滚动容器在 App.vue，
 * 本组件只通过 inject 拿到当前屏序号来决定哪一屏处于 active。
 */
import { computed } from 'vue'
import { useScrollContext } from '@/composables/useScrollContext'
import HeroSection from '@/sections/HeroSection.vue'
import AboutSection from '@/sections/AboutSection.vue'
import SamplesSection from '@/sections/SamplesSection.vue'
import CharacterSection from '@/sections/CharacterSection.vue'
import TermsSection from '@/sections/TermsSection.vue'
import DownloadSection from '@/sections/DownloadSection.vue'
import ChangelogSection from '@/sections/ChangelogSection.vue'
import CreditsSection from '@/sections/CreditsSection.vue'
import SurpriseSection from '@/sections/SurpriseSection.vue'

const { activeIndex, goToId } = useScrollContext()

const isActive = (index: number) => computed(() => activeIndex.value === index)

const heroActive = isActive(0)
const aboutActive = isActive(1)
const samplesActive = isActive(2)
const characterActive = isActive(3)
const termsActive = isActive(4)
const downloadActive = isActive(5)
const changelogActive = isActive(6)
const creditsActive = isActive(7)
const surpriseActive = isActive(8)
</script>

<template>
  <main id="main">
    <HeroSection :active="heroActive" @navigate="goToId" />
    <AboutSection :active="aboutActive" />
    <SamplesSection :active="samplesActive" />
    <CharacterSection :active="characterActive" />
    <TermsSection :active="termsActive" />
    <DownloadSection :active="downloadActive" />
    <ChangelogSection :active="changelogActive" />
    <CreditsSection :active="creditsActive" />
    <SurpriseSection :active="surpriseActive" />
  </main>
</template>
