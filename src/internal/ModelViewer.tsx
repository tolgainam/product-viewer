/**
 * ModelViewer — renders a 3D feature, degrading to its poster image.
 *
 * Two things can go wrong and both are handled here rather than thrown at the host app:
 * the model file may fail to load, or the three.js peers may be missing from the install.
 * Either way the card shows the poster instead of breaking the page.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { Component, Suspense, lazy, type ReactNode } from 'react'
import { colors } from '../palette'

const ModelScene = lazy(() => import('./ModelScene'))

interface BoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

class ModelBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn(
      '[ProductViewer] 3D model not shown. Install three, @react-three/fiber and @react-three/drei to enable model features.',
      error
    )
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export interface ModelViewerProps {
  /** URL of the .glb / .gltf file */
  src: string
  /** Canvas background colour */
  background?: string
  /** Image shown while loading, and if 3D is unavailable */
  poster?: string
}

export function ModelViewer({ src, background, poster }: ModelViewerProps) {
  /**
   * While the scene loads, show the plain backdrop rather than the poster: showing the
   * poster makes it flash for a moment and then swap to the canvas. The poster is the
   * last resort, for when 3D is genuinely unavailable.
   */
  const loading = (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: background || colors.background.model,
      }}
    />
  )

  const posterFallback = poster ? (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: background || colors.background.model,
        backgroundImage: `url("${poster}")`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  ) : (
    loading
  )

  return (
    <ModelBoundary fallback={posterFallback}>
      <Suspense fallback={loading}>
        <ModelScene src={src} background={background} />
      </Suspense>
    </ModelBoundary>
  )
}
