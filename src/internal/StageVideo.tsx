/**
 * StageVideo — a feature's looping video.
 *
 * No poster is ever drawn: the video is transparent until it can play, so the plain
 * stage colour shows underneath, and it fades in on its first frame. Keyed by source:
 * React does not reload a <video> when only its <source> changes, so two adjacent video
 * features used to keep playing the first one. Playback is left to the user when they
 * prefer reduced motion.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { videoMimeType } from './media'
import type { ResponsiveVideo } from '../ProductViewer.types'

export interface StageVideoProps {
  video: ResponsiveVideo
  /** `contain` letterboxes on a stage of another aspect; `cover` fills it (default) */
  fit?: 'contain' | 'cover'
  /** Painted behind letterboxed frames */
  backgroundColor?: string
}

const FADE_IN = '0.5s'

export function StageVideo({ video, fit = 'cover', backgroundColor }: StageVideoProps) {
  const reducedMotion = useReducedMotion()
  const type = videoMimeType(video.src)
  const [ready, setReady] = useState(false)
  const markReady = () => setReady(true)

  return (
    <video
      key={video.src}
      autoPlay={!reducedMotion}
      controls={!!reducedMotion}
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-label={video.alt ?? video.poster?.alt}
      // Whichever fires first: the first frame is decoded, or playback has begun
      onLoadedData={markReady}
      onPlaying={markReady}
      onError={markReady}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: fit,
        objectPosition: 'center',
        backgroundColor: ready ? backgroundColor : 'transparent',
        opacity: ready ? 1 : 0,
        transition: `opacity ${FADE_IN} ease`,
      }}
    >
      <source src={video.src} type={type} />
    </video>
  )
}
