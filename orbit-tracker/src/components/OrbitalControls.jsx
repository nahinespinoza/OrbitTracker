import { useState } from 'react'
import {
  Crosshair, Eye, EyeOff, Globe2, Radio, Rocket, Satellite, Telescope, Timer,
  CloudSun, Box, ZoomIn,
} from 'lucide-react'
import { CATEGORIES, CLOUDS, SATELLITES } from '../data/catalog'

const MODEL_ICONS = { iss: Rocket, hubble: Telescope, station: Rocket, weather: CloudSun, starlink: Satellite, cubesat: Box, generic: Radio }
const SPEEDS = [1, 10, 100, 500]

function Btn({ active, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold uppercase tracking-wider transition
        active:scale-95 ${active
          ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan shadow-[0_0_16px_rgba(34,211,238,0.45)]'
          : 'border-white/10 bg-white/5 text-slate-300 hover:border-neon-cyan/50 hover:text-white'} ${className}`}
    >
      {children}
    </button>
  )
}

const Label = ({ children }) => (
  <h3 className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 first:mt-0">{children}</h3>
)

/** Panel lateral: categorías + selector de satélite, velocidad temporal y toggles de visualización. */
export default function OrbitalControls({
  selected, onSelect, speed, onSpeed, onResetTime,
  showOrbit, onToggleOrbit, follow, onToggleFollow, onZoom,
  cloudKey, onCloud, cloudLoading,
}) {
  const [category, setCategory] = useState(SATELLITES[selected].category)
  const visible = Object.entries(SATELLITES).filter(([, s]) => s.category === category)

  return (
    <aside className="glass flex max-h-full min-h-0 w-72 flex-col overflow-y-auto rounded-2xl p-5">
      <Label>Categoría</Label>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(CATEGORIES).map(([key, { label }]) => (
          <Btn key={key} active={category === key} onClick={() => setCategory(key)} className="!px-1 !py-2 text-[10px]">
            {label}
          </Btn>
        ))}
      </div>

      <Label>Objetivo</Label>
      <div className="grid grid-cols-2 gap-2">
        {visible.map(([key, { label, model }]) => {
          const Icon = MODEL_ICONS[model] ?? Satellite
          return (
            <Btn key={key} active={selected === key} onClick={() => onSelect(key)} className="flex-col !py-3 text-xs">
              <Icon size={20} /> {label}
            </Btn>
          )
        })}
      </div>

      <Label>Nube de satélites</Label>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(CLOUDS).map(([key, { label, color }]) => (
          <Btn key={key} active={cloudKey === key} onClick={() => onCloud(cloudKey === key ? null : key)} className="!px-1 !py-2 text-[10px]">
            <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
            {cloudKey === key && cloudLoading ? 'Cargando…' : label}
          </Btn>
        ))}
        <Btn active={!cloudKey} onClick={() => onCloud(null)} className="!px-1 !py-2 text-[10px]">Solo uno</Btn>
      </div>

      <Label>Velocidad del tiempo</Label>
      <div className="grid grid-cols-4 gap-2">
        {SPEEDS.map((s) => (
          <Btn key={s} active={speed === s} onClick={() => onSpeed(s)} className="!px-0 text-xs">{s}x</Btn>
        ))}
      </div>
      <Btn onClick={onResetTime} className="mt-2 w-full text-xs"><Timer size={15} /> Volver a ahora</Btn>

      <Label>Visualización</Label>
      <div className="grid gap-2">
        <Btn active={showOrbit} onClick={onToggleOrbit} className="text-xs">
          {showOrbit ? <Eye size={16} /> : <EyeOff size={16} />} Trayectoria orbital
        </Btn>
        <Btn active={follow} onClick={onToggleFollow} className="text-xs">
          <Crosshair size={16} /> Seguir satélite
        </Btn>
        <div className="grid grid-cols-2 gap-2">
          <Btn onClick={() => onZoom(true)} className="!px-1 text-[10px]"><ZoomIn size={15} /> Ver modelo 3D</Btn>
          <Btn onClick={() => onZoom(false)} className="!px-1 text-[10px]"><Globe2 size={15} /> Vista global</Btn>
        </div>
      </div>
    </aside>
  )
}
