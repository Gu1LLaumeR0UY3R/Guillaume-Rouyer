<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, setCsrf } from '../../admin/api.js'
import './adminForm.css'

const router = useRouter()
const password = ref('')
const code = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''; busy.value = true
  try {
    setCsrf((await api('/api/admin/login', { method: 'POST', body: { password: password.value, code: code.value } })).csrf)
    router.push('/admin/tableau')
  } catch (e) {
    error.value = e.message
    code.value = ''
  } finally { busy.value = false; password.value = '' }
}
</script>

<template>
  <div class="admin">
    <h1>Administration</h1>
    <p>Accès réservé.</p>
    <form @submit.prevent="submit">
      <label>Mot de passe<input v-model="password" type="password" autocomplete="current-password" required maxlength="128" /></label>
      <label>Code à 6 chiffres<input v-model="code" inputmode="numeric" pattern="\d{6}" autocomplete="one-time-code" required maxlength="6" /></label>
      <p v-if="error" class="err" role="alert">{{ error }}</p>
      <button class="btn btn-primary" :disabled="busy">Se connecter</button>
    </form>
  </div>
</template>
