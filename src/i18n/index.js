// Traduction légère FR / EN. La langue vient du navigateur (français, sinon anglais) et n'est jamais mémorisée.
import { ref, watchEffect } from 'vue'

export const lang = ref(typeof navigator !== 'undefined' && /^fr/i.test(navigator.language || '') ? 'fr' : 'en')

watchEffect(() => { document.documentElement.lang = lang.value })

export const MESSAGES = {
  fr: {
    skip: 'Aller au contenu',
    'nav.projects': 'Projets', 'nav.about': 'À propos', 'nav.contact': 'Contact',
    'theme.light': 'Mode clair', 'theme.dark': 'Mode sombre', 'lang.label': 'Langue',
    'hero.badge': "Bachelor Concepteur Développeur d'Applications · Full Stack & Cybersécurité",
    'hero.titleA': 'Développeur Web & PHP,', 'hero.titleB': 'full stack',
    'hero.lead': "Guillaume Rouyer, développeur junior curieux et autodidacte. Des API REST aux apps mobiles, jusqu'à une IA locale auto-hébergée sur mon propre serveur Proxmox.",
    'hero.cta': 'Voir mes projets',
    'contactForm.title': 'Ou écris-moi directement ici', 'contactForm.name': 'Nom', 'contactForm.email': 'Adresse e-mail', 'contactForm.subject': 'Sujet (facultatif)', 'contactForm.message': 'Message',
    'contactForm.send': 'Envoyer', 'contactForm.sending': 'Envoi…', 'contactForm.sentTitle': 'Message envoyé', 'contactForm.sentText': 'Merci ! Je te réponds dès que possible.', 'contactForm.again': 'Envoyer un autre message',
    'contactForm.privacy': "Ton message n'est lu que par moi et conservé 12 mois au plus.", 'contactForm.privacyLink': 'Politique de confidentialité', 'contactForm.fail': "Envoi impossible pour le moment. Réessaie, ou écris-moi par e-mail.",
    'about.title': 'À propos', 'about.level': 'niveau',
    'journey.title': 'Parcours', 'journey.formation': 'Formation', 'journey.experience': 'Expériences',
  },
  en: {
    skip: 'Skip to content',
    'nav.projects': 'Projects', 'nav.about': 'About', 'nav.contact': 'Contact',
    'theme.light': 'Light mode', 'theme.dark': 'Dark mode', 'lang.label': 'Language',
    'hero.badge': 'Bachelor Application Designer & Developer · Full Stack & Cybersecurity',
    'hero.titleA': 'Web & PHP developer,', 'hero.titleB': 'full stack',
    'hero.lead': 'Guillaume Rouyer, a curious, self-taught junior developer. From REST APIs to mobile apps, all the way to a local AI self-hosted on my own Proxmox server.',
    'hero.cta': 'See my projects',
    'contactForm.title': 'Or write to me right here', 'contactForm.name': 'Name', 'contactForm.email': 'Email address', 'contactForm.subject': 'Subject (optional)', 'contactForm.message': 'Message',
    'contactForm.send': 'Send', 'contactForm.sending': 'Sending…', 'contactForm.sentTitle': 'Message sent', 'contactForm.sentText': "Thank you! I'll get back to you as soon as I can.", 'contactForm.again': 'Send another message',
    'contactForm.privacy': 'Your message is read only by me and kept for 12 months at most.', 'contactForm.privacyLink': 'Privacy policy', 'contactForm.fail': 'Sending is not possible right now. Please try again, or email me.',
    'about.title': 'About', 'about.level': 'level',
    'journey.title': 'Journey', 'journey.formation': 'Education', 'journey.experience': 'Experience',
  },
}

export const t = (key) => MESSAGES[lang.value][key] ?? MESSAGES.fr[key] ?? key
// Choisit le champ `<clé>_fr` ou `<clé>_en` d'un contenu venant de la BDD
export const pick = (obj, key) => obj[`${key}_${lang.value}`] || obj[`${key}_fr`] || ''
