import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import '@fontsource-variable/inter'
import '@fontsource-variable/fraunces'
import './styles/base.css'
import './styles/motion.css'
import { reveal } from './directives/reveal.js'

createApp(App).directive('reveal', reveal).use(router).mount('#app')
