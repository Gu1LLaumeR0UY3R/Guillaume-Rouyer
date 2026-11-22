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
    'cookie.title': 'Un cookie pour compter les visiteurs ?', 'cookie.text': "Avec ton accord, un cookie anonyme (un numéro au hasard, valable 13 mois) permet de savoir combien de visiteurs différents viennent et combien reviennent. Il ne sert qu'à cela, n'est transmis à personne et ne te suit pas d'un site à l'autre. Sans ton accord, rien n'est posé et le site fonctionne pareil.", 'cookie.more': 'En savoir plus', 'cookie.accept': 'Accepter', 'cookie.refuse': 'Refuser', 'cookie.manage': 'Cookies', 'cookie.nowYes': 'Actuellement : accepté.', 'cookie.nowNo': 'Actuellement : refusé.',
    'contactForm.title': 'Ou écris-moi directement ici', 'contactForm.name': 'Nom', 'contactForm.email': 'Adresse e-mail', 'contactForm.subject': 'Sujet (facultatif)', 'contactForm.message': 'Message',
    'contactForm.send': 'Envoyer', 'contactForm.sending': 'Envoi…', 'contactForm.sentTitle': 'Message envoyé', 'contactForm.sentText': 'Merci ! Je te réponds dès que possible.', 'contactForm.again': 'Envoyer un autre message',
    'contactForm.privacy': "Ton message n'est lu que par moi et conservé 12 mois au plus.", 'contactForm.privacyLink': 'Politique de confidentialité', 'contactForm.fail': "Envoi impossible pour le moment. Réessaie, ou écris-moi par e-mail.",
    'about.title': 'À propos', 'about.level': 'niveau',
    'journey.title': 'Parcours', 'journey.formation': 'Formation', 'journey.experience': 'Expériences',
    'veille.title': 'Veille technologique', 'veille.lead': "Ce que je lis, teste et découvre : des articles sur tout ce qui me passionne, sans me limiter à un seul sujet.", 'veille.metaDescription': "Veille technologique de Guillaume Rouyer (Er1gon359) : articles sur le développement web, le self-hosting, l'IA et tout ce qui le passionne.", 'veille.frOnly': 'Les articles sont rédigés en français.',
    'veille.filter': 'Filtrer par sujet', 'veille.all': 'Tous', 'veille.article': 'article', 'veille.articles': 'articles', 'veille.empty': 'Aucun article pour le moment.', 'veille.emptyTopic': 'Aucun article pour ce sujet.',
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
    'cookie.title': 'A cookie to count visitors?', 'cookie.text': 'With your consent, an anonymous cookie (a random number, valid for 13 months) tells me how many different visitors come and how many return. It is used for nothing else, shared with no one and does not follow you across sites. Without your consent nothing is set and the site works the same.', 'cookie.more': 'Learn more', 'cookie.accept': 'Accept', 'cookie.refuse': 'Decline', 'cookie.manage': 'Cookies', 'cookie.nowYes': 'Currently: accepted.', 'cookie.nowNo': 'Currently: declined.',
    'contactForm.title': 'Or write to me right here', 'contactForm.name': 'Name', 'contactForm.email': 'Email address', 'contactForm.subject': 'Subject (optional)', 'contactForm.message': 'Message',
    'contactForm.send': 'Send', 'contactForm.sending': 'Sending…', 'contactForm.sentTitle': 'Message sent', 'contactForm.sentText': "Thank you! I'll get back to you as soon as I can.", 'contactForm.again': 'Send another message',
    'contactForm.privacy': 'Your message is read only by me and kept for 12 months at most.', 'contactForm.privacyLink': 'Privacy policy', 'contactForm.fail': 'Sending is not possible right now. Please try again, or email me.',
    'about.title': 'About', 'about.level': 'level',
    'journey.title': 'Journey', 'journey.formation': 'Education', 'journey.experience': 'Experience',
    'veille.title': 'Tech watch', 'veille.lead': 'What I read, test and discover: articles on everything that fascinates me, without sticking to a single topic.', 'veille.metaDescription': 'Tech watch by Guillaume Rouyer (Er1gon359): articles on web development, self-hosting, AI and everything he is curious about.', 'veille.frOnly': 'Articles are written in French.',
    'veille.filter': 'Filter by topic', 'veille.all': 'All', 'veille.article': 'article', 'veille.articles': 'articles', 'veille.empty': 'No articles yet.', 'veille.emptyTopic': 'No articles for this topic.',
    'veille.loading': 'Loading…', 'veille.error': 'The tech watch cannot be loaded right now.', 'veille.retry': 'Try again', 'veille.back': 'All articles', 'veille.minutes': 'min read',
    'veille.toc': 'Contents', 'veille.search': 'Search articles', 'veille.searchHint': 'Title, summary or topic', 'veille.sort': 'Sort by', 'veille.sortRecent': 'Newest', 'veille.sortOld': 'Oldest', 'veille.sortShort': 'Shortest read', 'veille.sortAz': 'Title (A to Z)', 'veille.noMatch': 'No article matches your search.', 'veille.clear': 'Clear search', 'veille.progress': 'Reading progress', 'veille.top': 'Back to top', 'veille.related': 'Keep reading', 'veille.notFoundTitle': 'Article not found', 'veille.notFound': 'This article does not exist or is no longer online.',
  },
}

export const t = (key) => MESSAGES[lang.value][key] ?? MESSAGES.fr[key] ?? key
// Choisit le champ `<clé>_fr` ou `<clé>_en` d'un contenu venant de la BDD
export const pick = (obj, key) => obj[`${key}_${lang.value}`] || obj[`${key}_fr`] || ''
