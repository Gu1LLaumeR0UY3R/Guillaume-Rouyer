import { loadProjects } from './content/projects.js'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import '@fontsource-variable/inter'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/cinzel'
import '@fontsource/noto-sans-runic/400.css'
import '@fontsource-variable/playfair-display'
import '@fontsource-variable/playfair-display/wght-italic.css'
import '@fontsource-variable/dm-sans'
import './styles/base.css'
import './styles/motion.css'
import { reveal } from './directives/reveal.js'
import { initStats } from './stats.js'

loadProjects()
createApp(App).directive('reveal', reveal).use(router).mount('#app')
initStats(router)
