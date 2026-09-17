/**
 * StageImage — the pictures behind the pills, with a load-gated crossfade.
 *
 * A stage state has up to two pictures: a background that fills the stage and a
 * foreground that is letterboxed and centred (a product shot, or a cut-out over a
 * backdrop). They crossfade as one layer.
 *
 * Each picture is a `<picture>` that picks the small/medium/large and 2x sources the
 * content carries and keeps its alt text. The incoming pictures are fetched by an
 * invisible layer first; only once they have loaded do they replace the visible layer,
 * so the outgoing picture stays until the new one is ready.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { IMAGE_BREAKPOINTS, srcSetFor, type StageMedia } from './media'
import type { ResponsiveImage } from '../ProductViewer.types'

/**
 * How the stage got from the previous state to this one; drives the mobile choreography.
 * `clear` means the stage is being handed to something that paints itself (a 3D canvas
 * or a video): the picture must leave at once, without an exit animation.
 */
export type StageTransition = 'initial' | 'fade' | 'expand' | 'collapse' | 'switch' | 'clear'

export interface StageCustom {
  transition: StageTransition
  /** A card is open */
  expanded: boolean
  /** A card is open over a background photograph — the mobile layout zooms it slightly */
  zoomed: boolean
}

interface PictureProps {
  image: ResponsiveImage
  fit: 'contain' | 'cover'
  onReady?: () => void
  style?: CSSProperties
}

function Picture({ image, fit, onReady, style }: PictureProps) {
  const imgRef = useRef<HTMLImageElement>(null)

  // A cached image can be complete before React attaches onLoad; report it anyway
  useEffect(() => {
    const el = imgRef.current
    if (el && el.complete && el.naturalWidth > 0) onReady?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <picture>
      <source media={`(min-width: ${IMAGE_BREAKPOINTS.large}px)`} srcSet={srcSetFor(image.large, image.large2x)} />
      <source media={`(min-width: ${IMAGE_BREAKPOINTS.medium}px)`} srcSet={srcSetFor(image.medium, image.medium2x)} />
      <img
        ref={imgRef}
        src={image.small}
        srcSet={srcSetFor(image.small, image.small2x)}
        alt={image.alt}
        decoding="async"
        draggable={false}
        onLoad={onReady}
        // A broken URL must not hold the previous picture on screen forever
        onError={onReady}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: fit,
          objectPosition: 'center',
          userSelect: 'none',
          ...style,
        }}
      />
    </picture>
  )
}

/** Margin around a letterboxed foreground, as a share of the stage */
const FOREGROUND_INSET_PCT = 5
const FOREGROUND_INSET = `${FOREGROUND_INSET_PCT}%`

/** Both pictures of a stage state, background under foreground */
function Layer({ media, onReady }: { media: StageMedia; onReady?: () => void }) {
  const expected = (media.background ? 1 : 0) + (media.foreground ? 1 : 0)
  const loaded = useRef(0)
  const report = () => {
    loaded.current += 1
    if (loaded.current >= expected) onReady?.()
  }
  return (
    <>
      {media.background && <Picture image={media.background} fit="cover" onReady={onReady && report} />}
      {media.foreground && (
        <Picture
          image={media.foreground}
          fit="contain"
          onReady={onReady && report}
          // Breathing room so a cut-out never touches the stage edge
          style={{ inset: FOREGROUND_INSET, width: `${100 - 2 * FOREGROUND_INSET_PCT}%`, height: `${100 - 2 * FOREGROUND_INSET_PCT}%` }}
        />
      )}
    </>
  )
}

interface Shown {
  media: StageMedia
  custom: StageCustom
}

export interface StageImageProps {
  media: StageMedia | null
  /** Whether a card is currently open */
  expanded: boolean
  /** Enter/center/exit variants; each receives {@link StageCustom} */
  variants: Variants
}

/** How long the outgoing picture may wait for the incoming one to load */
const LOAD_GRACE_MS = 1500

const mediaKey = (media: StageMedia | null) =>
  media && (media.background || media.foreground) ? `${media.background?.large ?? ''}|${media.foreground?.large ?? ''}` : ''

function classify(prev: Shown | null, expanded: boolean): StageTransition {
  if (!prev) return 'initial'
  if (!prev.custom.expanded && expanded) return 'expand'
  if (prev.custom.expanded && !expanded) return 'collapse'
  if (prev.custom.expanded && expanded) return 'switch'
  return 'fade'
}

export function StageImage({ media, expanded, variants }: StageImageProps) {
  const targetKey = mediaKey(media)
  const [shown, setShown] = useState<Shown | null>(() =>
    media && targetKey ? { media, custom: { transition: 'initial', expanded, zoomed: expanded && !!media.background } } : null
  )

  const shownKey = mediaKey(shown?.media ?? null)
  const pending = media && targetKey && targetKey !== shownKey ? media : null

  // Nothing to show: drop the layer immediately rather than waiting for a load
  useEffect(() => {
    if (!targetKey && shown) setShown(null)
  }, [targetKey, shown])

  const reveal = () => {
    if (!pending) return
    setShown((prev) => ({
      media: pending,
      custom: { transition: classify(prev, expanded), expanded, zoomed: expanded && !!pending.background },
    }))
  }

  // A very slow image should not pin the previous picture on screen: after a grace period
  // the crossfade starts anyway and the image fills in when it arrives.
  const revealRef = useRef(reveal)
  revealRef.current = reveal
  useEffect(() => {
    if (!targetKey || targetKey === shownKey) return
    const timer = setTimeout(() => revealRef.current(), LOAD_GRACE_MS)
    return () => clearTimeout(timer)
  }, [targetKey, shownKey])

  // The visible layer follows the live expanded flag (a colour feature keeps the same image
  // but still zooms); the exit choreography follows the incoming transition.
  // Only a backdrop that fills the stage may zoom; a cut-out or product shot would be cropped
  const zoomed = expanded && !!shown?.media.background
  const liveCustom: StageCustom = !targetKey
    ? { transition: 'clear', expanded, zoomed }
    : shown
      ? { transition: shown.custom.transition, expanded, zoomed }
      : { transition: 'initial', expanded, zoomed }

  return (
    <>
      <AnimatePresence initial={false} custom={liveCustom}>
        {shown && (
          <motion.div
            key={shownKey}
            custom={liveCustom}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{ position: 'absolute', inset: 0, willChange: 'opacity, transform' }}
          >
            <Layer media={shown.media} />
          </motion.div>
        )}
      </AnimatePresence>

      {pending && (
        <div
          aria-hidden
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}
        >
          <Layer key={targetKey} media={pending} onReady={reveal} />
        </div>
      )}
    </>
  )
}
