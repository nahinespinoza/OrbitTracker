import { useEffect, useState } from 'react'
import { loadTLE } from '../services/tleService'
import { makeSatrec } from '../lib/orbit'

/**
 * Carga el TLE del satélite elegido y devuelve su `satrec` (SGP4) listo para propagar.
 * El cálculo por frame (getState) se hace fuera de React para no re-renderizar a 60 fps.
 */
export function useSatellite(key) {
  const [data, setData] = useState({ key: null, name: '', satrec: null, source: null })

  useEffect(() => {
    let cancelled = false
    loadTLE(key).then((tle) => {
      if (cancelled) return
      setData({ key, name: tle.name, source: tle.source, satrec: makeSatrec(tle.line1, tle.line2) })
    })
    return () => { cancelled = true }
  }, [key])

  return { ...data, loading: data.key !== key }
}
