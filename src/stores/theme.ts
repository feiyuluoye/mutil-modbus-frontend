import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  // 从localStorage读取主题设置，默认为浅色
  const mode = ref<ThemeMode>((localStorage.getItem('theme-mode') as ThemeMode) || 'light')

  // 应用主题
  const applyTheme = (theme: ThemeMode) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark-theme')
    }
  }

  // 切换主题
  const toggleTheme = () => {
    mode.value = mode.value === 'light' ? 'dark' : 'light'
  }

  // 设置主题
  const setTheme = (theme: ThemeMode) => {
    mode.value = theme
  }

  // 监听主题变化，保存到localStorage并应用
  watch(mode, (newMode) => {
    localStorage.setItem('theme-mode', newMode)
    applyTheme(newMode)
  }, { immediate: true })

  return {
    mode,
    toggleTheme,
    setTheme,
  }
})
