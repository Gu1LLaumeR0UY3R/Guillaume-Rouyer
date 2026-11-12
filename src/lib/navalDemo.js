// Simulation simplifiée des trois niveaux d'IA de Bataille Navale (sans arsenal ni sonar),
// pour comparer leurs décisions sur une même grille. Les stratégies suivent celles du jeu.
export const SIZE = 10
export const FLEET = [5, 4, 3, 3, 2]

export function mulberry32(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function placeFleet(rand) {
  const used = new Set()
  return FLEET.map((length) => {
    for (;;) {
      const horizontal = rand() < 0.5
      const r = Math.floor(rand() * (SIZE - (horizontal ? 0 : length - 1)))
      const c = Math.floor(rand() * (SIZE - (horizontal ? length - 1 : 0)))
      const cells = Array.from({ length }, (_, k) => (horizontal ? r * SIZE + c + k : (r + k) * SIZE + c))
      if (cells.some((i) => used.has(i))) continue
      cells.forEach((i) => used.add(i))
      return { length, cells }
    }
  })
}

function neighbors(i) {
  const r = Math.floor(i / SIZE)
  const c = i % SIZE
  const out = []
  if (r > 0) out.push(i - SIZE)
  if (r < SIZE - 1) out.push(i + SIZE)
  if (c > 0) out.push(i - 1)
  if (c < SIZE - 1) out.push(i + 1)
  return out
}

export function createGame(level, ships, seed) {
  const rand = mulberry32(seed)
  const cells = new Array(SIZE * SIZE).fill('') // '', 'miss', 'hit' ou 'sunk'
  const remaining = FLEET.slice()
  let shots = 0
  let lastShot = -1
  const pick = (list) => list[Math.floor(rand() * list.length)]
  const indexes = (state) => cells.reduce((acc, v, i) => (v === state ? (acc.push(i), acc) : acc), [])

  // Carte de probabilités : chaque position encore possible d'un navire restant ajoute du poids à ses cases.
  function weights(requireHit) {
    const w = new Array(SIZE * SIZE).fill(0)
    for (const length of remaining) {
      for (const horizontal of [true, false]) {
        for (let r = 0; r < SIZE - (horizontal ? 0 : length - 1); r++) {
          for (let c = 0; c < SIZE - (horizontal ? length - 1 : 0); c++) {
            const span = Array.from({ length }, (_, k) => (horizontal ? r * SIZE + c + k : (r + k) * SIZE + c))
            if (span.some((i) => cells[i] === 'miss' || cells[i] === 'sunk')) continue
            const hits = span.filter((i) => cells[i] === 'hit').length
            if (requireHit && hits === 0) continue
            for (const i of span) if (cells[i] === '') w[i] += 1 + 10 * hits
          }
        }
      }
    }
    return w
  }

  function choose() {
    const open = indexes('')
    if (level === 'easy') return pick(open)
    const hits = indexes('hit')
    if (level === 'medium') {
      const targets = hits.flatMap(neighbors).filter((i) => cells[i] === '')
      if (targets.length) return pick(targets)
      const parity = open.filter((i) => (Math.floor(i / SIZE) + (i % SIZE)) % 2 === 0)
      return pick(parity.length ? parity : open)
    }
    let w = weights(hits.length > 0)
    let best = Math.max(...open.map((i) => w[i]))
    if (best <= 0) {
      w = weights(false)
      best = Math.max(...open.map((i) => w[i]))
    }
    return pick(open.filter((i) => w[i] === best))
  }

  function step() {
    if (remaining.length === 0) return false
    const i = choose()
    shots += 1
    lastShot = i
    const ship = ships.find((s) => s.cells.includes(i))
    if (!ship) {
      cells[i] = 'miss'
    } else {
      cells[i] = 'hit'
      if (ship.cells.every((c) => cells[c] === 'hit' || cells[c] === 'sunk')) {
        ship.cells.forEach((c) => { cells[c] = 'sunk' })
        remaining.splice(remaining.indexOf(ship.length), 1)
      }
    }
    return true
  }

  return { cells, step, get shots() { return shots }, get last() { return lastShot }, get left() { return remaining.length }, get done() { return remaining.length === 0 } }
}
