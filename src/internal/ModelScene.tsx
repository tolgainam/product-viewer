/**
 * ModelScene — the three.js scene for a `model` feature.
 *
 * Kept in its own module so the 3D libraries load only when a model is opened
 * (see ModelViewer, which lazy-imports this file). Nothing here is imported by
 * the 2D paths, so installs without the optional 3D peers never touch it.
 *
 * Lighting is three-point plus contact shadows, done with plain lights rather than
 * drei's Environment presets: those fetch an HDRI from a CDN, and a shared component
 * should not depend on the network to render.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Center, Bounds, ContactShadows } from '@react-three/drei'
import { colors } from '../palette'

/** Backdrop when the content does not specify one */
const DEFAULT_BACKGROUND = colors.background.model

function Model({ src }: { src: string }) {
  const { scene } = useGLTF(src)
  return <primitive object={scene} />
}

export default function ModelScene({ src, background }: { src: string; background?: string }) {
  const backdrop = background || DEFAULT_BACKGROUND

  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 35 }}
      dpr={[1, 2]}
      shadows
      gl={{ antialias: true, toneMappingExposure: 1.15 }}
    >
      <color attach="background" args={[backdrop]} />

      {/* Three-point lighting: key, fill, and a rim light to pick out the silhouette */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />
      <directionalLight position={[-5, 2, -3]} intensity={0.8} color="#9ecfd8" />
      <spotLight position={[0, 3, -6]} angle={0.6} penumbra={1} intensity={2.4} color="#ffffff" />

      <Suspense fallback={null}>
        {/* Bounds fits the model to the viewport, so any GLB fills the card regardless of its own scale */}
        <Bounds fit clip observe margin={1.05}>
          <Center>
            <Model src={src} />
          </Center>
        </Bounds>
        <ContactShadows position={[0, -1.4, 0]} opacity={0.45} scale={12} blur={2.6} far={4} />
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
