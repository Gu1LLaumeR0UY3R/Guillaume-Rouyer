// Sauvegarde automatique incrémentale du contenu (textes, projets, articles de veille, sujets, réglages).
// Pas de tâche planifiée sur Pages : le contrôle se fait au fil des visites, une sauvegarde au plus tous les 7 jours (et à la demande).
// Jamais sauvegardés : compte admin, sessions, journaux, messages de contact, secrets, images.
import { HttpError } from './http.js'
import { getSettings, parseSettings, saveSettings } from './settings.js'
import { isBlock, parseBlock } from './content.js'

export const EVERY_DAYS = 7
export const KEEP_DAYS = 180
const COL = /^[a-z_]+$/

async function sha256(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// État actuel : Map clé -> texte JSON
export async function collect(env) {
  const q = (sql) => env.DB.prepare(sql).all().then((r) => r.results)
  const [content, projects, topics, articles, links, settings] = await Promise.all([
    q('SELECT key, data FROM content'), q('SELECT * FROM projects'), q('SELECT * FROM veille_topics'), q('SELECT * FROM veille_articles'),
    q('SELECT article_slug, topic_slug FROM veille_article_topics'), getSettings(env),
  ])
  const out = new Map()
  for (const r of content) out.set(`content:${r.key}`, r.data)
  for (const r of projects) out.set(`project:${r.slug}`, JSON.stringify(r))
  for (const r of topics) out.set(`topic:${r.slug}`, JSON.stringify(r))
  const byArticle = new Map()
  for (const l of links) byArticle.set(l.article_slug, [...(byArticle.get(l.article_slug) ?? []), l.topic_slug])
  for (const r of articles) out.set(`article:${r.slug}`, JSON.stringify({ row: r, topics: byArticle.get(r.slug) ?? [] }))
  const { maintenanceOn, protectedMode, ...pub } = settings // jamais restaurés : ils pourraient fermer le site
  out.set('settings', JSON.stringify(pub))
  return out
}

// Dernière version connue de chaque élément (ou pierre tombale), jusqu'à `upTo` (inclus).
async function latest(env, upTo = 2 ** 31) {
  const { results } = await env.DB.prepare(`SELECT b.key, b.hash, b.data IS NULL AS gone, b.run_id FROM backup_items b
    WHERE b.run_id = (SELECT MAX(run_id) FROM backup_items WHERE key = b.key AND run_id <= ?)`).bind(upTo).all()
  return new Map(results.map((r) => [r.key, r]))
}

const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n))

// Enregistre un passage. Ne stocke que les éléments nouveaux, modifiés ou supprimés.
export async function runBackup(env, kind = 'auto') {
  const now = Date.now()
  const [cur, prev] = await Promise.all([collect(env), latest(env)])
  const items = []
  for (const [key, data] of cur) {
    const hash = await sha256(data)
    const p = prev.get(key)
    if (!p || p.gone || p.hash !== hash) items.push({ key, hash, data })
  }
  const removed = [...prev.entries()].filter(([k, p]) => !p.gone && !cur.has(k)).map(([k]) => k)
  // Les passages automatiques ne se doublent pas si deux visiteurs déclenchent en même temps.
  const guard = kind === 'auto' ? `WHERE NOT EXISTS (SELECT 1 FROM backup_runs WHERE at > ${now - 6 * 86400000})` : ''
  const ins = await env.DB.prepare(`INSERT INTO backup_runs (at, kind, changed, removed, total) SELECT ?, ?, ?, ?, ? ${guard}`)
    .bind(now, kind, items.length, removed.length, cur.size).run()
  if (!ins.meta.changes) return null
  const id = ins.meta.last_row_id
  const rows = [
    ...items.map((i) => env.DB.prepare('INSERT INTO backup_items (run_id, key, hash, data) VALUES (?, ?, ?, ?)').bind(id, i.key, i.hash, i.data)),
    ...removed.map((k) => env.DB.prepare("INSERT INTO backup_items (run_id, key, hash, data) VALUES (?, ?, '', NULL)").bind(id, k)),
  ]
  for (const c of chunk(rows, 40)) await env.DB.batch(c)
  await prune(env, now)
  return { id, at: now, changed: items.length, removed: removed.length, total: cur.size }
}

// Garde 180 jours : le plus ancien passage conservé reçoit l'état complet de l'époque, puis les plus vieux sont retirés.
async function prune(env, now) {
  const base = await env.DB.prepare('SELECT MIN(id) AS id FROM backup_runs WHERE at >= ?').bind(now - KEEP_DAYS * 86400000).first()
  if (!base?.id) return
  const old = await env.DB.prepare('SELECT COUNT(*) AS n FROM backup_runs WHERE id < ?').bind(base.id).first()
  if (!old.n) return
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO backup_items (run_id, key, hash, data) SELECT ?, b.key, b.hash, b.data FROM backup_items b
      WHERE b.run_id < ? AND b.data IS NOT NULL AND b.run_id = (SELECT MAX(run_id) FROM backup_items WHERE key = b.key AND run_id < ?)
      AND NOT EXISTS (SELECT 1 FROM backup_items x WHERE x.run_id = ? AND x.key = b.key)`).bind(base.id, base.id, base.id, base.id),
    env.DB.prepare('DELETE FROM backup_items WHERE run_id < ?').bind(base.id),
    env.DB.prepare('DELETE FROM backup_runs WHERE id < ?').bind(base.id),
  ])
}

// Appelé au fil des visites : lance un passage si le dernier date de plus de 7 jours (au plus un contrôle toutes les 10 minutes par instance).
let lastCheck = 0
export async function maybeBackup(env) {
  const now = Date.now()
  if (now - lastCheck < 600_000) return
  lastCheck = now
  try {
    const last = await env.DB.prepare('SELECT MAX(at) AS at FROM backup_runs').first()
    if (!last?.at || now - last.at > EVERY_DAYS * 86400000) await runBackup(env, 'auto')
  } catch { /* tables absentes avant la migration : on ne bloque jamais le site */ }
}

export async function listRuns(env) {
  const { results } = await env.DB.prepare('SELECT id, at, kind, changed, removed, total FROM backup_runs ORDER BY id DESC LIMIT 60').all()
  return results
}

// Contenu d'un passage : éléments enregistrés ce jour-là, avec leur nature (nouveau / modifié / supprimé).
export async function runDetail(env, id) {
  const run = await env.DB.prepare('SELECT id, at, kind, changed, removed, total FROM backup_runs WHERE id = ?').bind(id).first()
  if (!run) throw new HttpError(404, 'Sauvegarde introuvable')
  const { results } = await env.DB.prepare(`SELECT b.key, b.data IS NULL AS gone,
      EXISTS (SELECT 1 FROM backup_items p WHERE p.key = b.key AND p.run_id < b.run_id AND p.data IS NOT NULL) AS had
    FROM backup_items b WHERE b.run_id = ? ORDER BY b.key`).bind(id).all()
  return { run, items: results.map((r) => ({ key: r.key, status: r.gone ? 'removed' : r.had ? 'changed' : 'new' })) }
}

// État complet à la date d'un passage : Map clé -> texte JSON.
export async function stateAt(env, id) {
  const heads = await latest(env, id)
  const keys = [...heads.entries()].filter(([, h]) => !h.gone)
  const out = new Map()
  for (const c of chunk(keys, 40)) {
    const { results } = await env.DB.prepare(`SELECT key, data FROM backup_items WHERE (key, run_id) IN (VALUES ${c.map(() => '(?, ?)').join(',')})`)
      .bind(...c.flatMap(([k, h]) => [k, h.run_id])).all()
    for (const r of results) out.set(r.key, r.data)
  }
  return out
}

export async function itemAt(env, id, key) {
  const row = await env.DB.prepare('SELECT data FROM backup_items WHERE key = ? AND run_id = (SELECT MAX(run_id) FROM backup_items WHERE key = ? AND run_id <= ?)').bind(key, key, id).first()
  return row?.data ?? null
}

// ---------- Restauration d'un élément ----------
async function upsertRow(env, table, row) {
  const info = (await env.DB.prepare(`PRAGMA table_info(${table})`).all()).results.map((c) => c.name)
  const cols = Object.keys(row).filter((c) => COL.test(c) && info.includes(c))
  return env.DB.prepare(`INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).bind(...cols.map((c) => row[c]))
}

export async function restoreItem(env, id, key) {
  const data = await itemAt(env, id, key)
  if (data === null) throw new HttpError(404, 'Cet élément n\'existait pas à cette date')
  const [kind, ref = ''] = key.split(/:(.*)/s)
  const now = Date.now()
  if (key === 'settings') { await saveSettings(env, parseSettings(JSON.parse(data))); return }
  if (kind === 'content') {
    if (!isBlock(ref)) throw new HttpError(400, 'Contenu inconnu')
    const d = parseBlock(ref, JSON.parse(data))
    await env.DB.prepare('INSERT INTO content (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').bind(ref, JSON.stringify(d), now).run()
  } else if (kind === 'project') await (await upsertRow(env, 'projects', JSON.parse(data))).run()
  else if (kind === 'topic') await (await upsertRow(env, 'veille_topics', JSON.parse(data))).run()
  else if (kind === 'article') {
    const { row, topics } = JSON.parse(data)
    await env.DB.batch([
      await upsertRow(env, 'veille_articles', row),
      env.DB.prepare('DELETE FROM veille_article_topics WHERE article_slug = ?').bind(ref),
      ...topics.map((t) => env.DB.prepare('INSERT OR IGNORE INTO veille_article_topics (article_slug, topic_slug) SELECT ?, slug FROM veille_topics WHERE slug = ?').bind(ref, t)),
    ])
  } else throw new HttpError(400, 'Type d\'élément inconnu')
}
