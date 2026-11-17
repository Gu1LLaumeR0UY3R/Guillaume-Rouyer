<script setup>
// Réglages globaux : e-mail et liens de contact, pied de page, maintenance de tout le site.
import { onMounted, reactive, ref } from 'vue'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import ToggleSwitch from './ToggleSwitch.vue'
import './adminForm.css'

const f = reactive({ contactEmail: '', githubUrl: '', linkedinUrl: '', footerText: '', maintenanceOn: false, maintenanceMessage: '' })
const pick = (s) => Object.fromEntries(Object.keys(f).map((k) => [k, s[k]])) // cette page ne gère pas l'annonce
const error = ref('')
const busy = ref(false)

onMounted(async () => {
  try { Object.assign(f, pick((await api('/api/admin/settings')).settings)) } catch (e) { error.value = e.message }
})

async function save() {
  if (f.maintenanceOn && !window.confirm('La maintenance de tout le site sera ACTIVE : les visiteurs ne verront que la page de maintenance. Continuer ?')) return
  error.value = ''; busy.value = true
  try {
    Object.assign(f, pick((await api('/api/admin/settings', { method: 'PUT', body: { ...f } })).settings))
    toast('Réglages enregistrés. Ils apparaissent sur le site en quelques secondes.', 'ok')
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
</script>

<template>
  <div class="admin wide narrow">
    <h1>Réglages</h1>
    <p>Ces informations sont lues par le site : si ton e-mail change, tu le modifies ici, pas dans le code.</p>

    <form @submit.prevent="save">
      <fieldset>
        <legend>Contact</legend>
        <label>E-mail de contact<input v-model="f.contactEmail" type="email" maxlength="254" placeholder="prenom.nom@exemple.fr" /><span class="hint">Laisse vide pour ne pas afficher d'e-mail.</span></label>
        <label>Lien GitHub<input v-model="f.githubUrl" type="url" maxlength="200" placeholder="https://github.com/…" /></label>
        <label>Lien LinkedIn<input v-model="f.linkedinUrl" type="url" maxlength="200" placeholder="https://www.linkedin.com/in/…" /></label>
      </fieldset>

      <fieldset>
        <legend>Pied de page</legend>
        <label>Texte<input v-model="f.footerText" maxlength="200" /></label>
      </fieldset>

      <fieldset>
        <legend>Maintenance de tout le site</legend>
        <ToggleSwitch v-model="f.maintenanceOn" label="Site en maintenance" />
        <p class="hint">Quand elle est active, les visiteurs ne voient que la page de maintenance. Toi, connecté, tu vois toujours le site (avec un rappel). Pour mettre un seul projet en maintenance, utilise l'interrupteur de la page Projets.</p>
        <label>Message affiché aux visiteurs<textarea v-model="f.maintenanceMessage" maxlength="300" placeholder="Le site revient très bientôt." /></label>
      </fieldset>

      <p v-if="error" class="err" role="alert">{{ error }}</p>
      <div class="bar"><button class="btn btn-primary" :disabled="busy">Enregistrer</button></div>
    </form>
  </div>
</template>
