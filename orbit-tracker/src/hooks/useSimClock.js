import { useCallback, useRef, useState } from 'react'

/**
 * Reloj de simulación. El tiempo vive en un ref (se lee cada frame sin re-render);
 * `advance(dtSeconds)` lo hace avanzar multiplicado por la velocidad elegida.
 */
export function useSimClock() {
  const timeRef = useRef(Date.now())
  const speedRef = useRef(1)
  const [speed, setSpeedState] = useState(1)

  const setSpeed = useCallback((s) => { speedRef.current = s; setSpeedState(s) }, [])
  const advance = useCallback((dt) => { timeRef.current += dt * 1000 * speedRef.current }, [])
  const resetToNow = useCallback(() => { timeRef.current = Date.now() }, [])

  return { timeRef, speed, setSpeed, advance, resetToNow }
}
