import { ref, watchEffect } from 'vue'

const theme = ref(document.documentElement.dataset.theme || 'light')

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
})

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem('theme', theme.value) } catch { /* stockage indisponible */ }
  }
  return { theme, toggle }
}
