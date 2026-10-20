// Carga de TLE: caché local (2 h) → CelesTrak → JSON local de respaldo.
import fallback from '../data/tle-fallback.json'
import { SATELLITES, CLOUDS } from '../data/catalog'

export { SATELLITES }

const CELESTRAK = 'https://celestrak.org/NORAD/elements/gp.php'
const TIMEOUT_MS = 4000
// CelesTrak pide no repetir la misma consulta en menos de 2 h (si no, responde 403).
const CACHE_TTL_MS = 2 * 60 * 60 * 1000
const cacheKey = (key) => `tle:${key}`

function readCache(key) {
  try {
    const c = JSON.parse(localStorage.getItem(cacheKey(key)))
    if (c && Date.now() - c.at < CACHE_TTL_MS) return c.tle
  } catch { /* localStorage no disponible */ }
  return null
}

function writeCache(key, tle) {
  try { localStorage.setItem(cacheKey(key), JSON.stringify({ at: Date.now(), tle })) } catch { /* ignorar */ }
}

function parseTLE(text) {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  // Formato de 3 líneas: nombre + línea 1 + línea 2 (se toma el primer objeto)
  const i = lines.findIndex((l) => l.startsWith('1 '))
  if (i < 0 || !lines[i + 1]?.startsWith('2 ')) throw new Error('TLE inválido')
  return { name: i > 0 ? lines[i - 1] : 'SAT', line1: lines[i], line2: lines[i + 1] }
}

/** Devuelve { name, line1, line2, source: 'live' | 'offline' } */
export async function loadTLE(key) {
  const cached = readCache(key)
  if (cached) return { ...cached, source: 'live' }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${CELESTRAK}?${SATELLITES[key].query}&FORMAT=tle`, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const tle = parseTLE(await res.text())
    writeCache(key, tle)
    return { ...tle, source: 'live' }
  } catch {
    return { ...fallback.satellites[key], source: 'offline' }
  } finally {
    clearTimeout(timer)
  }
}

/* ───────── Nubes de satélites ───────── */

// Parsea un bloque de varios TLE (3 líneas cada uno) a [[nombre, l1, l2], ...]
function parseTLEList(text) {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  const out = []
  for (let i = 0; i + 2 < lines.length; i += 3) {
    if (lines[i + 1].startsWith('1 ') && lines[i + 2].startsWith('2 ')) out.push([lines[i], lines[i + 1], lines[i + 2]])
  }
  return out
}

// Reduce a `max` elementos con paso uniforme (conserva la variedad de planos orbitales)
function sample(list, max) {
  if (list.length <= max) return list
  const step = list.length / max
  return Array.from({ length: max }, (_, i) => list[Math.floor(i * step)])
}

/** Devuelve { records: [[nombre, l1, l2], ...], source } para una nube. */
export async function loadCloud(key) {
  const cfg = CLOUDS[key]
  const cached = readCache(`cloud-${key}`)
  if (cached) return { records: cached, source: 'live' }

  try {
    const parts = await Promise.all(cfg.queries.map(async (q) => {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 15000) // grupos grandes: más margen
      try {
        const res = await fetch(`${CELESTRAK}?${q}&FORMAT=tle`, { signal: ctrl.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return parseTLEList(await res.text())
      } finally { clearTimeout(timer) }
    }))
    const records = sample(parts.flat(), cfg.max)
    if (!records.length) throw new Error('vacío')
    writeCache(`cloud-${key}`, records)
    return { records, source: 'live' }
  } catch {
    // El respaldo es grande: se carga bajo demanda en un chunk aparte
    const { default: data } = await import('../data/constellations.json')
    return { records: data.clouds[key], source: 'offline' }
  }
}
