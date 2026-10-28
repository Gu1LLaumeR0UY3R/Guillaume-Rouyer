<script setup>
import { useTheme } from '../composables/useTheme.js'

const { theme, toggle } = useTheme()
</script>

<template>
  <button class="btn btn-ghost" type="button" :aria-pressed="theme === 'dark'" @click="toggle">
    {{ theme === 'dark' ? 'Mode clair' : 'Mode sombre' }}
  </button>
</template>
