import { unlock } from '../lib/achievements.js'
// Ouverture de la fenêtre des défis anti-robot avant le téléchargement du CV (voir components/CvGate.vue).
import { ref } from 'vue'

export const cvGateOpen = ref(false)
export const openCv = () => { cvGateOpen.value = true; unlock('cv') }
