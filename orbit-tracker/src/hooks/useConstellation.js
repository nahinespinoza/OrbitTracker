import { useEffect, useState } from 'react'
import { loadCloud } from '../services/tleService'
import { makeSatrec } from '../lib/orbit'

/** Carga una nube de satélites (o nada si `key` es null) y devuelve sus `satrec`. */
export function useConstellation(key) {
  const [data, setData] = useState({ key: null, satrecs: [], source: null })

  useEffect(() => {
    if (!key) return
    let cancelled = false
    loadCloud(key).then(({ records, source }) => {
      if (cancelled) return
      setData({ key, source, satrecs: records.map(([, l1, l2]) => makeSatrec(l1, l2)) })
    })
    return () => { cancelled = true }
  }, [key])

  const ready = key && data.key === key
  return { satrecs: ready ? data.satrecs : [], source: ready ? data.source : null, loading: !!key && !ready }
}
