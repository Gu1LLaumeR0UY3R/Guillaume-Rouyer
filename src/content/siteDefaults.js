// Textes d'origine du site, dans la forme des formulaires de l'admin : point de départ avant la première modification.
import { FACTS, SKILLS } from '../data/skills.js'
import { EXPERIENCES, FORMATION } from '../data/timeline.js'
import { MESSAGES } from '../i18n/index.js'
import { BIO } from './site.js'

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
  }
}
