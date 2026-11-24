// Assistant qualité d'un article : une liste de contrôles simples (SEO, structure, accessibilité, lisibilité).
// Chaque contrôle renvoie { id, level: 'ok' | 'warn' | 'bad', label, tip }.
const words = (s) => (s.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length

export function checkArticle({ title = '', excerpt = '', body = '', coverUrl = '', coverAlt = '', topics = [] }) {
  const out = []
  const add = (id, level, label, tip = '') => out.push({ id, level, label, tip })
  const t = title.trim(), e = excerpt.trim()

  // Titre
  if (!t) add('title', 'bad', 'Titre manquant', 'Le titre est obligatoire.')
  else if (t.length < 25) add('title', 'warn', `Titre court (${t.length} caractères)`, 'Entre 30 et 65 caractères, il est mieux affiché dans les moteurs de recherche.')
  else if (t.length > 65) add('title', 'warn', `Titre long (${t.length} caractères)`, 'Au-delà de 65 caractères, Google le coupe.')
  else add('title', 'ok', `Titre de bonne longueur (${t.length} caractères)`)

  // Résumé
  if (!e) add('excerpt', 'bad', 'Résumé manquant', 'Il est obligatoire pour publier et sert de description dans les moteurs de recherche.')
  else if (e.length < 70) add('excerpt', 'warn', `Résumé court (${e.length} caractères)`, 'Vise 70 à 160 caractères.')
  else if (e.length > 160) add('excerpt', 'warn', `Résumé long (${e.length} caractères)`, 'Google coupe la description vers 160 caractères ; les premiers mots comptent le plus.')
  else add('excerpt', 'ok', `Résumé de bonne longueur (${e.length} caractères)`)
  if (e && t && e.toLowerCase() === t.toLowerCase()) add('excerpt-same', 'warn', 'Le résumé répète le titre', 'Apporte une information de plus.')

  // Longueur
  const n = words(body)
  if (n < 150) add('length', 'bad', `Article très court (${n} mots)`, 'Moins de 150 mots : difficile à faire remonter dans les recherches.')
  else if (n < 300) add('length', 'warn', `Article court (${n} mots)`, 'Vise au moins 300 mots pour traiter le sujet.')
  else add('length', 'ok', `Longueur correcte (${n} mots)`)

  // Structure
  const h2 = (body.match(/^## .+$/gm) ?? []).length
  if (n >= 300 && h2 === 0) add('h2', 'warn', 'Aucun intertitre', 'Découpe le texte avec des titres « ## » : ils alimentent le sommaire et aident la lecture.')
  else if (n >= 600 && h2 < 3) add('h2', 'warn', `Peu d'intertitres (${h2})`, 'Pour un long texte, un intertitre toutes les 200 à 300 mots aide à survoler.')
  else if (h2) add('h2', 'ok', `${h2} intertitre(s)`)
  if (/^# .+$/m.test(body)) add('h1', 'warn', 'Titre de niveau 1 dans le texte', 'Le titre de l\'article est déjà le niveau 1 : utilise « ## » pour les sections.')
  const jumps = [...body.matchAll(/^(#{2,4}) /gm)].map((m) => m[1].length)
  if (jumps.some((l, i) => i && l - jumps[i - 1] > 1)) add('jump', 'warn', 'Niveaux de titres sautés', 'Passe de « ## » à « ### », pas directement à « #### ».')

  // Paragraphes
  const paras = body.split(/\n{2,}/).filter((p) => !/^(#|```|:::|>|[-*+] |\d+\. |\||!\[)/.test(p.trim()) && p.trim())
  const long = paras.filter((p) => words(p) > 130).length
  if (long) add('para', 'warn', `${long} paragraphe(s) très long(s)`, 'Plus de 130 mots d\'un bloc fatigue la lecture : coupe ou ajoute une liste.')
  const sentences = body.replace(/```[\s\S]*?```/g, '').split(/[.!?…]+\s/).filter((s) => words(s) > 0)
  const avg = sentences.length ? Math.round(words(sentences.join(' ')) / sentences.length) : 0
  if (avg > 28) add('sentences', 'warn', `Phrases longues (${avg} mots en moyenne)`, 'Vise moins de 25 mots par phrase.')
  else if (avg) add('sentences', 'ok', `Phrases de longueur confortable (${avg} mots en moyenne)`)

  // Images et liens
  const imgs = [...body.matchAll(/!\[([^\]]*)\]\(/g)]
  const noAlt = imgs.filter((m) => !m[1].trim()).length
  if (noAlt) add('alt', 'bad', `${noAlt} image(s) sans texte alternatif`, 'Décris chaque image : nécessaire pour les lecteurs d\'écran.')
  else if (imgs.length) add('alt', 'ok', `${imgs.length} image(s) décrite(s)`)
  if (coverUrl.trim() && !coverAlt.trim()) add('cover', 'bad', 'Couverture sans texte alternatif', 'Obligatoire dès qu\'une couverture est ajoutée.')
  const bad = [...body.matchAll(/\[([^\]]*)\]\(([^)\s]+)/g)].filter((m) => /^(ici|cliquez ici|lien|click here|here)$/i.test(m[1].trim())).length
  if (bad) add('linktext', 'warn', `${bad} lien(s) au texte vague (« ici », « lien »)`, 'Un texte de lien explicite aide l\'accessibilité et le référencement.')
  const http = [...body.matchAll(/\]\((http:\/\/[^)\s]+)/g)].length
  if (http) add('http', 'warn', `${http} lien(s) en http non sécurisé`, 'Préfère https quand le site le propose.')
  const fenceLines = [...body.matchAll(/^```(\S*)/gm)]
  if (fenceLines.length % 2) add('fence', 'bad', 'Bloc de code non refermé', 'Il manque un « ``` » de fin.')
  else if (fenceLines.filter((m, i) => i % 2 === 0 && !m[1]).length) add('lang', 'warn', 'Bloc de code sans langage', 'Indique le langage (```js, ```php…) pour la coloration.')

  // Sujets
  if (!topics.length) add('topics', 'warn', 'Aucun sujet', 'Les sujets permettent de filtrer la liste sur /veille.')
  else add('topics', 'ok', `${topics.length} sujet(s)`)
  return out
}

export function score(checks) {
  if (!checks.length) return 0
  const pts = checks.reduce((s, c) => s + (c.level === 'ok' ? 1 : c.level === 'warn' ? 0.5 : 0), 0)
  return Math.round((pts / checks.length) * 100)
}
