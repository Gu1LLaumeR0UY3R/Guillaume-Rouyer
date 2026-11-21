// Versions, brouillons et publications programmées : tout ce qui écrit un contenu ou un projet passe par ici.
import { HttpError } from './http.js'
import { getBlock, isBlock, parseBlock } from './content.js'
import { COLUMNS, nextPrevStatus, parseProject, toBody, validSlug } from './projects.js'

const KEEP = 30 // versions gardées par élément
export const KINDS = ['content', 'project']

export function checkRef(kind, ref) {
  if (!KINDS.includes(kind)) throw new HttpError(400, 'Type invalide')
  if (kind === 'content') { if (!isBlock(ref)) throw new HttpError(404, 'Contenu introuvable') } else validSlug(ref)
}

export async function snapshot(env, kind, ref, data, label = '') {
  await env.DB.batch([
    env.DB.prepare('INSERT INTO versions (kind, ref, data, label, created_at) VALUES (?, ?, ?, ?, ?)').bind(kind, ref, JSON.stringify(data), label, Date.now()),
    env.DB.prepare('DELETE FROM versions WHERE kind = ? AND ref = ? AND id NOT IN (SELECT id FROM versions WHERE kind = ? AND ref = ? ORDER BY id DESC LIMIT ?)').bind(kind, ref, kind, ref, KEEP),
  ])
}

// Valide un état pour un type donné et renvoie sa forme normalisée.
export function parseFor(kind, ref, data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HttpError(400, 'Données invalides')
  return kind === 'content' ? parseBlock(ref, data) : parseProject(data)
}

export async function applyContent(env, key, data, label = 'Avant modification') {
  const old = await getBlock(env, key)
  if (old) await snapshot(env, 'content', key, old, label)
  const now = Date.now()
  await env.DB.prepare('INSERT INTO content (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at')
    .bind(key, JSON.stringify(data), now).run()
  return now
}

export async function applyProject(env, slug, body, label = 'Avant modification') {
  const row = await env.DB.prepare(`SELECT ${COLUMNS} FROM projects WHERE slug = ?`).bind(slug).first()
  if (!row) throw new HttpError(404, 'Projet introuvable')
  const p = parseProject(body)
  await snapshot(env, 'project', slug, toBody(row), label)
  await env.DB.prepare(`UPDATE projects SET name = ?, tag = ?, status = ?, prev_status = ?, accent = ?, description = ?, stack = ?, repo = ?, note = ?, featured = ?, board = ?, maintenance_message = ?, details = ?, banner_image = ?, banner_dim = ?, updated_at = ? WHERE slug = ?`)
    .bind(p.name, p.tag, p.status, nextPrevStatus(row, p.status), p.accent, p.description, JSON.stringify(p.stack), p.repo, p.note, p.featured, p.board, p.maintenance_message, JSON.stringify(p.details), p.banner_image, p.banner_dim, Date.now(), slug).run()
}

export const apply = (env, kind, ref, data, label) => (kind === 'content' ? applyContent(env, ref, parseBlock(ref, data), label) : applyProject(env, ref, data, label))

// Publie les brouillons programmés dont l'heure est passée. Pas de tâche planifiée sur Pages : on vérifie au fil des visites (au plus toutes les 20 s par instance).
let lastCheck = 0
export async function publishDue(env, { force = false } = {}) {
  const now = Date.now()
  if (!force && now - lastCheck < 20_000) return 0
  lastCheck = now
  let done = 0
  try {
    const { results } = await env.DB.prepare('SELECT kind, ref, data FROM drafts WHERE publish_at IS NOT NULL AND publish_at <= ? AND error IS NULL').bind(now).all()
    for (const d of results) {
      try {
        await apply(env, d.kind, d.ref, JSON.parse(d.data), 'Avant publication programmée')
        await env.DB.prepare('DELETE FROM drafts WHERE kind = ? AND ref = ?').bind(d.kind, d.ref).run()
        done++
      } catch (e) {
        await env.DB.prepare('UPDATE drafts SET error = ? WHERE kind = ? AND ref = ?').bind(String(e.message ?? e).slice(0, 200), d.kind, d.ref).run()
      }
    }
  } catch { /* table absente avant la migration : on ne bloque pas le site */ }
  return done
}
