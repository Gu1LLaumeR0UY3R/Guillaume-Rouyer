import { ref, watchEffect } from 'vue'
import { track } from '../stats.js'
import { unlock } from '../lib/achievements.js'

// Le site démarre toujours en mode clair ; le choix n'est pas mémorisé.
const theme = ref('light')

watchEffect(() => {
  document.documentElement.dataset.theme = theme.value
})

export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    if (theme.value === 'dark') unlock('nocturne')
    track.theme(theme.value) // compte seulement le choix (aucun identifiant)
  }
  return { theme, toggle }
}
