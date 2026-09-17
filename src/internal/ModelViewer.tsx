/**
 * ModelViewer — renders a 3D feature, degrading to its poster image.
 *
 * Until the model is on screen the card shows the plain backdrop and a loading bar:
 * never the poster, which used to flash for a frame and then get replaced by the canvas.
 * The backdrop is painted underneath the canvas too, so a transparent first WebGL frame
 * cannot show whatever was on the stage before.
 *
 * Two things can go wrong and both are handled here rather than thrown at the host app:
 * the model file may fail to load, or the three.js peers may be missing from the install.
 * Either way the card shows the poster instead of breaking the page.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { Component, Suspense, lazy, useCallback, useState, type ReactNode } from 'react'
import { colors } from '../palette'
import { useViewerStyles } from './styles'

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
    const missingPeer =
      error instanceof Error && /Cannot find module|Failed to (fetch|resolve)|not installed/i.test(error.message)
    console.warn(
      missingPeer
        ? '[ProductViewer] 3D model not shown: the three.js peers are missing. Install three, @react-three/fiber and @react-three/drei.'
        : '[ProductViewer] 3D model not shown: the model failed to load. Showing the poster instead.',
      error
    )
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Thin bar centred on the stage; determinate once the loader reports progress */
function LoadingBar({ progress }: { progress: number | null }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress ?? undefined}
      aria-busy
      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div className="pv-loading-track">
        <div
          className="pv-loading-fill"
          data-indeterminate={progress === null}
          style={progress === null ? undefined : { width: `${Math.max(4, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  )
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
  useViewerStyles()
  const backdrop = background || colors.background.model
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const handleReady = useCallback(() => setReady(true), [])
  const handleProgress = useCallback((value: number) => setProgress(value), [])

  const posterFallback = poster ? (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: backdrop,
        backgroundImage: `url("${poster}")`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  ) : null

  return (
    // The backdrop sits under everything: the lazy chunk, the canvas and the loading bar
    <div style={{ position: 'absolute', inset: 0, backgroundColor: backdrop }}>
      {/* Keyed by src so a failure on one model does not stick to the next one shown */}
      <ModelBoundary key={src} fallback={posterFallback}>
        <Suspense fallback={null}>
          <ModelScene src={src} background={backdrop} onProgress={handleProgress} onReady={handleReady} />
        </Suspense>
      </ModelBoundary>
      {!ready && <LoadingBar progress={progress} />}
    </div>
  )
}
