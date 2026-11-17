// Petit client pour l'API admin. Le jeton CSRF reste en mémoire (jamais dans localStorage).
let csrf = ''
export const setCsrf = (v) => { csrf = v }

// Envoie un fichier brut avec suivi de progression (fetch ne sait pas le faire). `headers` : nom, texte alternatif, dimensions.
export function upload(path, blob, headers, onProgress) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest()
    x.open('POST', path)
    x.withCredentials = true
    x.setRequestHeader('X-CSRF-Token', csrf)
    for (const [k, v] of Object.entries(headers)) x.setRequestHeader(k, encodeURIComponent(v))
    x.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    x.onerror = () => reject(new Error('Erreur réseau'))
    x.onload = () => {
      let d = null
      try { d = JSON.parse(x.responseText) } catch { /* pas de JSON */ }
      x.status >= 200 && x.status < 300 ? resolve(d) : reject(Object.assign(new Error(d?.error || 'Envoi refusé'), { status: x.status }))
    }
    x.send(blob)
  })
}

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
