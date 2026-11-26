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
    'hero.titleA': 'Développeur full stack', 'hero.titleB': '& cybersécurité',
    'hero.lead': "Guillaume Rouyer, développeur junior curieux et autodidacte. Des API REST aux apps mobiles, jusqu'à une IA locale auto-hébergée sur mon propre serveur Proxmox.",
    'hero.cta': 'Voir mes projets', 'cv.download': 'Télécharger mon CV',
    'cookie.title': 'Accepter les cookies ?', 'cookie.text': "Un petit cookie anonyme me sert uniquement à compter les visiteurs. Il n'est transmis à personne. Si tu refuses, le site fonctionne exactement pareil.", 'cookie.more': 'En savoir plus', 'cookie.accept': 'Accepter', 'cookie.refuse': 'Refuser', 'cookie.manage': 'Cookies', 'cookie.nowYes': 'Actuellement : accepté.', 'cookie.nowNo': 'Actuellement : refusé.',
    'contactForm.title': 'Ou écris-moi directement ici', 'contactForm.name': 'Nom', 'contactForm.email': 'Adresse e-mail', 'contactForm.subject': 'Sujet (facultatif)', 'contactForm.message': 'Message',
    'contactForm.send': 'Envoyer', 'contactForm.sending': 'Envoi…', 'contactForm.sentTitle': 'Message envoyé', 'contactForm.sentText': 'Merci ! Je te réponds dès que possible.', 'contactForm.again': 'Envoyer un autre message',
    'contactForm.privacy': "Ton message n'est lu que par moi et conservé 12 mois au plus.", 'contactForm.privacyLink': 'Politique de confidentialité', 'contactForm.fail': "Envoi impossible pour le moment. Réessaie, ou écris-moi par e-mail.",
    'contactForm.motif': 'Je te contacte pour', 'contactForm.motif.alternance': 'Une alternance', 'contactForm.motif.collaboration': 'Une collaboration', 'contactForm.motif.projet': 'Un projet', 'contactForm.motif.autre': 'Autre chose',
    'contactForm.ph.default': 'Écris ton message…', 'contactForm.ph.alternance': "Présente ton entreprise, le poste, le rythme d'alternance et la date de début envisagée.", 'contactForm.ph.collaboration': 'Décris la collaboration imaginée : sujet, rôle, durée.', 'contactForm.ph.projet': 'Décris ton projet : objectif, contraintes, échéance.', 'contactForm.ph.autre': 'Dis-moi tout.',
    'contactForm.err.name': 'Indique ton nom (2 caractères minimum).', 'contactForm.err.nameLong': '80 caractères maximum.', 'contactForm.err.email': "Cette adresse e-mail n'a pas l'air valide.", 'contactForm.err.messageShort': 'Message trop court (10 caractères minimum).', 'contactForm.err.messageLong': '4000 caractères maximum.', 'contactForm.err.links': 'Trop de liens dans le message (3 maximum).', 'contactForm.err.motif': 'Choisis un motif.',
    'contactForm.ok': 'Valide', 'contactForm.chars': 'caractères', 'contactForm.optional': 'facultatif', 'contactForm.fix': 'Corrige les champs signalés avant d\'envoyer.',
    'contactForm.slotTitle': 'Proposer un créneau pour échanger', 'contactForm.slotOpen': 'Voir les disponibilités', 'contactForm.slotClose': 'Fermer', 'contactForm.slotChosen': 'Créneau demandé :', 'contactForm.slotTz': 'heure de Paris', 'contactForm.slotClear': 'Retirer', 'contactForm.slotNone': 'Aucun créneau disponible pour le moment.', 'contactForm.slotView': 'Affichage', 'contactForm.slotCalendar': 'Calendrier', 'contactForm.slotList': 'Liste', 'contactForm.slotHelp': 'Clique sur un créneau (ou Entrée au clavier). Ma réponse confirmera ou proposera une autre heure.',
    'contactForm.done.alternance': 'Merci {name} ! Ta proposition d\'alternance est bien reçue. Je la lis avec attention et je te réponds rapidement.', 'contactForm.done.collaboration': 'Merci {name} ! Ton idée de collaboration est bien reçue. Je reviens vers toi très vite.', 'contactForm.done.projet': 'Merci {name} ! Les détails de ton projet sont bien reçus. Je te réponds rapidement.', 'contactForm.done.autre': 'Merci {name} ! Ton message est bien reçu. Je te réponds dès que possible.',
    'contactForm.doneSlot': 'Créneau demandé :', 'contactForm.doneSlotNote': "Ce créneau n'est pas encore confirmé : je te le confirme (ou propose une autre heure) par e-mail.", 'contactForm.doneTo': 'Réponse envoyée à',
    'contact.copy': "Copier l'adresse", 'contact.copied': 'Adresse copiée ✓', 'contact.copyFail': 'Copie impossible : sélectionne l\'adresse à la main.',
    'about.title': 'À propos', 'about.level': 'niveau',
    'journey.title': 'Parcours', 'journey.formation': 'Formation', 'journey.experience': 'Expériences',
    'veille.title': 'Veille technologique', 'veille.lead': "Ce que je lis, teste et découvre : des articles sur tout ce qui me passionne, sans me limiter à un seul sujet.", 'veille.metaDescription': "Veille technologique de Guillaume Rouyer (Er1gon359) : articles sur le développement web, le self-hosting, l'IA et tout ce qui le passionne.", 'veille.frOnly': 'Les articles sont rédigés en français.',
    'veille.featured': 'À la une', 'veille.filter': 'Filtrer par sujet', 'veille.all': 'Tous', 'veille.article': 'article', 'veille.articles': 'articles', 'veille.empty': 'Aucun article pour le moment.', 'veille.emptyTopic': 'Aucun article pour ce sujet.',
    'veille.loading': 'Chargement…', 'veille.error': 'Impossible de charger la veille pour le moment.', 'veille.retry': 'Réessayer', 'veille.back': 'Toute la veille', 'veille.minutes': 'min de lecture',
    'veille.toc': 'Sommaire', 'veille.search': 'Rechercher un article', 'veille.searchHint': 'Titre, résumé ou sujet', 'veille.sort': 'Trier par', 'veille.sortRecent': 'Plus récents', 'veille.sortOld': 'Plus anciens', 'veille.sortShort': 'Lecture la plus courte', 'veille.sortAz': 'Titre (A à Z)', 'veille.noMatch': 'Aucun article ne correspond à ta recherche.', 'veille.clear': 'Effacer la recherche', 'veille.progress': 'Progression de lecture', 'veille.top': 'Haut de page', 'veille.related': 'À lire aussi', 'veille.notFoundTitle': 'Article introuvable', 'veille.notFound': "Cet article n'existe pas ou n'est plus en ligne.",
  },
  en: {
    skip: 'Skip to content',
    'nav.projects': 'Projects', 'nav.about': 'About', 'nav.contact': 'Contact',
    'theme.light': 'Light mode', 'theme.dark': 'Dark mode', 'lang.label': 'Language',
    'hero.badge': 'Bachelor Application Designer & Developer · Full Stack & Cybersecurity',
    'hero.titleA': 'Full stack developer', 'hero.titleB': '& cybersecurity',
    'hero.lead': 'Guillaume Rouyer, a curious, self-taught junior developer. From REST APIs to mobile apps, all the way to a local AI self-hosted on my own Proxmox server.',
    'hero.cta': 'See my projects', 'cv.download': 'Download my résumé',
    'cookie.title': 'Accept cookies?', 'cookie.text': 'One small anonymous cookie is used only to count visitors. It is shared with no one. If you decline, the site works exactly the same.', 'cookie.more': 'Learn more', 'cookie.accept': 'Accept', 'cookie.refuse': 'Decline', 'cookie.manage': 'Cookies', 'cookie.nowYes': 'Currently: accepted.', 'cookie.nowNo': 'Currently: declined.',
    'contactForm.title': 'Or write to me right here', 'contactForm.name': 'Name', 'contactForm.email': 'Email address', 'contactForm.subject': 'Subject (optional)', 'contactForm.message': 'Message',
    'contactForm.send': 'Send', 'contactForm.sending': 'Sending…', 'contactForm.sentTitle': 'Message sent', 'contactForm.sentText': "Thank you! I'll get back to you as soon as I can.", 'contactForm.again': 'Send another message',
    'contactForm.privacy': 'Your message is read only by me and kept for 12 months at most.', 'contactForm.privacyLink': 'Privacy policy', 'contactForm.fail': 'Sending is not possible right now. Please try again, or email me.',
    'contactForm.motif': "I'm getting in touch about", 'contactForm.motif.alternance': 'A work-study role', 'contactForm.motif.collaboration': 'A collaboration', 'contactForm.motif.projet': 'A project', 'contactForm.motif.autre': 'Something else',
    'contactForm.ph.default': 'Write your message…', 'contactForm.ph.alternance': 'Tell me about your company, the role, the work-study rhythm and the planned start date.', 'contactForm.ph.collaboration': 'Describe the collaboration you have in mind: topic, role, duration.', 'contactForm.ph.projet': 'Describe your project: goal, constraints, deadline.', 'contactForm.ph.autre': 'Tell me everything.',
    'contactForm.err.name': 'Please enter your name (2 characters minimum).', 'contactForm.err.nameLong': '80 characters maximum.', 'contactForm.err.email': "This email address doesn't look valid.", 'contactForm.err.messageShort': 'Message too short (10 characters minimum).', 'contactForm.err.messageLong': '4000 characters maximum.', 'contactForm.err.links': 'Too many links in the message (3 maximum).', 'contactForm.err.motif': 'Please choose a reason.',
    'contactForm.ok': 'Valid', 'contactForm.chars': 'characters', 'contactForm.optional': 'optional', 'contactForm.fix': 'Fix the highlighted fields before sending.',
    'contactForm.slotTitle': 'Suggest a time to talk', 'contactForm.slotOpen': 'See availability', 'contactForm.slotClose': 'Close', 'contactForm.slotChosen': 'Requested slot:', 'contactForm.slotTz': 'Paris time', 'contactForm.slotClear': 'Remove', 'contactForm.slotNone': 'No slot available right now.', 'contactForm.slotView': 'View', 'contactForm.slotCalendar': 'Calendar', 'contactForm.slotList': 'List', 'contactForm.slotHelp': 'Click a slot (or press Enter). My reply will confirm it or suggest another time.',
    'contactForm.done.alternance': "Thank you {name}! Your work-study offer has been received. I'll read it carefully and get back to you quickly.", 'contactForm.done.collaboration': "Thank you {name}! Your collaboration idea has been received. I'll get back to you very soon.", 'contactForm.done.projet': "Thank you {name}! The details of your project have been received. I'll reply quickly.", 'contactForm.done.autre': "Thank you {name}! Your message has been received. I'll reply as soon as I can.",
    'contactForm.doneSlot': 'Requested slot:', 'contactForm.doneSlotNote': "This slot isn't confirmed yet: I'll confirm it (or suggest another time) by email.", 'contactForm.doneTo': 'Reply sent to',
    'contact.copy': 'Copy address', 'contact.copied': 'Address copied ✓', 'contact.copyFail': 'Copy failed: select the address by hand.',
    'about.title': 'About', 'about.level': 'level',
    'journey.title': 'Journey', 'journey.formation': 'Education', 'journey.experience': 'Experience',
    'veille.title': 'Tech watch', 'veille.lead': 'What I read, test and discover: articles on everything that fascinates me, without sticking to a single topic.', 'veille.metaDescription': 'Tech watch by Guillaume Rouyer (Er1gon359): articles on web development, self-hosting, AI and everything he is curious about.', 'veille.frOnly': 'Articles are written in French.',
    'veille.featured': 'Featured', 'veille.filter': 'Filter by topic', 'veille.all': 'All', 'veille.article': 'article', 'veille.articles': 'articles', 'veille.empty': 'No articles yet.', 'veille.emptyTopic': 'No articles for this topic.',
    'veille.loading': 'Loading…', 'veille.error': 'The tech watch cannot be loaded right now.', 'veille.retry': 'Try again', 'veille.back': 'All articles', 'veille.minutes': 'min read',
    'veille.toc': 'Contents', 'veille.search': 'Search articles', 'veille.searchHint': 'Title, summary or topic', 'veille.sort': 'Sort by', 'veille.sortRecent': 'Newest', 'veille.sortOld': 'Oldest', 'veille.sortShort': 'Shortest read', 'veille.sortAz': 'Title (A to Z)', 'veille.noMatch': 'No article matches your search.', 'veille.clear': 'Clear search', 'veille.progress': 'Reading progress', 'veille.top': 'Back to top', 'veille.related': 'Keep reading', 'veille.notFoundTitle': 'Article not found', 'veille.notFound': 'This article does not exist or is no longer online.',
  },
}

export const t = (key) => MESSAGES[lang.value][key] ?? MESSAGES.fr[key] ?? key
// Choisit le champ `<clé>_fr` ou `<clé>_en` d'un contenu venant de la BDD
export const pick = (obj, key) => obj[`${key}_${lang.value}`] || obj[`${key}_fr`] || ''
