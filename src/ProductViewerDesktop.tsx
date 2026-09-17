/**
 * ProductViewerDesktop Component
 *
 * Desktop layout for ProductViewer with floating pills on the left side.
 * Features:
 * - Floating pills over the media area (hug content)
 * - Vertical chevrons (always have reserved space) + pills stack on left
 * - Pills expand: header stays visible, content grows below
 * - Two-stage animation: size grows first, then content fades in
 * - Global close button when expanded
 * - Load-gated crossfade for stage images
 *
 * Each pill is a real `<button>` header with `aria-expanded`, followed by a region for
 * the card content, so it reads as a disclosure to assistive tech and never nests
 * interactive elements.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import { forwardRef, useId, type CSSProperties } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Text } from './internal/Text'
import { ColorSelector } from './internal/ColorSelector'
import { getGlassEffectSx } from './internal/glass-effects'
import { StageImage, type StageCustom } from './internal/StageImage'
import { StageVideo } from './internal/StageVideo'
import { formatLabel, stageBackgroundFor, stageMediaFor } from './internal/media'
import { cx, useViewerStyles } from './internal/styles'
import { stateColors, type ProductViewerLayoutProps } from './internal/viewer-items'
import { borderRadius as br, spacing } from './internal/tokens'

/**
 * Animation Configuration - Desktop
 * Centralized settings for all animations in ProductViewerDesktop
 */
const DESKTOP_ANIMATIONS = {
  // Stage crossfade: same curve as the card, a beat behind
  backgroundImage: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.05 },
  // Pill hover/interaction
  pill: { duration: 0.2, ease: 'ease' },
  // Icon background/colour transitions
  icon: { duration: 0.3, ease: 'ease' },
  // Expanded card transitions
  expandedCard: { duration: 0.3, ease: 'ease' },
  // Card content expansion (height animation)
  cardContent: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  // Card text fade in — after the content has grown
  cardText: { duration: 0.25, delay: 0.35 },
  // Close button
  closeButton: { duration: 0.2 },
  // Container background color
  backgroundColor: { duration: '0.5s', ease: 'ease' },
} as const

const STAGE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: DESKTOP_ANIMATIONS.backgroundImage },
  exit: ({ transition }: StageCustom) => ({
    opacity: 0,
    // A 3D canvas is taking over: leave at once rather than showing through its first frame
    transition:
      transition === 'clear'
        ? { duration: 0 }
        : { ...DESKTOP_ANIMATIONS.backgroundImage, duration: DESKTOP_ANIMATIONS.backgroundImage.duration / 2 },
  }),
}

/** Widest the stage grows; centred with side gutters beyond that */
const STAGE_MAX_WIDTH = 1408

const headerButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  height: 24,
  boxSizing: 'content-box',
  padding: '12px 20px',
  whiteSpace: 'nowrap',
}

const fill: CSSProperties = { position: 'absolute', inset: 0 }

export const ProductViewerDesktop = forwardRef<HTMLDivElement, ProductViewerLayoutProps>(
  (
    {
      hero,
      variants,
      features,
      items,
      selectedVariantId,
      expandedFeatureIndex,
      activeItemIndex,
      canGoPrevious,
      canGoNext,
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
    const selectedVariant = variants.find((v) => v.id === selectedVariantId)
    const expandedFeature = expandedFeatureIndex >= 0 ? (features[expandedFeatureIndex] ?? null) : null
    const hasActiveItem = activeItemIndex >= 0

    const stageMedia = stageMediaFor({ hero, selectedVariant, expandedFeature, hasModelRenderer: !!modelRenderer })
    const containerBackgroundColor = stageBackgroundFor(visualConfig, selectedVariant, expandedFeature)

    const pillColors = stateColors(visualConfig.pill.backgroundColor, ['default', 'hover', 'active'])
    const closeColors = stateColors(visualConfig.closeButton.backgroundColor, ['default', 'hover'])
    const pillRadius = typeof visualConfig.pill.borderRadius === 'number' ? visualConfig.pill.borderRadius : 24
    // Every open card is the same width, whatever its content: a short colour caption
    // must not make the colour card narrower than the feature cards
    const cardContentWidth = visualConfig.expandedCard.maxWidth || 280
    const {
      expandIcon: ExpandIcon,
      closeIcon: CloseIcon,
      chevronUpIcon: PreviousIcon = ChevronUp,
      chevronDownIcon: NextIcon = ChevronDown,
    } = visualConfig.pill.icons

    // Capitalised binding so JSX treats the injected renderer as a component
    const ModelRendererComponent = modelRenderer

    // Chevron button styles - full circles (using pill colors)
    const chevronStyle = (enabled: boolean): CSSProperties => ({
      ...getGlassEffectSx({ type: visualConfig.pill.glassEffect, intensity: visualConfig.pill.glassIntensity }),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: '50%',
      backgroundColor: pillColors.default,
      color: visualConfig.pill.textColor,
      transition: `all ${DESKTOP_ANIMATIONS.pill.duration}s ${DESKTOP_ANIMATIONS.pill.ease}`,
      opacity: !hasActiveItem ? 0 : enabled ? 1 : 0.3,
      pointerEvents: hasActiveItem ? 'auto' : 'none',
      ['--pv-hover' as string]: pillColors.hover,
    })

    return (
      <div
        ref={ref}
        style={{
          position: 'relative',
          maxWidth: STAGE_MAX_WIDTH,
          margin: '0 auto',
          aspectRatio: '16 / 9',
          minHeight: 500,
          borderRadius: br[3],
          overflow: 'hidden',
          backgroundColor: containerBackgroundColor,
          transition: `background-color ${DESKTOP_ANIMATIONS.backgroundColor.duration} ${DESKTOP_ANIMATIONS.backgroundColor.ease}`,
        }}
      >
        {/* Stage picture, crossfading once the next image has loaded */}
        <StageImage media={stageMedia} expanded={hasActiveItem} variants={STAGE_VARIANTS} />

        {/* Video player for video features */}
        {expandedFeature?.mediaType === 'video' && (
          <div style={{ ...fill, zIndex: 1 }}>
            <StageVideo video={expandedFeature.media} />
          </div>
        )}

        {/* 3D model for model features — three.js loads only when this mounts */}
        {expandedFeature?.mediaType === 'model' && ModelRendererComponent && (
          <div style={{ ...fill, zIndex: 1 }}>
            <ModelRendererComponent
              key={expandedFeature.media.src}
              src={expandedFeature.media.src}
              poster={expandedFeature.media.poster?.large}
              background={expandedFeature.media.background}
            />
          </div>
        )}

        {/* Global Close Button */}
        <AnimatePresence>
          {hasActiveItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: DESKTOP_ANIMATIONS.closeButton.duration }}
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
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
                  transition: `background-color ${DESKTOP_ANIMATIONS.pill.duration}s ${DESKTOP_ANIMATIONS.pill.ease}`,
                  ['--pv-hover' as string]: closeColors.hover,
                }}
              >
                <CloseIcon size={20} aria-hidden />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Panel: Chevrons + Pills (floating) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[3],
            padding: spacing[4],
            zIndex: 5,
          }}
        >
          {/* Vertical Chevrons - Always reserve space */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[2], width: 40 }}>
            <button
              type="button"
              className={cx('pv-reset', 'pv-btn', 'pv-hover')}
              onClick={onPrevious}
              disabled={!canGoPrevious}
              aria-label={labels.previous}
              aria-hidden={!hasActiveItem}
              tabIndex={hasActiveItem ? 0 : -1}
              style={chevronStyle(canGoPrevious)}
            >
              <PreviousIcon size={20} aria-hidden />
            </button>
            <button
              type="button"
              className={cx('pv-reset', 'pv-btn', 'pv-hover')}
              onClick={onNext}
              disabled={!canGoNext}
              aria-label={labels.next}
              aria-hidden={!hasActiveItem}
              tabIndex={hasActiveItem ? 0 : -1}
              style={chevronStyle(canGoNext)}
            >
              <NextIcon size={20} aria-hidden />
            </button>
          </div>

          {/* Vertical Pills Stack */}
          <div
            className="pv-scroll"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: spacing[2],
              maxWidth: visualConfig.pill.maxWidth || 340,
              maxHeight: '80%',
              overflowY: 'auto',
            }}
          >
            {items.map((item, position) => {
              const isActive = position === activeItemIndex
              const contentId = `${idPrefix}-${item.id}`
              const label = item.type === 'color' ? labels.color : item.feature.label
              const textColor = isActive ? visualConfig.expandedCard.textColor : visualConfig.pill.textColor

              return (
                <div
                  key={item.id}
                  style={{
                    ...getGlassEffectSx({
                      type: isActive ? visualConfig.expandedCard.glassEffect : visualConfig.pill.glassEffect,
                      intensity: isActive ? visualConfig.expandedCard.glassIntensity : visualConfig.pill.glassIntensity,
                    }),
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: 'fit-content',
                    borderRadius: pillRadius,
                    backgroundColor: isActive ? pillColors.active : pillColors.default,
                    color: textColor,
                    overflow: 'hidden',
                    transition: `background-color ${DESKTOP_ANIMATIONS.expandedCard.duration}s ${DESKTOP_ANIMATIONS.expandedCard.ease}`,
                  }}
                >
                  {/* Header - always visible; toggles the card */}
                  <button
                    type="button"
                    className={cx('pv-reset', 'pv-btn')}
                    aria-expanded={isActive}
                    aria-controls={contentId}
                    onClick={() => onFeatureToggle(item.index)}
                    style={headerButtonStyle}
                  >
                    {item.type === 'color' ? (
                      <span
                        aria-hidden
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: selectedVariant?.colorHex,
                          border: '2px solid rgba(255, 255, 255, 0.4)',
                          boxSizing: 'border-box',
                          flexShrink: 0,
                          transition: `background-color ${DESKTOP_ANIMATIONS.icon.duration}s ${DESKTOP_ANIMATIONS.icon.ease}`,
                        }}
                      />
                    ) : (
                      <span
                        aria-hidden
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: visualConfig.expandedCard.backgroundColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: visualConfig.expandedCard.textColor,
                          transition: `background-color ${DESKTOP_ANIMATIONS.icon.duration}s ${DESKTOP_ANIMATIONS.icon.ease}`,
                        }}
                      >
                        {isActive ? <CloseIcon size={14} aria-hidden /> : <ExpandIcon size={14} aria-hidden />}
                      </span>
                    )}
                    <Text
                      variant="body2"
                      component="span"
                      text={label}
                      style={{ color: textColor, fontWeight: 500, lineHeight: '24px' }}
                    />
                  </button>

                  {/* Content - grows first (0.4s), then text fades in (0.35s delay) */}
                  <AnimatePresence initial={false}>
                    {isActive && (
                      <motion.div
                        key={contentId}
                        id={contentId}
                        role="region"
                        aria-label={label}
                        initial={{ height: 0, width: 0 }}
                        animate={{ height: 'auto', width: 'auto' }}
                        exit={{ height: 0, width: 0 }}
                        transition={{ duration: DESKTOP_ANIMATIONS.cardContent.duration, ease: DESKTOP_ANIMATIONS.cardContent.ease }}
                        style={{ overflow: 'hidden' }}
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: DESKTOP_ANIMATIONS.cardText.duration, delay: DESKTOP_ANIMATIONS.cardText.delay }}
                          style={{ width: cardContentWidth, boxSizing: 'content-box', padding: '0 20px 12px' }}
                        >
                          {item.type === 'feature' ? (
                            <Text
                              variant="body2"
                              text={item.feature.description}
                              style={{
                                color: visualConfig.expandedCard.textColor,
                                opacity: visualConfig.expandedCard.descriptionOpacity,
                                lineHeight: 1.5,
                              }}
                            />
                          ) : (
                            <>
                              <Text
                                variant="body2"
                                text={formatLabel(labels.displayedIn, { product: hero.name, variant: selectedVariant?.label })}
                                style={{
                                  color: visualConfig.expandedCard.textColor,
                                  opacity: visualConfig.expandedCard.descriptionOpacity,
                                  lineHeight: 1.5,
                                  marginBottom: 12,
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
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
)

ProductViewerDesktop.displayName = 'ProductViewerDesktop'
