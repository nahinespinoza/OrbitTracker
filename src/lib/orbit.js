// Utilidades de mecánica orbital sobre satellite.js (SGP4).
// Convención de escena: 1 unidad = radio terrestre (6371 km).
// Se dibuja en el marco inercial ECI y la Tierra rota con GMST.
import {
  twoline2satrec, propagate, gstime, eciToGeodetic,
  degreesLat, degreesLong, sunPos, jday,
} from 'satellite.js'

export const EARTH_RADIUS_KM = 6371
const AU_KM = 149597870.7

export const makeSatrec = (line1, line2) => twoline2satrec(line1, line2)

// ECI (x, y, z con z = polo norte) -> three.js (y arriba)
const toScene = (p) => [p.x / EARTH_RADIUS_KM, p.z / EARTH_RADIUS_KM, -p.y / EARTH_RADIUS_KM]

/** Estado completo del satélite en un instante, o null si SGP4 falla. */
export function getState(satrec, date) {
  const pv = propagate(satrec, date)
  if (!pv || !pv.position || !pv.velocity) return null
  const gmst = gstime(date)
  const geo = eciToGeodetic(pv.position, gmst)
  const { x, y, z } = pv.velocity
  return {
    scenePos: toScene(pv.position),
    gmst,
    lat: degreesLat(geo.latitude),
    lon: degreesLong(geo.longitude),
    altKm: geo.height,
    speedKmh: Math.hypot(x, y, z) * 3600,
  }
}

/** Una órbita completa (en ECI) centrada en `date`, como array plano de puntos. */
export function getOrbitPath(satrec, date, samples = 180) {
  const periodMin = (2 * Math.PI) / satrec.no // satrec.no en rad/min
  const pts = []
  for (let i = 0; i <= samples; i++) {
    const t = new Date(date.getTime() + ((i / samples) * periodMin * 60000))
    const pv = propagate(satrec, t)
    if (pv && pv.position) pts.push(toScene(pv.position))
  }
  return pts
}

/** Dirección al Sol en coordenadas de escena (vector unitario). */
export function getSunDirection(date) {
  const { rsun } = sunPos(jday(date))
  const v = toScene({ x: rsun.x * AU_KM, y: rsun.y * AU_KM, z: rsun.z * AU_KM })
  const l = Math.hypot(...v)
  return v.map((c) => c / l)
}
