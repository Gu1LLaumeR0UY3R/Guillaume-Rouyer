// Petit client pour l'API admin. Le jeton CSRF reste en mémoire (jamais dans localStorage).
let csrf = ''
export const setCsrf = (v) => { csrf = v }

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await res.json() } catch { /* réponse sans JSON */ }
  if (!res.ok) throw Object.assign(new Error(data?.error || 'Erreur réseau'), { status: res.status })
  return data
}

// Télécharge un fichier renvoyé par l'API (ex. export CSV des journaux).
export async function download(path, filename) {
  const res = await fetch(path, { credentials: 'same-origin' })
  if (!res.ok) throw new Error('Téléchargement impossible')
  const url = URL.createObjectURL(await res.blob())
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.append(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

// Renvoie true si une session admin est ouverte (et récupère le jeton CSRF).
export async function checkSession() {
  try { setCsrf((await api('/api/admin/me')).csrf); return true } catch { return false }
}
