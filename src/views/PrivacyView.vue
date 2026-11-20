<script setup>
import { computed, ref } from 'vue'
import LegalLayout from '../components/LegalLayout.vue'
import RichText from '../components/RichText.vue'
import { useBlock } from '../content/blocks.js'
import { PRIVACY_DEFAULT } from '../content/legalDefaults.js'
import { isOptedOut, optOutStored, setOptOut } from '../stats.js'

const { data, ready } = useBlock('privacy')
const page = computed(() => data.value ?? PRIVACY_DEFAULT)

const off = ref(optOutStored())
const auto = isOptedOut() && !off.value // « Do Not Track » ou « Global Privacy Control » déjà actifs dans ton navigateur
function toggleOff() { off.value = !off.value; setOptOut(off.value) }
</script>

<template>
  <LegalLayout v-if="ready" title="Politique de confidentialité" :updated="page.updated">
    <template v-for="s in page.sections" :key="s.title">
      <h2>{{ s.title }}</h2>
      <RichText :body="s.body">
        <template #widget>
          <p v-if="auto" class="auto">Ton navigateur envoie déjà ce refus : tu n'es pas compté.</p>
          <p>
            <button class="btn btn-ghost" type="button" :aria-pressed="off" @click="toggleOff">
              {{ off ? 'Je ne suis pas compté (cliquer pour accepter)' : 'Ne pas me compter' }}
            </button>
          </p>
        </template>
      </RichText>
    </template>
  </LegalLayout>
</template>
