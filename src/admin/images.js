// Préparation des images dans le navigateur avant l'envoi : plus grand côté 1600 px, WebP, moins de 950 Ko.
export const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
export const MAX_PICK = 5 * 1024 * 1024 // taille maximale du fichier choisi
const MAX_SIDE = 1600
const MAX_OUT = 950_000 // le serveur accepte 1 Mo

export async function shrink(file) {
  const bmp = await createImageBitmap(file)
  let scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  for (let round = 0; round < 4; round++) {
    const w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale))
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    c.getContext('2d').drawImage(bmp, 0, 0, w, h)
    for (const q of [0.86, 0.76, 0.66, 0.56]) {
      const blob = await new Promise((r) => c.toBlob(r, 'image/webp', q))
      if (blob && blob.type === 'image/webp' && blob.size <= MAX_OUT) { bmp.close?.(); return { blob, w, h } }
    }
    scale *= 0.75
  }
  bmp.close?.()
  throw new Error('Impossible de réduire assez cette image')
}

export function checkFile(file) {
  if (!ACCEPT.includes(file.type)) return `« ${file.name} » : format refusé (JPG, PNG, WebP ou AVIF).`
  if (file.size > MAX_PICK) return `« ${file.name} » dépasse 5 Mo.`
  return ''
}
