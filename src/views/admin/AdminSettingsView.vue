<script setup>
// Réglages globaux : e-mail et liens de contact, pied de page, maintenance de tout le site.
import { onMounted, reactive, ref } from 'vue'
import { api } from '../../admin/api.js'
import { toast } from '../../admin/toasts.js'
import ToggleSwitch from './ToggleSwitch.vue'
import './adminForm.css'

const f = reactive({ contactEmail: '', githubUrl: '', linkedinUrl: '', footerText: '', maintenanceOn: false, maintenanceMessage: '', availOn: false, availDays: [], availDuration: 30, availNote: '' })
const pick = (s) => Object.fromEntries(Object.keys(f).map((k) => [k, s[k]])) // cette page ne gère pas l'annonce
const error = ref('')
const busy = ref(false)

onMounted(async () => {
  try { Object.assign(f, pick((await api('/api/admin/settings')).settings)) } catch (e) { error.value = e.message }
})

// Plages de disponibilité : un jour de la semaine + une heure de début et de fin (heure de Paris)
const DAYS = [[1, 'Lundi'], [2, 'Mardi'], [3, 'Mercredi'], [4, 'Jeudi'], [5, 'Vendredi'], [6, 'Samedi'], [0, 'Dimanche']]
const addWindow = () => { if (f.availDays.length < 14) f.availDays.push({ dow: 1, start: '14:00', end: '17:00' }) }
const removeWindow = (i) => f.availDays.splice(i, 1)

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

      <fieldset>
        <legend>Disponibilités pour échanger</legend>
        <ToggleSwitch v-model="f.availOn" label="Proposer un calendrier sur la page Contact" />
        <p class="hint">Le visiteur choisit un créneau libre dans ces plages, entre 24 h et 6 semaines à l'avance. Un créneau demandé disparaît du calendrier tant que le message n'est pas fermé (dans Messages). Heures de Paris.</p>
        <div v-for="(w, i) in f.availDays" :key="i" class="win">
          <label>Jour<select v-model.number="w.dow"><option v-for="[d, n] in DAYS" :key="d" :value="d">{{ n }}</option></select></label>
          <label>De<input v-model="w.start" type="time" required></label>
          <label>À<input v-model="w.end" type="time" required></label>
          <button class="btn btn-ghost small" type="button" :aria-label="`Supprimer la plage ${i + 1}`" @click="removeWindow(i)">Supprimer</button>
        </div>
        <button class="btn btn-ghost small" type="button" :disabled="f.availDays.length >= 14" @click="addWindow">Ajouter une plage</button>
        <label>Durée d'un créneau
          <select v-model.number="f.availDuration"><option :value="15">15 minutes</option><option :value="30">30 minutes</option><option :value="45">45 minutes</option><option :value="60">1 heure</option></select>
        </label>
        <label>Note affichée sous le titre<input v-model="f.availNote" maxlength="200" placeholder="Visio ou appel, 30 minutes." /></label>
      </fieldset>

      <p v-if="error" class="err" role="alert">{{ error }}</p>
      <div class="bar"><button class="btn btn-primary" :disabled="busy">Enregistrer</button></div>
    </form>
  </div>
</template>

<style scoped>
.win{display:flex;flex-wrap:wrap;gap:10px;align-items:end}
.win label{min-width:120px}
</style>
