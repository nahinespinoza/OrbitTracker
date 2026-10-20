import { Activity, Gauge, Globe2, MoveVertical, Compass } from 'lucide-react'

const fmtCoord = (v, pos, neg) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`

function Row({ icon: Icon, label, value, unit, color = 'text-neon-cyan' }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-white/5 py-2.5 last:border-0">
      <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
        <Icon size={14} className={color} /> {label}
      </span>
      <span className={`font-bold tabular-nums ${color}`}>
        {value} <span className="text-xs font-normal text-slate-500">{unit}</span>
      </span>
    </div>
  )
}

/** HUD flotante con la telemetría en vivo. `data` = { name, lat, lon, altKm, speedKmh, source } */
export default function TelemetryPanel({ data, simTime, speed, cloudInfo }) {
  const live = data?.source === 'live'
  return (
    <section className="glass w-80 rounded-2xl p-5">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold tracking-wider text-white glow-cyan">
          {data?.name || 'ACQUIRING…'}
        </h2>
        <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${live ? 'text-neon-green' : 'text-amber-400'}`}>
          <span className={`h-2 w-2 animate-pulse rounded-full ${live ? 'bg-neon-green' : 'bg-amber-400'}`} />
          {live ? 'Live TLE' : 'Offline TLE'}
        </span>
      </header>

      {data ? (
        <div className="text-lg">
          <Row icon={Compass} label="Latitud" value={fmtCoord(data.lat, 'N', 'S')} />
          <Row icon={Globe2} label="Longitud" value={fmtCoord(data.lon, 'E', 'W')} />
          <Row icon={MoveVertical} label="Altitud" value={data.altKm.toFixed(1)} unit="km" color="text-neon-green" />
          <Row icon={Gauge} label="Velocidad" value={Math.round(data.speedKmh).toLocaleString('en-US')} unit="km/h" color="text-neon-green" />
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-slate-500">Calculando órbita…</p>
      )}

      {cloudInfo && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
          <span className="uppercase tracking-widest text-slate-400">{cloudInfo.label}</span>
          <span className="font-bold tabular-nums" style={{ color: cloudInfo.color }}>{cloudInfo.count.toLocaleString('en-US')} obj.</span>
        </div>
      )}

      <footer className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><Activity size={13} className="text-neon-cyan" /> {simTime}</span>
        <span className={speed > 1 ? 'font-bold text-neon-red' : ''}>{speed}x</span>
      </footer>
    </section>
  )
}
