import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import SatelliteModel from './SatelliteModel'
import SatelliteCloud from './SatelliteCloud'
import { getOrbitPath, getState, getSunDirection } from '../lib/orbit'

const NEON = '#22d3ee'

/* ───────────── Shaders ───────────── */

// Tierra: mezcla día/noche según la posición real del Sol + brillo especular en océanos.
const earthVert = /* glsl */ `
  varying vec2 vUv; varying vec3 vWorldNormal; varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`
const earthFrag = /* glsl */ `
  uniform sampler2D dayMap, nightMap, specMap; uniform vec3 sunDir;
  varying vec2 vUv; varying vec3 vWorldNormal; varying vec3 vWorldPos;
  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float sun = dot(N, sunDir);
    float k = smoothstep(-0.12, 0.18, sun);            // transición suave del terminador
    vec3 day = texture2D(dayMap, vUv).rgb * (0.12 + 0.95 * max(sun, 0.0));
    vec3 night = texture2D(nightMap, vUv).rgb * 1.6;
    vec3 col = mix(night + texture2D(dayMap, vUv).rgb * 0.025, day, k);
    float spec = pow(max(dot(reflect(-sunDir, N), V), 0.0), 120.0) * texture2D(specMap, vUv).r;
    col += vec3(0.7, 0.85, 1.0) * spec * 0.35 * k;
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);   // halo interior cian
    col += vec3(0.13, 0.55, 0.85) * rim * 0.55 * (0.25 + 0.75 * k);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }`

// Atmósfera: esfera mayor, cara trasera, intensidad por Fresnel, mezcla aditiva.
const atmoVert = /* glsl */ `
  varying vec3 vN;
  void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const atmoFrag = /* glsl */ `
  varying vec3 vN;
  void main() {
    float i = pow(0.68 - dot(vN, vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(0.25, 0.7, 1.0, 1.0) * i * 0.75;
  }`

/* ───────────── Piezas de la escena ───────────── */

function Earth({ gmstRef, sunDirRef }) {
  const [day, night, spec] = useLoader(THREE.TextureLoader, [
    `${import.meta.env.BASE_URL}textures/earth_atmos_2048.jpg`,
    `${import.meta.env.BASE_URL}textures/earth_lights_2048.png`,
    `${import.meta.env.BASE_URL}textures/earth_specular_2048.jpg`,
  ])
  day.colorSpace = night.colorSpace = THREE.SRGBColorSpace
  day.anisotropy = 8

  const meshRef = useRef()
  const uniforms = useMemo(() => ({
    dayMap: { value: day }, nightMap: { value: night }, specMap: { value: spec },
    sunDir: { value: new THREE.Vector3(1, 0, 0) },
  }), [day, night, spec])

  useFrame(() => {
    meshRef.current.rotation.y = gmstRef.current          // rotación sidérea de la Tierra
    uniforms.sunDir.value.fromArray(sunDirRef.current)
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial vertexShader={earthVert} fragmentShader={earthFrag} uniforms={uniforms} />
      </mesh>
      <mesh scale={1.1}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          vertexShader={atmoVert} fragmentShader={atmoFrag}
          side={THREE.BackSide} blending={THREE.AdditiveBlending} transparent depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// Textura de resplandor radial generada en canvas (sin assets externos)
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 128
    const g = c.getContext('2d'); const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.25, 'rgba(34,211,238,0.8)')
    grad.addColorStop(1, 'rgba(34,211,238,0)')
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
}

// Marcador del satélite + línea al punto nadir + trayectoria orbital + control de cámara
const MODEL_SCALE = 0.008      // tamaño exagerado: a escala real sería invisible
const MODEL_SHOW_DIST = 0.4    // la cámara debe estar más cerca que esto para ver el modelo
const MODEL_ONLY_DIST = 0.15   // por debajo, se oculta el halo y queda solo el modelo

function SatelliteLayer({ satrec, model, timeRef, advance, showOrbit, follow, gmstRef, sunDirRef, controlsRef, zoomRequest }) {
  const glow = useGlowTexture()
  const markerRef = useRef()
  const haloRef = useRef()
  const modelRef = useRef()
  const dotRef = useRef()
  const sunLightRef = useRef()
  const camera = useThree((s) => s.camera)

  const nadirLine = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    return new THREE.Line(g, new THREE.LineBasicMaterial({ color: NEON, transparent: true, opacity: 0.5 }))
  }, [])
  const orbitLine = useMemo(
    () => new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#4ade80', transparent: true, opacity: 0.85 })),
    [],
  )
  const orbitStamp = useRef({ satrec: null, t: 0 })
  const zoomTarget = useRef(null) // distancia al centro de la Tierra hacia la que anima la cámara

  // botones "Ver modelo 3D" / "Vista global": zoom animado
  useEffect(() => {
    if (!zoomRequest) return
    const st = getState(satrec, new Date(timeRef.current))
    zoomTarget.current = zoomRequest.close && st ? Math.hypot(...st.scenePos) + 0.08 : 3.6
  }, [zoomRequest, satrec, timeRef])

  useFrame(({ clock }, dt) => {
    advance(Math.min(dt, 0.1))                    // evita saltos si la pestaña estuvo en segundo plano
    const date = new Date(timeRef.current)
    sunDirRef.current = getSunDirection(date)

    const st = getState(satrec, date)
    if (!st) return
    gmstRef.current = st.gmst
    const p = st.scenePos
    markerRef.current.position.fromArray(p)
    sunLightRef.current.position.fromArray(sunDirRef.current).multiplyScalar(10)

    // zoom cercano: cambia el punto/halo por el modelo 3D
    const camDist = camera.position.distanceTo(markerRef.current.position)
    const near = camDist < MODEL_SHOW_DIST
    modelRef.current.visible = near
    dotRef.current.visible = !near
    haloRef.current.visible = camDist > MODEL_ONLY_DIST
    haloRef.current.scale.setScalar((0.16 + 0.03 * Math.sin(clock.elapsedTime * 4)) * Math.min(1, camDist / 1.5))
    if (controlsRef.current) {
      // en modo seguimiento se permite acercarse hasta casi tocar el satélite
      controlsRef.current.minDistance = follow ? Math.hypot(...p) + 0.03 : 1.6
    }

    // línea satélite → superficie
    const len = Math.hypot(...p)
    const arr = nadirLine.geometry.attributes.position.array
    arr.set(p, 0); arr.set(p.map((c) => (c / len) * 1.001), 3)
    nadirLine.geometry.attributes.position.needsUpdate = true

    // órbita: se recalcula al cambiar de satélite o cada ~1/4 de periodo simulado
    const periodMs = ((2 * Math.PI) / satrec.no) * 60000
    const s = orbitStamp.current
    if (s.satrec !== satrec || Math.abs(timeRef.current - s.t) > periodMs / 4) {
      orbitLine.geometry.setFromPoints(getOrbitPath(satrec, new Date(timeRef.current - periodMs / 2)).map((q) => new THREE.Vector3(...q)))
      orbitStamp.current = { satrec, t: timeRef.current }
    }

    if (zoomTarget.current) {
      const len = camera.position.length()
      camera.position.setLength(len + (zoomTarget.current - len) * (1 - Math.exp(-dt * 4)))
      if (Math.abs(len - zoomTarget.current) < 0.002) zoomTarget.current = null
    }

    // modo seguimiento: gira suavemente la cámara hacia el satélite manteniendo la distancia
    if (follow) {
      const dist = camera.position.length()
      const target = new THREE.Vector3(...p).normalize().multiplyScalar(dist)
      // cerca del satélite el bloqueo es casi rígido; lejos, un giro suave
      camera.position.lerp(target, 1 - Math.exp(-dt * (dist < 1.4 ? 40 : 3)))
      camera.position.setLength(dist)
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight ref={sunLightRef} intensity={2.4} />
      <group ref={markerRef}>
        <mesh ref={dotRef}><sphereGeometry args={[0.014, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
        <group ref={modelRef} visible={false}><SatelliteModel key={model} type={model} scale={MODEL_SCALE} /></group>
        <sprite ref={haloRef}>
          <spriteMaterial map={glow} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
      <primitive object={nadirLine} />
      <primitive object={orbitLine} visible={showOrbit} />
    </>
  )
}

/* ───────────── Componente público ───────────── */

export default function Earth3D({ satrec, model, cloud, zoomRequest, timeRef, advance, showOrbit, follow }) {
  const gmstRef = useRef(0)
  const sunDirRef = useRef([1, 0, 0])
  const controlsRef = useRef()

  return (
    <Canvas camera={{ position: [0, 1.4, 3.6], fov: 45, near: 0.004, far: 200 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={['#0b0f19']} />
      <Stars radius={90} depth={50} count={5000} factor={4} fade speed={0.4} />
      <Suspense fallback={null}>
        <Earth gmstRef={gmstRef} sunDirRef={sunDirRef} />
      </Suspense>
      {cloud?.satrecs.length > 0 && <SatelliteCloud satrecs={cloud.satrecs} color={cloud.color} timeRef={timeRef} />}
      {satrec && (
        <SatelliteLayer
          satrec={satrec} model={model} controlsRef={controlsRef} zoomRequest={zoomRequest} timeRef={timeRef} advance={advance} showOrbit={showOrbit}
          follow={follow} gmstRef={gmstRef} sunDirRef={sunDirRef}
        />
      )}
      <OrbitControls ref={controlsRef} enablePan={false} minDistance={1.6} maxDistance={9} rotateSpeed={0.5} zoomSpeed={0.6} enableDamping />
    </Canvas>
  )
}
