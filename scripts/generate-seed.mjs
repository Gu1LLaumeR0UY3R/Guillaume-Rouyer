// Génère migrations/0003_seed_projects.sql à partir des anciens fichiers de données.
// Usage : node scripts/generate-seed.mjs
import { writeFileSync } from 'node:fs'
import { PROJECTS } from '../src/data/projects.js'
import { DETAILS } from '../src/data/projectDetails.js'

const q = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
const STATUS = { 'En cours': 'wip', 'Page en maintenance': 'maintenance' }

const rows = PROJECTS.map((p, i) => {
  const d = DETAILS[p.slug] ?? {}
  const details = { lead: d.lead ?? '', notice: d.notice ?? '', sections: (d.sections ?? []).map((s) => ({ title: s.title, paragraphs: s.paragraphs ?? [], points: s.points ?? [] })) }
  return `INSERT INTO projects (slug, name, tag, status, accent, description, stack, repo, note, featured, board, maintenance_message, details, position, created_at, updated_at) VALUES (${[
    q(p.slug), q(p.name), q(p.tag), q(STATUS[p.status] ?? 'online'), q(p.accent ?? ''), q(p.desc), q(JSON.stringify(p.stack)), q(p.repo), q(p.note),
    p.featured ? 1 : 0, q(p.board), 'NULL', q(JSON.stringify(details)), i,
  ].join(', ')}, strftime('%s','now') * 1000, strftime('%s','now') * 1000);`
})
writeFileSync(new URL('../migrations/0003_seed_projects.sql', import.meta.url), `-- Projets actuels du site (généré par scripts/generate-seed.mjs)\n${rows.join('\n')}\n`)
console.log(`${rows.length} projets`)
