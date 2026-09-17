/**
 * ModelScene — the three.js scene for a `model` feature.
 *
 * Kept in its own module so the 3D libraries load only when a model is opened
 * (see ModelViewer, which lazy-imports this file). Nothing here is imported by
 * the 2D paths, so installs without the optional 3D peers never touch it.
 *
 * The model is scaled to fit the visible area of the canvas (whatever its aspect) and
 * rested on a shadow plane, so the camera, lights and contact shadow are tuned once for
 * every GLB regardless of the units it was authored in. Lighting is three-point plus
 * contact shadows, done with plain lights rather than drei's Environment presets: those
 * fetch an HDRI from a CDN, and a shared component should not depend on the network.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { Suspense, useEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useGLTF, useProgress, OrbitControls, ContactShadows } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import { colors } from '../palette'

/** Backdrop when the content does not specify one */
const DEFAULT_BACKGROUND = colors.background.model

/** Share of the shorter viewport side the model's longest dimension may take */
const FILL = 0.78

export interface ModelSceneProps {
  src: string
  background?: string
  /** Download progress, 0–100, from three's loading manager */
  onProgress?: (progress: number) => void
  /** Called once the model has been added to the scene */
  onReady?: () => void
}

function Model({ src, onReady }: { src: string; onReady?: () => void }) {
  const { scene } = useGLTF(src)
  const viewport = useThree((state) => state.viewport)

  // The cached GLTF is never mutated: the fit is applied to a wrapper group, so another
  // viewer on the page can reuse the same scene.
  const { bounds, longest } = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    return { bounds: box, longest: Math.max(size.x, size.y, size.z) || 1 }
  }, [scene])

  useEffect(() => {
    onReady?.()
  }, [scene, onReady])

  // Visible world units at the origin; the shorter side keeps portrait canvases in frame
  const target = Math.min(viewport.width, viewport.height) * FILL
  const scale = target / longest
  const center = bounds.getCenter(new Vector3())
  const floor = -target / 2
  const position: [number, number, number] = [-center.x * scale, floor - bounds.min.y * scale, -center.z * scale]

  return (
    <>
      <group scale={scale} position={position}>
        <primitive object={scene} />
      </group>
      <ContactShadows position={[0, floor, 0]} opacity={0.45} scale={target * 4} blur={2.6} far={target * 1.5} />
    </>
  )
}

/** Reports three's global loading progress to the DOM loading bar */
function ProgressReporter({ onProgress }: { onProgress?: (progress: number) => void }) {
  const { progress, active } = useProgress()
  useEffect(() => {
    if (active) onProgress?.(progress)
  }, [progress, active, onProgress])
  return null
}

export default function ModelScene({ src, background, onProgress, onReady }: ModelSceneProps) {
  const backdrop = background || DEFAULT_BACKGROUND

  return (
    <Canvas
      camera={{ position: [0, 0.4, 3.6], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, toneMappingExposure: 1.15 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={[backdrop]} />

      {/* Three-point lighting: key, fill, and a rim light to pick out the silhouette */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 4]} intensity={2.2} />
      <directionalLight position={[-5, 2, -3]} intensity={0.8} color="#9ecfd8" />
      <spotLight position={[0, 3, -6]} angle={0.6} penumbra={1} intensity={2.4} color="#ffffff" />

      <ProgressReporter onProgress={onProgress} />
      <Suspense fallback={null}>
        <Model src={src} onReady={onReady} />
      </Suspense>

      {/* Slow idle rotation; panning and zooming stay off so the card keeps its framing */}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.9}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  )
}
