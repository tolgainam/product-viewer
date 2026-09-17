/**
 * ProductViewerMobile Component
 *
 * Mobile/Tablet layout for ProductViewer with Apple-inspired pill navigation.
 * Features:
 * - Full-width stage with the product or feature media behind the pills
 * - One pill strip for every state: pills are positioned with transforms, so a pill
 *   animates into its card in place and neighbours slide to the edges
 * - The strip is draggable while collapsed; an open card can be swiped to its neighbours
 * - One tap opens a pill; strip scroll, pill position, width and card height share one
 *   timing so the row is always consistent, and text only shows in a card at rest
 *
 * Positions are computed from the viewer's own width (not the viewport) and from the
 * measured label widths, which are re-measured whenever they change — including after a
 * web font loads.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
  type PanInfo,
  type Variants,
} from 'framer-motion'
import { Text } from './internal/Text'
import { ColorSelector } from './internal/ColorSelector'
import { getGlassEffectSx } from './internal/glass-effects'
import { useElementWidth, useResizeCallback } from './internal/hooks'
import { StageImage, type StageCustom } from './internal/StageImage'
import { StageVideo } from './internal/StageVideo'
import { formatLabel, stageBackgroundFor, stageMediaFor } from './internal/media'
import { cx, useViewerStyles } from './internal/styles'
import { stateColors, type ProductViewerLayoutProps, type ViewerItem } from './internal/viewer-items'
import type { ProductViewerVisualConfig } from './ProductViewer.types'

// Layout constants (px)
const PILL_GAP = 16 // Gap between pills
const STRIP_PADDING = 16 // Strip padding at both ends
const DEFAULT_NEIGHBOR_PEEK = 32 // How much of the neighbour pills shows at the edges when a card is open
const PILL_PADDING_X = 16 // Horizontal padding inside a pill
const HEADER_GAP = 12 // Gap between icon, label and chevron slot
const ICON_SLOT = 24 // Icon / chevron slot size
const CHEVRON_OVERHANG = 8 // Chevron slots hang 8px into the padding
const PILL_HEIGHT = 48 // Collapsed pill height (24 header + 2 × 12 padding)
const STRIP_BOTTOM = 24 // Distance of the strip from the stage bottom
const MIN_CARD_WIDTH = 160
const MAX_CARD_WIDTH = 520 // Tablets: a card wider than this reads as a banner, not a card
const SWIPE_DISTANCE = 48
const SWIPE_VELOCITY = 350

let dvhSupport: boolean | null = null
const supportsDvh = () => {
  if (dvhSupport === null) {
    dvhSupport = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('height', '1dvh')
  }
  return dvhSupport
}

/** Collapsed pill width from its measured icon + label span */
const pillWidthFor = (labelSpanWidth: number) =>
  Math.round(labelSpanWidth + PILL_PADDING_X * 2 + HEADER_GAP + ICON_SLOT - CHEVRON_OVERHANG)

/**
 * Animation Configuration - Mobile
 * Centralized settings for all animations in ProductViewerMobile
 */
const EASE_OUT_SOFT = [0.32, 0.72, 0, 1] as const
const EASE_MOVE = [0.25, 0.1, 0.25, 1] as const

/**
 * One timing for everything that changes the strip's geometry — strip scroll, pill
 * position, pill width and card height. Each frame is then a blend of two valid rows,
 * so pills can never overlap, and a card never travels at a different speed from its
 * own resizing.
 */
const MOVE = { duration: 0.6, ease: EASE_MOVE } as const

const MOBILE_ANIMATIONS = {
  // Strip scroll, pill position and width, card height
  move: MOVE,
  // Card text: out fast before the card shrinks, in after the card has arrived
  contentOut: { duration: 0.15 },
  contentIn: { duration: 0.25, delay: MOVE.duration - 0.1 },
  // Stage pictures follow the cards: same timing, a beat behind
  stage: { duration: MOVE.duration, ease: MOVE.ease, delay: 0.05 },
  // Pill background colour transitions
  pillBackground: { duration: 0.3, ease: EASE_OUT_SOFT },
  // Close button
  closeButton: { duration: 0.2 },
  // Container background colour
  backgroundColor: { duration: '0.5s', ease: 'ease' },
} as const

/** Stage choreography: zoom in on expand, slide between cards, zoom out on collapse */
const STAGE_VARIANTS: Variants = {
  enter: ({ transition }: StageCustom) =>
    transition === 'switch'
      ? { opacity: 0, scale: 1.2, x: 40 } // Arrives from the right, fading in
      : transition === 'collapse'
        ? { opacity: 0, scale: 1.2, x: 0 } // Product starts invisible at 120% and settles
        : { opacity: 0, scale: 1, x: 0 },
  center: ({ zoomed }: StageCustom) => ({
    opacity: 1,
    scale: zoomed ? 1.2 : 1,
    x: 0,
    transition: MOBILE_ANIMATIONS.stage,
  }),
  // The outgoing picture leaves in half the time the incoming one takes to arrive, so the
  // two are never both solid on the stage
  exit: ({ transition }: StageCustom) => ({
    ...(transition === 'clear'
      ? { opacity: 0 } // A 3D canvas or video is taking over: leave at once
      : transition === 'expand'
        ? { opacity: 0, scale: 1.2, x: 0 } // Product fades out while enlarging
        : transition === 'switch'
          ? { opacity: 0, scale: 1.2, x: -40 } // Leaves to the left
          : transition === 'collapse'
            ? { opacity: 0, scale: 1, x: 0 } // Feature scales down while fading
            : { opacity: 0 }),
    transition:
      transition === 'clear' ? { duration: 0 } : { ...MOBILE_ANIMATIONS.stage, duration: MOBILE_ANIMATIONS.stage.duration / 2 },
  }),
}

// ============================================================================
// Pill
// ============================================================================

const iconSlotStyle: CSSProperties = {
  width: ICON_SLOT,
  height: ICON_SLOT,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const fill: CSSProperties = { position: 'absolute', inset: 0 }

interface MobilePillProps {
  item: ViewerItem
  label: string
  contentId: string
  x: number
  /** Explicit width once labels are measured; the card width when active */
  width: number | null
  isActive: boolean
  isLeftNeighbor: boolean
  isRightNeighbor: boolean
  swatchColor?: string
  contentWidth: number
  visualConfig: ProductViewerVisualConfig
  onTap: (item: ViewerItem) => void
  onLabelWidth: (id: string, width: number) => void
  onSwipe: (direction: 'previous' | 'next') => void
  onPanStateChange: (panning: boolean) => void
  children: ReactNode
}

const MobilePill = memo(function MobilePill({
  item,
  label,
  contentId,
  x,
  width,
  isActive,
  isLeftNeighbor,
  isRightNeighbor,
  swatchColor,
  contentWidth,
  visualConfig,
  onTap,
  onLabelWidth,
  onSwipe,
  onPanStateChange,
  children,
}: MobilePillProps) {
  const labelRef = useRef<HTMLSpanElement>(null)
  const id = item.id
  const reportWidth = useCallback((w: number) => onLabelWidth(id, w), [onLabelWidth, id])
  useResizeCallback(labelRef, reportWidth)

  const pillColors = stateColors(visualConfig.pill.backgroundColor, ['default', 'hover', 'active'])
  const pillRadius = typeof visualConfig.pill.borderRadius === 'number' ? visualConfig.pill.borderRadius : 24
  const radius = isActive ? Math.min(16, pillRadius) : pillRadius
  const textColor = isActive ? visualConfig.expandedCard.textColor : visualConfig.pill.textColor
  const { expandIcon: ExpandIcon, closeIcon: CloseIcon, chevronLeftIcon: ChevronLeft, chevronRightIcon: ChevronRight } =
    visualConfig.pill.icons

  const handlePanEnd = (_event: PointerEvent, info: PanInfo) => {
    onPanStateChange(false)
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) onSwipe('next')
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) onSwipe('previous')
  }

  return (
    <motion.div
      initial={false}
      animate={width !== null ? { x, width, borderRadius: radius } : { x, borderRadius: radius }}
      transition={{
        x: MOBILE_ANIMATIONS.move,
        width: MOBILE_ANIMATIONS.move,
        borderRadius: MOBILE_ANIMATIONS.move,
      }}
      onPanStart={isActive ? () => onPanStateChange(true) : undefined}
      onPanEnd={isActive ? handlePanEnd : undefined}
      style={{
        position: 'absolute',
        bottom: 0,
        width: width ?? 'auto',
        overflow: 'hidden',
        zIndex: isActive ? 10 : 1,
        // Hidden until the label is measured, so pills never flash at estimated positions
        visibility: width === null ? 'hidden' : 'visible',
        touchAction: isActive ? 'pan-y' : undefined,
      }}
    >
      <motion.div
        initial={false}
        animate={{ backgroundColor: isActive ? pillColors.active : pillColors.default }}
        transition={{ duration: MOBILE_ANIMATIONS.pillBackground.duration, ease: MOBILE_ANIMATIONS.pillBackground.ease }}
        style={{
          ...getGlassEffectSx({
            type: isActive ? visualConfig.expandedCard.glassEffect : visualConfig.pill.glassEffect,
            intensity: isActive ? visualConfig.expandedCard.glassIntensity : visualConfig.pill.glassIntensity,
          }),
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: radius,
          color: textColor,
        }}
      >
        {/* Header row: a real button, so the card is a keyboard-operable disclosure */}
        <button
          type="button"
          className={cx('pv-reset', 'pv-btn')}
          aria-expanded={isActive}
          aria-controls={contentId}
          onClick={() => onTap(item)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: HEADER_GAP,
            width: '100%',
            height: PILL_HEIGHT,
            boxSizing: 'border-box',
            padding: `12px ${PILL_PADDING_X}px`,
            whiteSpace: 'nowrap',
          }}
        >
          {/* Icon + label: measured for the collapsed pill width */}
          <span ref={labelRef} style={{ display: 'inline-flex', alignItems: 'center', gap: HEADER_GAP }}>
            {/* Icon slot 1: colour swatch, expand/close icon, or the right neighbour's chevron */}
            {item.type === 'color' ? (
              <span
                aria-hidden
                style={{
                  ...iconSlotStyle,
                  backgroundColor: swatchColor,
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  boxSizing: 'border-box',
                  visibility: isLeftNeighbor ? 'hidden' : 'visible',
                }}
              />
            ) : (
              <span
                aria-hidden
                style={{
                  ...iconSlotStyle,
                  backgroundColor: isRightNeighbor ? 'transparent' : visualConfig.expandedCard.backgroundColor,
                  color: isRightNeighbor ? visualConfig.pill.textColor : visualConfig.expandedCard.textColor,
                  visibility: isLeftNeighbor ? 'hidden' : 'visible',
                  marginLeft: isRightNeighbor ? -CHEVRON_OVERHANG : 0,
                  transition: 'background-color 0.3s ease',
                }}
              >
                {isRightNeighbor ? (
                  <ChevronRight size={16} aria-hidden />
                ) : isActive ? (
                  <CloseIcon size={14} aria-hidden />
                ) : (
                  <ExpandIcon size={14} aria-hidden />
                )}
              </span>
            )}

            <Text
              variant="body2"
              component="span"
              text={label}
              style={{ color: textColor, fontWeight: 500, lineHeight: '24px' }}
            />
          </span>

          {/* Icon slot 2: the left neighbour's chevron */}
          <span
            aria-hidden
            style={{
              ...iconSlotStyle,
              color: visualConfig.pill.textColor,
              visibility: isLeftNeighbor ? 'visible' : 'hidden',
              marginRight: -CHEVRON_OVERHANG,
            }}
          >
            <ChevronLeft size={16} aria-hidden />
          </span>
        </button>

        {/* Expanded content: the inner block is laid out at the final card width from the
            start, so its wrapped height is right while the outer width is still animating */}
        <AnimatePresence initial={false}>
          {isActive && (
            <motion.div
              key={contentId}
              id={contentId}
              role="region"
              aria-label={label}
              initial={{ height: 0, opacity: 0 }}
              // Card grows with the move; text fades in once it has arrived
              animate={{ height: 'auto', opacity: 1, transition: { height: MOBILE_ANIMATIONS.move, opacity: MOBILE_ANIMATIONS.contentIn } }}
              // Text goes first, then the card shrinks with the move
              exit={{ height: 0, opacity: 0, transition: { height: MOBILE_ANIMATIONS.move, opacity: MOBILE_ANIMATIONS.contentOut } }}
              style={{ overflow: 'hidden', width: '100%' }}
            >
              <div style={{ width: contentWidth, boxSizing: 'border-box', padding: `0 ${PILL_PADDING_X}px 12px` }}>
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
})

// ============================================================================
// Layout
// ============================================================================

export const ProductViewerMobile = forwardRef<HTMLDivElement, ProductViewerLayoutProps>(
  (
    {
      hero,
      variants,
      features,
      items,
      selectedVariantId,
      expandedFeatureIndex,
      activeItemIndex,
      onVariantChange,
      onFeatureToggle,
      onPrevious,
      onNext,
      onClose,
      visualConfig,
      labels,
      modelRenderer,
    },
    ref
  ) => {
    useViewerStyles()
    const idPrefix = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    useImperativeHandle(ref, () => rootRef.current as HTMLDivElement, [])
    const reducedMotion = useReducedMotion()

    // Width of the viewer itself; the viewport only stands in until the first measurement
    const measuredWidth = useElementWidth(rootRef)
    const containerWidth =
      measuredWidth && measuredWidth > 0 ? measuredWidth : typeof window !== 'undefined' ? window.innerWidth : 375

    // Core state
    const [labelWidths, setLabelWidths] = useState<Record<string, number>>({})
    const scrollX = useMotionValue(0) // Strip offset while collapsed; 0 while a card is open
    const scrollAnimation = useRef<AnimationPlaybackControls | null>(null)
    const lastActiveRef = useRef<number | null>(null)
    const wasActiveRef = useRef(false)
    const panningRef = useRef(false) // Suppresses the click that follows a drag or swipe

    // Derived state
    const selectedVariant = variants.find((v) => v.id === selectedVariantId)
    const expandedFeature = expandedFeatureIndex >= 0 ? (features[expandedFeatureIndex] ?? null) : null
    const hasActiveItem = activeItemIndex >= 0

    const neighborPeek = visualConfig.expandedCard.neighborPeek ?? DEFAULT_NEIGHBOR_PEEK
    const expandedCardWidth = Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_WIDTH, containerWidth - neighborPeek * 2 - STRIP_PADDING * 2))

    // Pill widths from the measured labels
    const pillWidths = useMemo(
      () => items.map((item) => (labelWidths[item.id] ? pillWidthFor(labelWidths[item.id]) : null)),
      [items, labelWidths]
    )
    const hasMeasured = pillWidths.length > 0 && pillWidths.every((w) => w !== null)
    const widthOf = useCallback((i: number) => pillWidths[i] ?? 120, [pillWidths])

    // Collapsed row geometry
    const baseX = useMemo(() => {
      let x = STRIP_PADDING
      return items.map((_, i) => {
        const current = x
        x += widthOf(i) + PILL_GAP
        return current
      })
    }, [items, widthOf])
    const totalWidth = baseX.length ? baseX[baseX.length - 1] + widthOf(baseX.length - 1) + STRIP_PADDING : 0
    const scrollMin = Math.min(0, containerWidth - totalWidth)
    const fitsWithoutScrolling = scrollMin === 0

    const clampScroll = useCallback((offset: number) => Math.max(scrollMin, Math.min(0, offset)), [scrollMin])
    const offsetToCenter = useCallback(
      (i: number) => clampScroll(containerWidth / 2 - (baseX[i] + widthOf(i) / 2)),
      [clampScroll, containerWidth, baseX, widthOf]
    )

    const animateScroll = useCallback(
      (to: number) => {
        scrollAnimation.current?.stop()
        scrollAnimation.current = animate(scrollX, to, {
          duration: reducedMotion ? 0 : MOBILE_ANIMATIONS.move.duration,
          ease: MOBILE_ANIMATIONS.move.ease,
        })
      },
      [scrollX, reducedMotion]
    )
    useEffect(() => () => scrollAnimation.current?.stop(), [])

    // Opening: the strip slides home and pills take their card positions.
    // Closing: the strip scrolls so the card that was open is centred again.
    useEffect(() => {
      if (hasActiveItem) {
        lastActiveRef.current = activeItemIndex
        if (!wasActiveRef.current) animateScroll(0)
      } else if (wasActiveRef.current && lastActiveRef.current !== null) {
        animateScroll(offsetToCenter(lastActiveRef.current))
      }
      wasActiveRef.current = hasActiveItem
      // offsetToCenter changes with geometry; only state changes should drive this effect
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasActiveItem, activeItemIndex, animateScroll])

    // Geometry changed (resize, font load): keep the collapsed strip inside its bounds
    useEffect(() => {
      if (hasActiveItem) return
      const clamped = clampScroll(scrollX.get())
      if (clamped !== scrollX.get()) scrollX.set(clamped)
    }, [clampScroll, hasActiveItem, scrollX])

    const stageMedia = stageMediaFor({ hero, selectedVariant, expandedFeature, hasModelRenderer: !!modelRenderer })
    const containerBackgroundColor = stageBackgroundFor(visualConfig, selectedVariant, expandedFeature)
    const closeColors = stateColors(visualConfig.closeButton.backgroundColor, ['default', 'hover'])
    const CloseIcon = visualConfig.pill.icons.closeIcon

    // Capitalised binding so JSX treats the injected renderer as a component
    const ModelRendererComponent = modelRenderer

    /**
     * Tap: a pill opens (the strip slides home as part of the same move); the open
     * header closes; another pill while open switches to it.
     */
    const handlePillTap = useCallback(
      (item: ViewerItem) => {
        if (panningRef.current) return
        const position = items.indexOf(item)
        if (hasActiveItem && position === activeItemIndex) onClose()
        else onFeatureToggle(item.index)
      },
      [items, hasActiveItem, activeItemIndex, onClose, onFeatureToggle]
    )

    const handleLabelWidth = useCallback((id: string, width: number) => {
      if (width <= 0) return
      setLabelWidths((prev) => (prev[id] === width ? prev : { ...prev, [id]: width }))
    }, [])

    const handleSwipe = useCallback(
      (direction: 'previous' | 'next') => (direction === 'next' ? onNext() : onPrevious()),
      [onNext, onPrevious]
    )

    const handlePanStateChange = useCallback((panning: boolean) => {
      if (panning) panningRef.current = true
      // The click fires right after pointerup; clear on the next tick so it is swallowed
      else setTimeout(() => (panningRef.current = false), 0)
    }, [])

    // Where each pill sits: card positions while open, the scrolled row while collapsed
    const positions = useMemo(() => {
      if (!hasActiveItem) return baseX
      return items.map((_, i) => {
        if (i === activeItemIndex) return (containerWidth - expandedCardWidth) / 2
        if (i < activeItemIndex) {
          // Right edge of the immediate left neighbour peeks in; the rest stack further out
          let rightEdge = neighborPeek
          for (let k = i + 1; k < activeItemIndex; k++) rightEdge -= widthOf(k) + PILL_GAP
          return rightEdge - widthOf(i)
        }
        let left = containerWidth - neighborPeek
        for (let k = activeItemIndex + 1; k < i; k++) left += widthOf(k) + PILL_GAP
        return left
      })
    }, [hasActiveItem, baseX, items, activeItemIndex, containerWidth, expandedCardWidth, neighborPeek, widthOf])

    // dvh tracks the mobile URL bar; older browsers get vh
    const stageHeight = supportsDvh() ? '85dvh' : '85vh'

    const colorSelector = (
      <>
        <Text
          variant="body2"
          text={formatLabel(labels.displayedIn, { product: hero.name, variant: selectedVariant?.label })}
          style={{
            color: visualConfig.expandedCard.textColor,
            opacity: visualConfig.expandedCard.descriptionOpacity,
            lineHeight: 1.5,
            marginBottom: 12,
            whiteSpace: 'normal',
          }}
        />
        <ColorSelector
          hideLabel
          colors={variants.map((v) => ({ id: v.id, name: v.label, value: v.colorHex }))}
          selectedColorId={selectedVariantId}
          onColorChange={onVariantChange}
          maxVisible={100}
          groupLabel={labels.colorOptions}
          swatchLabel={labels.selectColor}
          unavailableLabel={labels.unavailable}
        />
      </>
    )

    return (
      <div
        ref={rootRef}
        style={{
          position: 'relative',
          width: '100%',
          height: stageHeight,
          minHeight: 480,
          maxHeight: 700,
          overflow: 'hidden',
          backgroundColor: containerBackgroundColor,
          transition: `background-color ${MOBILE_ANIMATIONS.backgroundColor.duration} ${MOBILE_ANIMATIONS.backgroundColor.ease}`,
        }}
      >
        {/* Stage picture with expand / switch / collapse choreography */}
        <div style={{ ...fill, overflow: 'hidden' }}>
          <StageImage media={stageMedia} expanded={hasActiveItem} variants={STAGE_VARIANTS} />
        </div>

        {/* Dark overlay */}
        {visualConfig.container.overlayGradient && (
          <div style={{ ...fill, background: visualConfig.container.overlayGradient, pointerEvents: 'none' }} />
        )}

        {/* 3D model for model features — three.js loads only when this mounts */}
        {expandedFeature?.mediaType === 'model' && ModelRendererComponent && (
          <div style={{ ...fill, zIndex: 10 }}>
            <ModelRendererComponent
              key={expandedFeature.media.src}
              src={expandedFeature.media.src}
              poster={expandedFeature.media.poster?.large}
              background={expandedFeature.media.background}
            />
          </div>
        )}

        {/* Video player */}
        {expandedFeature?.mediaType === 'video' && (
          <div style={{ ...fill, zIndex: 10 }}>
            <StageVideo video={expandedFeature.media} backgroundColor={containerBackgroundColor} />
          </div>
        )}

        {/* Close Button */}
        <AnimatePresence>
          {hasActiveItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: MOBILE_ANIMATIONS.closeButton.duration }}
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 30 }}
            >
              <button
                type="button"
                className={cx('pv-reset', 'pv-btn', 'pv-hover')}
                onClick={onClose}
                aria-label={labels.close}
                style={{
                  ...getGlassEffectSx({ type: visualConfig.closeButton.glassEffect }),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: closeColors.default,
                  color: visualConfig.closeButton.iconColor,
                  ['--pv-hover' as string]: closeColors.hover,
                }}
              >
                <CloseIcon size={20} aria-hidden />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pill strip: draggable while collapsed; cards grow upwards from its baseline */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: STRIP_BOTTOM, zIndex: 20 }}>
          <motion.div
            drag={hasActiveItem || fitsWithoutScrolling ? false : 'x'}
            dragConstraints={{ left: scrollMin, right: 0 }}
            dragElastic={0.12}
            dragTransition={{ power: 0.25, timeConstant: 250, bounceStiffness: 300, bounceDamping: 30 }}
            onDragStart={() => {
              scrollAnimation.current?.stop()
              handlePanStateChange(true)
            }}
            onDragEnd={() => handlePanStateChange(false)}
            style={{ x: scrollX, position: 'relative', height: PILL_HEIGHT }}
          >
            {items.map((item, position) => {
              const isActive = position === activeItemIndex
              const label = item.type === 'color' ? labels.color : item.feature.label
              const width = isActive ? expandedCardWidth : hasMeasured ? (pillWidths[position] as number) : null

              return (
                <MobilePill
                  key={item.id}
                  item={item}
                  label={label}
                  contentId={`${idPrefix}-${item.id}`}
                  x={positions[position]}
                  width={width}
                  isActive={isActive}
                  isLeftNeighbor={hasActiveItem && position === activeItemIndex - 1}
                  isRightNeighbor={hasActiveItem && position === activeItemIndex + 1}
                  swatchColor={selectedVariant?.colorHex}
                  contentWidth={expandedCardWidth}
                  visualConfig={visualConfig}
                  onTap={handlePillTap}
                  onLabelWidth={handleLabelWidth}
                  onSwipe={handleSwipe}
                  onPanStateChange={handlePanStateChange}
                >
                  {item.type === 'feature' ? (
                    <Text
                      variant="body2"
                      text={item.feature.description}
                      style={{
                        color: visualConfig.expandedCard.textColor,
                        opacity: visualConfig.expandedCard.descriptionOpacity,
                        lineHeight: 1.5,
                        whiteSpace: 'normal',
                      }}
                    />
                  ) : (
                    colorSelector
                  )}
                </MobilePill>
              )
            })}
          </motion.div>
        </div>
      </div>
    )
  }
)

ProductViewerMobile.displayName = 'ProductViewerMobile'
