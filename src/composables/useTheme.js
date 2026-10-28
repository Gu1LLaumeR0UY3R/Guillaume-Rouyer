import { ref, watchEffect } from 'vue'

// Le site démarre toujours en mode clair ; le choix n'est pas mémorisé.
const theme = ref('light')

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
})

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
  return { theme, toggle }
}
