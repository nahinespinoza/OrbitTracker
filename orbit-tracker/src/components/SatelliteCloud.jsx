import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { propagate } from 'satellite.js'
import { EARTH_RADIUS_KM } from '../lib/orbit'

const BUDGET_MS = 4 // tiempo máximo de SGP4 por frame

// Puntos redondos con brillo suave; el tamaño se atenúa con la distancia a la cámara.
const vert = /* glsl */ `
  uniform float uSize; uniform float uPx;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(uSize * uPx * (4.0 / -mv.z), 1.5 * uPx, 6.0 * uPx);
    gl_Position = projectionMatrix * mv;
  }`
const frag = /* glsl */ `
  uniform vec3 uColor;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    gl_FragColor = vec4(uColor, pow(1.0 - d, 1.6));
  }`

/**
 * Nube de miles de satélites como un único THREE.Points (1 draw call).
 * SGP4 se reparte entre frames (presupuesto de ms) y, entre actualizaciones,
 * cada punto avanza por extrapolación lineal con su velocidad: invisible a esta escala.
 */
export default function SatelliteCloud({ satrecs, color, timeRef }) {
  const n = satrecs.length
  const pxRatio = useThree((s) => s.gl.getPixelRatio())
  const pointsRef = useRef()

  const store = useMemo(() => ({
    pos: new Float64Array(n * 3),   // km, ECI
    vel: new Float64Array(n * 3),   // km/s
    t: new Float64Array(n).fill(NaN), // instante (ms) de la última propagación; NaN = sin datos
    cursor: 0,
    ready: false,
    out: new Float32Array(n * 3),
  }), [n, satrecs])

  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(color) }, uSize: { value: 6 }, uPx: { value: pxRatio },
  }), [color, pxRatio])

  useFrame(() => {
    const now = timeRef.current
    const date = new Date(now)
    const { pos, vel, t, out } = store

    // 1) refresca satélites hasta agotar el presupuesto (todos, la primera vez)
    const start = performance.now()
    const first = !store.ready
    let done = 0
    while (done < n && (first || performance.now() - start < BUDGET_MS)) {
      const i = store.cursor
      const pv = propagate(satrecs[i], date)
      if (pv && pv.position) {
        pos[i * 3] = pv.position.x; pos[i * 3 + 1] = pv.position.y; pos[i * 3 + 2] = pv.position.z
        vel[i * 3] = pv.velocity.x; vel[i * 3 + 1] = pv.velocity.y; vel[i * 3 + 2] = pv.velocity.z
        t[i] = now
      } else {
        t[i] = NaN; pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 0; vel[i * 3] = vel[i * 3 + 1] = vel[i * 3 + 2] = 0
      }
      store.cursor = (i + 1) % n
      done++
    }

    store.ready = true

    // 2) extrapola todos al instante actual y pasa de ECI a ejes de escena (x, z, -y)
    for (let i = 0; i < n; i++) {
      const dt = Number.isNaN(t[i]) ? 0 : (now - t[i]) / 1000
      const j = i * 3
      out[j]     = (pos[j] + vel[j] * dt) / EARTH_RADIUS_KM
      out[j + 1] = (pos[j + 2] + vel[j + 2] * dt) / EARTH_RADIUS_KM
      out[j + 2] = -(pos[j + 1] + vel[j + 1] * dt) / EARTH_RADIUS_KM
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  if (!n) return null
  return (
    <points ref={pointsRef} key={n + color} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[store.out, 3]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vert} fragmentShader={frag} uniforms={uniforms}
        transparent depthWrite={false} blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
