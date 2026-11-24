// Corbeille : copie un projet ou un article avant sa suppression, et le remet en place à la demande.
import { HttpError } from './http.js'

export const KEEP_DAYS = 30
const COL = /^[a-z_]+$/

// Garde une copie de la ligne `table` identifiée par son slug. À appeler avant le DELETE.
export async function stash(env, kind, slug) {
  const table = kind === 'project' ? 'projects' : 'veille_articles'
  const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE slug = ?`).bind(slug).first()
  if (!row) return false
  const data = { row }
  if (kind === 'article') {
    const { results } = await env.DB.prepare('SELECT topic_slug FROM veille_article_topics WHERE article_slug = ?').bind(slug).all()
    data.topics = results.map((r) => r.topic_slug)
  }
  await env.DB.prepare('INSERT INTO trash (kind, ref, title, data, deleted_at) VALUES (?, ?, ?, ?, ?)')
    .bind(kind, slug, String(row.name ?? row.title ?? slug).slice(0, 200), JSON.stringify(data), Date.now()).run()
  return true
}

export const purgeOld = (env) => env.DB.prepare('DELETE FROM trash WHERE deleted_at < ?').bind(Date.now() - KEEP_DAYS * 86400000).run()

// Remet l'élément en place. Refuse si l'identifiant est déjà pris.
export async function restore(env, id) {
  const t = await env.DB.prepare('SELECT id, kind, ref, data FROM trash WHERE id = ?').bind(id).first()
  if (!t) throw new HttpError(404, 'Élément introuvable dans la corbeille')
  const { row, topics = [] } = JSON.parse(t.data)
  const table = t.kind === 'project' ? 'projects' : 'veille_articles'
  const cols = Object.keys(row).filter((c) => COL.test(c))
  const taken = await env.DB.prepare(`SELECT 1 FROM ${table} WHERE slug = ?`).bind(t.ref).first()
  if (taken) throw new HttpError(409, `L'identifiant « ${t.ref} » est déjà utilisé : renomme ou supprime l'élément actuel avant de restaurer.`)
  const stmts = [env.DB.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).bind(...cols.map((c) => row[c]))]
  for (const tp of topics) stmts.push(env.DB.prepare('INSERT OR IGNORE INTO veille_article_topics (article_slug, topic_slug) SELECT ?, slug FROM veille_topics WHERE slug = ?').bind(t.ref, tp))
  stmts.push(env.DB.prepare('DELETE FROM trash WHERE id = ?').bind(id))
  await env.DB.batch(stmts)
  return { kind: t.kind, ref: t.ref }
}
