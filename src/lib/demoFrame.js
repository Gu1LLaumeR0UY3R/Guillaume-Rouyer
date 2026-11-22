// Démos exécutables des articles : le code HTML/CSS/JS tourne dans un cadre isolé (sandbox sans accès au site, sans réseau).
const MIN = 80, MAX = 640
const frames = new Set()
let listening = false

function onMessage(e) {
  const d = e.data
  if (!d || d.type !== 'demo-size' || !Number.isFinite(d.h)) return
  for (const f of frames) {
    if (f.contentWindow === e.source) f.style.height = `${Math.min(Math.max(Math.ceil(d.h), MIN), MAX)}px`
  }
}

// Place (ou remplace) l'exécution du code dans `stage`.
export function runDemo(stage, code, title = 'Démo') {
  if (!listening) { addEventListener('message', onMessage); listening = true }
  for (const old of stage.querySelectorAll('iframe')) { frames.delete(old); old.remove() }
  const f = document.createElement('iframe')
  f.className = 'demo-frame'
  f.title = title
  f.setAttribute('sandbox', 'allow-scripts') // jamais allow-same-origin : le cadre n'a aucun accès au site
  f.setAttribute('referrerpolicy', 'no-referrer')
  f.setAttribute('loading', 'lazy')
  f.style.height = '160px'
  f.addEventListener('load', () => f.contentWindow?.postMessage({ type: 'demo-run', code: String(code).slice(0, 50000) }, '*'))
  frames.add(f)
  f.src = '/demo-frame'
  stage.append(f)
  return f
}
export function forgetDemos(root) { for (const f of [...frames]) if (!root || root.contains(f) || !f.isConnected) frames.delete(f) }

// Active toutes les démos d'un bloc de HTML d'article (rendu par renderMarkdown).
export function mountDemos(root) {
  for (const fig of root.querySelectorAll('figure[data-demo]')) {
    if (fig.dataset.ready) continue
    fig.dataset.ready = '1'
    const code = fig.querySelector('.demo-code code')?.textContent ?? ''
    const stage = fig.querySelector('.demo-stage')
    const title = fig.querySelector('.demo-title')?.textContent || 'Démo'
    if (stage) { stage.textContent = ''; runDemo(stage, code, title) }
    const tabs = fig.querySelectorAll('[data-demo-tab]')
    const show = (which) => {
      fig.querySelector('.demo-stage').hidden = which !== 'result'
      fig.querySelector('.demo-code').hidden = which !== 'code'
      for (const t of tabs) t.setAttribute('aria-selected', String(t.dataset.demoTab === which))
    }
    for (const t of tabs) t.addEventListener('click', () => show(t.dataset.demoTab))
  }
}
