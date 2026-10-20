import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

// Modelos procedurales de baja complejidad (sin assets externos → 100% offline).
// Unidades locales ≈ metros·0.1; el grupo padre aplica la escala final.
const GOLD = '#c9a227', PANEL = '#1d4ed8', WHITE = '#e5e7eb', STEEL = '#9ca3af', DARK = '#374151'

const Panel = ({ size, position, rotation, color = PANEL }) => (
  <mesh position={position} rotation={rotation}>
    <boxGeometry args={[size[0], 0.02, size[1]]} />
    <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} emissive={color} emissiveIntensity={0.12} />
  </mesh>
)
const Cyl = ({ r, h, position, rotation, color = WHITE }) => (
  <mesh position={position} rotation={rotation}>
    <cylinderGeometry args={[r, r, h, 20]} />
    <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
  </mesh>
)
const Box = ({ size, position, color = WHITE }) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
  </mesh>
)

const Iss = () => (
  <group>
    <Box size={[3.4, 0.12, 0.12]} position={[0, 0, 0]} color={STEEL} />                 {/* truss */}
    <Cyl r={0.17} h={1.4} position={[0, 0, 0]} rotation={[0, 0, 0]} />                  {/* módulos */}
    <Cyl r={0.12} h={1.0} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} color={STEEL} />
    {[-1.5, -1.0, 1.0, 1.5].map((x) => (
      <group key={x}>
        <Panel size={[0.5, 1.5]} position={[x, 0, 0.85]} color={GOLD} />
        <Panel size={[0.5, 1.5]} position={[x, 0, -0.85]} color={GOLD} />
      </group>
    ))}
    <Panel size={[0.6, 0.3]} position={[0.5, 0.3, 0]} color={WHITE} />                  {/* radiadores */}
  </group>
)

const Hubble = () => (
  <group rotation={[0, 0, Math.PI / 2]}>
    <Cyl r={0.22} h={1.3} position={[0, 0, 0]} color={STEEL} />
    <Cyl r={0.28} h={0.5} position={[0, -0.9, 0]} color={DARK} />
    <Cyl r={0.2} h={0.12} position={[0, 0.7, 0]} color={GOLD} />
    <group rotation={[0, 0, -Math.PI / 2]}>
      <Panel size={[0.45, 1.1]} position={[0, 0, 0.9]} />
      <Panel size={[0.45, 1.1]} position={[0, 0, -0.9]} />
    </group>
  </group>
)

const Weather = () => (
  <group>
    <Box size={[0.5, 0.5, 1.2]} position={[0, 0, 0]} color={GOLD} />
    <Panel size={[0.9, 2.2]} position={[0.9, 0, -0.2]} />
    <Cyl r={0.04} h={0.7} position={[-0.3, 0.5, 0.4]} color={STEEL} />
    <Cyl r={0.2} h={0.06} position={[-0.3, 0.9, 0.4]} color={WHITE} />
  </group>
)

const Starlink = () => (
  <group>
    <Box size={[0.9, 0.05, 0.5]} position={[0, 0, 0]} color={DARK} />
    <Panel size={[0.8, 2.4]} position={[1.3, 0, 0]} />
  </group>
)

const Cubesat = () => (
  <group>
    <Box size={[0.4, 0.4, 0.4]} position={[0, 0, 0]} color={GOLD} />
    <Panel size={[0.4, 0.4]} position={[0.42, 0, 0]} />
    <Panel size={[0.4, 0.4]} position={[-0.42, 0, 0]} />
    <Cyl r={0.01} h={0.9} position={[0, 0.6, 0]} color={STEEL} />
  </group>
)

const Station = () => (
  <group>
    <Cyl r={0.15} h={1.8} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
    <Cyl r={0.12} h={1.0} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} color={STEEL} />
    <Panel size={[0.5, 1.6]} position={[0.9, 0, 0.8]} color={GOLD} />
    <Panel size={[0.5, 1.6]} position={[-0.9, 0, -0.8]} color={GOLD} />
  </group>
)

const Generic = () => (
  <group>
    <Box size={[0.5, 0.5, 0.7]} position={[0, 0, 0]} color={GOLD} />
    <Panel size={[0.5, 1.4]} position={[0.75, 0, 0]} />
    <Panel size={[0.5, 1.4]} position={[-0.75, 0, 0]} />
  </group>
)

const MODELS = { iss: Iss, hubble: Hubble, weather: Weather, starlink: Starlink, cubesat: Cubesat, station: Station, generic: Generic }

/** Modelo del satélite rotando lentamente. `scale` fija su tamaño exagerado en escena. */
export default function SatelliteModel({ type = 'generic', scale = 0.01 }) {
  const ref = useRef()
  const Model = MODELS[type] ?? Generic
  useFrame((_, dt) => { ref.current.rotation.y += dt * 0.35 })
  return (
    <group scale={scale}>
      <group ref={ref} rotation={[0.35, 0, 0.15]}><Model /></group>
    </group>
  )
}
