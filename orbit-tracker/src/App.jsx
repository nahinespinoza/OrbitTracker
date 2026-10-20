import { useEffect, useState } from 'react'
import { Satellite } from 'lucide-react'
import Earth3D from './components/Earth3D'
import TelemetryPanel from './components/TelemetryPanel'
import OrbitalControls from './components/OrbitalControls'
import { useSatellite } from './hooks/useSatellite'
import { useSimClock } from './hooks/useSimClock'
import { getState } from './lib/orbit'
import { SATELLITES, CLOUDS } from './data/catalog'
import { useConstellation } from './hooks/useConstellation'

export default function App() {
  const [selected, setSelected] = useState('iss')
  const [showOrbit, setShowOrbit] = useState(true)
  const [follow, setFollow] = useState(true)
  const [cloudKey, setCloudKey] = useState(null)
  const [zoomRequest, setZoomRequest] = useState(null)
  const [telemetry, setTelemetry] = useState(null)
  const [simTime, setSimTime] = useState('')

  const sat = useSatellite(selected)
  const clock = useSimClock()
  const cloud = useConstellation(cloudKey)

  // La telemetría se refresca a 10 Hz (legible, sin saturar React); la escena 3D va a 60 fps.
  useEffect(() => {
    if (!sat.satrec || sat.loading) return
    const tick = () => {
      const date = new Date(clock.timeRef.current)
      const st = getState(sat.satrec, date)
      if (st) setTelemetry({ ...st, name: sat.name, source: sat.source })
      setSimTime(date.toISOString().slice(0, 19).replace('T', ' ') + ' UTC')
    }
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [sat.satrec, sat.loading, sat.name, sat.source, clock.timeRef])

  return (
    <div className="relative h-full w-full overflow-hidden bg-space">
      <div className="absolute inset-0">
        <Earth3D
          satrec={sat.loading ? null : sat.satrec}
          model={SATELLITES[selected].model}
          cloud={cloudKey ? { satrecs: cloud.satrecs, color: CLOUDS[cloudKey].color } : null} zoomRequest={zoomRequest}
          timeRef={clock.timeRef} advance={clock.advance}
          showOrbit={showOrbit} follow={follow}
        />
      </div>

      <header className="pointer-events-none absolute left-6 top-5 flex items-center gap-3">
        <Satellite className="text-neon-cyan" size={30} />
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-[0.2em] text-white glow-cyan">ORBIT TRACKER</h1>
          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Mission Control · Space Week</p>
        </div>
      </header>

      <div className="absolute bottom-6 left-6 top-24 flex min-h-0 items-start">
        <OrbitalControls
          selected={selected} onSelect={setSelected}
          speed={clock.speed} onSpeed={clock.setSpeed} onResetTime={clock.resetToNow}
          showOrbit={showOrbit} onToggleOrbit={() => setShowOrbit((v) => !v)}
          follow={follow} onToggleFollow={() => setFollow((v) => !v)}
          cloudKey={cloudKey} onCloud={setCloudKey} cloudLoading={cloud.loading}
          onZoom={(close) => { if (close) setFollow(true); setZoomRequest({ close, id: Date.now() }) }}
        />
      </div>

      <div className="absolute right-6 top-6">
        <TelemetryPanel data={sat.loading ? null : telemetry} simTime={simTime} speed={clock.speed}
          cloudInfo={cloudKey && !cloud.loading ? { label: CLOUDS[cloudKey].label, count: cloud.satrecs.length, color: CLOUDS[cloudKey].color } : null} />
      </div>
    </div>
  )
}
