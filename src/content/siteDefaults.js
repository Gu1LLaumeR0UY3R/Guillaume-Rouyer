// Textes d'origine du site, dans la forme des formulaires de l'admin : point de départ avant la première modification.
import { FACTS, SKILLS } from '../data/skills.js'
import { EXPERIENCES, FORMATION } from '../data/timeline.js'
import { MESSAGES } from '../i18n/index.js'
import { BIO } from './site.js'
import { LEGAL_DEFAULT, PRIVACY_DEFAULT } from './legalDefaults.js'
import { CHANGELOG_DEFAULT, NOW_DEFAULT, TOOLS_DEFAULT } from './pageDefaults.js'

const entries = (list) => list.map((i) => ({
  when_fr: i.when, when_en: i.when, title_fr: i.title, title_en: i.title, place_fr: i.where ?? '', place_en: i.where ?? '',
  points_fr: [...(i.points ?? [])], points_en: [...(i.points ?? [])], tech: i.tech ?? '',
}))

export function defaults() {
  const m = (k) => ({ [`${k}_fr`]: MESSAGES.fr[`hero.${k}`], [`${k}_en`]: MESSAGES.en[`hero.${k}`] })
  return {
    home: { ...m('badge'), ...m('titleA'), ...m('titleB'), ...m('lead'), ...m('cta') },
    about: {
      bios: BIO.map((t) => ({ text_fr: t, text_en: t })),
      facts: FACTS.map((t) => ({ text_fr: t, text_en: t })),
    },
    skills: { groups: SKILLS.map((g) => ({ title_fr: g.title, title_en: g.title, items: g.items.map((name) => ({ name, level: 0 })) })) },
    timeline: { formation: entries(FORMATION), experience: entries(EXPERIENCES) },
    contact: { title_fr: 'Travaillons ensemble', title_en: "Let's work together", text_fr: 'Un projet, une mission ou une simple question : écris-moi.', text_en: 'A project, an assignment or just a question: write to me.' },
    legal: JSON.parse(JSON.stringify(LEGAL_DEFAULT)),
    privacy: JSON.parse(JSON.stringify(PRIVACY_DEFAULT)),
    now: JSON.parse(JSON.stringify(NOW_DEFAULT)),
    tools: JSON.parse(JSON.stringify(TOOLS_DEFAULT)),
    changelog: JSON.parse(JSON.stringify(CHANGELOG_DEFAULT)),
  }
}
