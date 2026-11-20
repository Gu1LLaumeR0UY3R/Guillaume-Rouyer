// Contenu d'origine de l'étude de cas Goodnight, dans la forme du bloc « goodnight » (voir functions/_lib/content.js).
import { CTA, FOCUS, HERO, INTRO, STEPS, TECH } from '../data/goodnightCase.js'

export function goodnightDefaults() {
  return {
    hero: { ...HERO, meta: [...HERO.meta], images: [] },
    intro: { ...INTRO, paragraphs: [...INTRO.paragraphs], stack: [...INTRO.stack], desktopImage: '', mobileImage: '' },
    steps: STEPS.map(({ icon, title, text }) => ({ icon, title, text })),
    focus: { ...FOCUS, items: FOCUS.items.map(({ slot, role, title, alt, more }) => ({ slot, role, title, alt, more, image: '' })) },
    tech: { ...TECH, challenge: [...TECH.challenge], stack: [...TECH.stack] },
    cta: { ...CTA },
  }
}
