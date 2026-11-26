// Validation du formulaire de contact, côté navigateur, pour répondre pendant la frappe.
// Mêmes limites que le serveur (functions/_lib/contact.js) : le serveur revérifie TOUT, ceci n'est qu'un confort.
export const EMAIL = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]{1,63}(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,24}$/

// Rend la clé du message d'erreur (traduite par l'appelant), ou '' si le champ est valide
export function checkField(name, value) {
  const v = String(value ?? '').trim()
  switch (name) {
    case 'name': return v.length < 2 ? 'name' : v.length > 80 ? 'nameLong' : ''
    case 'email': return !EMAIL.test(v) || v.length > 254 ? 'email' : ''
    case 'message':
      if (v.length < 10) return 'messageShort'
      if (v.length > 4000) return 'messageLong'
      return (v.match(/https?:\/\//gi) ?? []).length > 3 ? 'links' : ''
    case 'motif': return v ? '' : 'motif'
    default: return ''
  }
}
