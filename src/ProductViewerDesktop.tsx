/**
 * ProductViewerDesktop Component
 *
 * Desktop layout for ProductViewer with floating pills on left side.
 * Features:
 * - Floating pills over the media area (hug content)
 * - Vertical chevrons (always have reserved space) + pills stack on left
 * - Pills expand: header stays visible, content grows below
 * - Two-stage animation: size grows first, then content fades in
 * - Global close button when expanded
 * - Slider animation for image transitions
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import { forwardRef, useRef, useState, useEffect } from 'react'
import { Box, IconButton } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { Text } from './internal/Text'
import { ColorSelector } from './internal/ColorSelector'
import { getGlassEffectSx } from './internal/glass-effects'
import type { ProductViewerColor, ProductViewerModel, ModelRenderer } from './ProductViewer.types'
import { borderRadius as br, containerPageWidth, getSpacingPx } from './internal/tokens'
import type {
  ProductViewerVariant,
  ProductViewerFeature,
  ProductViewerHero,
  ResponsiveImage,
  ResponsiveVideo,
  ProductViewerVisualConfig,
} from './ProductViewer.types'

interface ProductViewerDesktopProps {
  hero: ProductViewerHero
  variants: ProductViewerVariant[]
  features: ProductViewerFeature[]
  selectedVariantId: string
  expandedFeatureIndex: number
  onVariantChange: (variantId: string) => void
  onFeatureToggle: (index: number) => void
  onClose: () => void
  visualConfig: ProductViewerVisualConfig
  /** Supplied by the host app from '@tolgainam/product-viewer/model'; absent means no 3D */
  modelRenderer?: ModelRenderer
}

// Type guard for video
function isResponsiveVideo(
  media: ResponsiveImage | ResponsiveVideo | ProductViewerColor | ProductViewerModel
): media is ResponsiveVideo {
  return 'src' in media && 'poster' in media
}

/**
 * Animation Configuration - Desktop
 * Centralized settings for all animations in ProductViewerDesktop
 */
const DESKTOP_ANIMATIONS = {
  // Background image crossfade
  backgroundImage: {
    duration: 0.4, // seconds
    ease: 'easeInOut',
  },

  // Pill hover/interaction
  pill: {
    duration: 0.2, // seconds
    ease: 'ease',
  },

  // Icon background color transitions
  iconBackground: {
    duration: 0.3, // seconds
    ease: 'ease',
  },

  // Icon color transitions
  iconColor: {
    duration: 0.3, // seconds
    ease: 'ease',
  },

  // Expanded card transitions
  expandedCard: {
    duration: 0.3, // seconds
    ease: 'ease',
  },

  // Card content expansion (height animation)
  cardContent: {
    duration: 0.4, // seconds
    ease: [0.4, 0, 0.2, 1],
  },

  // Card text fade in
  cardText: {
    duration: 0.25, // seconds
    delay: 0.35, // seconds - fades in after content grows
  },

  // Close button
  closeButton: {
    duration: 0.2, // seconds
  },

  // Container background color
  backgroundColor: {
    duration: '0.5s', // CSS transition
    ease: 'ease',
  },
} as const

export const ProductViewerDesktop = forwardRef<HTMLDivElement, ProductViewerDesktopProps>(
  (
    {
      hero,
      variants,
      features,
      selectedVariantId,
      expandedFeatureIndex,
      onVariantChange,
      onFeatureToggle,
      onClose,
      visualConfig,
      modelRenderer,
    },
    ref
  ) => {
    // Chevron button styles - full circles (using pill colors)
    const chevronStyles = {
      ...getGlassEffectSx({
        type: visualConfig.pill.glassEffect,
        intensity: visualConfig.pill.glassIntensity,
      }),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: '50%',
      border: 'none',
      backgroundColor: typeof visualConfig.pill.backgroundColor === 'string'
        ? visualConfig.pill.backgroundColor
        : visualConfig.pill.backgroundColor.default,
      color: visualConfig.pill.textColor,
      cursor: 'pointer',
      transition: `all ${DESKTOP_ANIMATIONS.pill.duration}s ${DESKTOP_ANIMATIONS.pill.ease}`,
      '&:hover:not(:disabled)': {
        backgroundColor: typeof visualConfig.pill.backgroundColor === 'string'
          ? visualConfig.pill.backgroundColor
          : visualConfig.pill.backgroundColor.hover,
      },
      '&:disabled': {
        opacity: 0.3,
        cursor: 'not-allowed',
      },
    }

    const [shouldAnimateImage, setShouldAnimateImage] = useState(true)
    const prevVariantIdRef = useRef(selectedVariantId)

    const selectedVariant = variants.find((v) => v.id === selectedVariantId)
    const expandedFeature = expandedFeatureIndex >= 0 ? features[expandedFeatureIndex] : null
    const isExpanded = expandedFeatureIndex >= 0
    const isColorSelectorActive = expandedFeatureIndex === -2
    const hasActiveItem = isExpanded || isColorSelectorActive

    // Detect color-only changes to use crossfade instead of slide
    useEffect(() => {
      if (prevVariantIdRef.current !== selectedVariantId) {
        // Color changed - use crossfade animation
        setShouldAnimateImage(true)
        prevVariantIdRef.current = selectedVariantId
      }
    }, [selectedVariantId])

    // Get current background image
    const getCurrentBackgroundImage = () => {
      if (expandedFeature) {
        // Colour features recolour the stage but keep the product on it
        if (expandedFeature.mediaType === 'color') {
          return selectedVariant?.image.large || hero.image.large || ''
        }
        // A model paints its own canvas, so no poster layer — it would flash before the canvas
        // mounts. With no renderer supplied there is no canvas, so the poster becomes the background.
        if (expandedFeature.mediaType === 'model') {
          return modelRenderer ? '' : ((expandedFeature.media as ProductViewerModel).poster?.large ?? '')
        }
        // Use type guard to detect video (not mediaType field which may be incorrect)
        if (isResponsiveVideo(expandedFeature.media)) {
          return expandedFeature.media.poster.large
        }
        return (expandedFeature.media as ResponsiveImage).large
      }
      if (selectedVariant && selectedVariant.image.large) {
        return selectedVariant.image.large
      }
      return hero.image.large || ''
    }

    const imageKey = getCurrentBackgroundImage()

    // Log missing images for debugging (no bundler-specific env flag, so this works anywhere).
    // Colour features legitimately have no image, and a model draws its own canvas instead.
    if (
      !imageKey &&
      expandedFeature?.mediaType !== 'color' &&
      expandedFeature?.mediaType !== 'model'
    ) {
      console.warn('[ProductViewer] Missing background image:', {
        selectedVariantId,
        selectedVariant,
        expandedFeature,
        hero
      })
    }

    // Determine background size: contain for color picker variants, cover for everything else
    const isVariantImage = variants.some(v => v.image.large === imageKey)
    const backgroundSize = isVariantImage ? 'contain' : 'cover'

    // Determine container background color (dynamic based on selected variant if enabled)
    const getContainerBackgroundColor = () => {
      // A colour feature IS the background
      if (expandedFeature?.mediaType === 'color') {
        return (expandedFeature.media as ProductViewerColor).color
      }
      // If dynamic background is enabled and a variant is selected (no feature expanded)
      if (visualConfig.container.dynamicBackground && selectedVariant && !expandedFeature) {
        return selectedVariant.backgroundColor || visualConfig.container.backgroundColor
      }
      return visualConfig.container.backgroundColor
    }

    const containerBackgroundColor = getContainerBackgroundColor()

    // Capitalised binding so JSX treats the injected renderer as a component
    const ModelRendererComponent = modelRenderer

    // All items (color selector + features) - colors is index -2, features are 0+
    const allItems = [
      ...(variants.length > 1 ? [{ type: 'color' as const, id: 'colors', index: -2 }] : []),
      ...features.map((f, i) => ({ type: 'feature' as const, id: f.id, index: i, feature: f })),
    ]

    // Calculate navigation - treat all items the same
    const activeItemArrayIndex = allItems.findIndex(item =>
      item.type === 'color' ? isColorSelectorActive : expandedFeatureIndex === item.index
    )
    const canGoPrevious = activeItemArrayIndex > 0
    const canGoNext = activeItemArrayIndex >= 0 && activeItemArrayIndex < allItems.length - 1

    // Handle navigation with direction tracking
    const handlePrevious = () => {
      if (activeItemArrayIndex > 0) {
        setShouldAnimateImage(true)
        const prevItem = allItems[activeItemArrayIndex - 1]
        onFeatureToggle(prevItem.index)
      }
    }

    const handleNext = () => {
      if (activeItemArrayIndex < allItems.length - 1) {
        setShouldAnimateImage(true)
        const nextItem = allItems[activeItemArrayIndex + 1]
        onFeatureToggle(nextItem.index)
      }
    }

    return (
      <Box
        ref={ref}
        sx={{
          position: 'relative',
          maxWidth: containerPageWidth.large,
          mx: 'auto',
          aspectRatio: '16 / 9',
          minHeight: 500,
          borderRadius: `${br[3]}px`,
          overflow: 'hidden',
          backgroundColor: containerBackgroundColor,
          transition: `background-color ${DESKTOP_ANIMATIONS.backgroundColor.duration} ${DESKTOP_ANIMATIONS.backgroundColor.ease}`,
        }}
      >
        {/* Background Image with Crossfade Animation */}
        {imageKey && shouldAnimateImage ? (
          // No mode="wait": that holds the incoming image back until the outgoing one
          // finishes exiting, and the exit never completes here, so switching category
          // left the previous media on screen. Overlapping layers give the intended crossfade.
          <AnimatePresence>
            <motion.div
              key={imageKey}
              // Concrete values, not variant labels: the viewer's outer motion.div animates
              // labels ("hidden"/"visible") and propagates them to children, which left this
              // layer resolving no matching variant and stuck at opacity 0.
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DESKTOP_ANIMATIONS.backgroundImage.duration, ease: DESKTOP_ANIMATIONS.backgroundImage.ease }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${imageKey}")`,
                backgroundSize,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </AnimatePresence>
        ) : imageKey ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url("${imageKey}")`,
              backgroundSize,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
        ) : null}

        {/* Video player for video features */}
        {expandedFeature?.mediaType === 'video' && isResponsiveVideo(expandedFeature.media) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            >
              <source src={expandedFeature.media.src} type="video/mp4" />
            </video>
          </Box>
        )}

        {/* 3D model for model features — three.js loads only when this mounts */}
        {expandedFeature?.mediaType === 'model' && ModelRendererComponent && (
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
            <ModelRendererComponent
              src={(expandedFeature.media as ProductViewerModel).src}
              poster={(expandedFeature.media as ProductViewerModel).poster?.large}
              background={(expandedFeature.media as ProductViewerModel).background}
            />
          </Box>
        )}

        {/* Global Close Button */}
        <AnimatePresence>
          {hasActiveItem && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: DESKTOP_ANIMATIONS.closeButton.duration }}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10,
              }}
            >
              <IconButton
                onClick={onClose}
                sx={{
                  ...getGlassEffectSx({
                    type: visualConfig.closeButton.glassEffect,
                  }),
                  backgroundColor: typeof visualConfig.closeButton.backgroundColor === 'string'
                    ? visualConfig.closeButton.backgroundColor
                    : visualConfig.closeButton.backgroundColor.default,
                  color: visualConfig.closeButton.iconColor,
                  '&:hover': {
                    backgroundColor: typeof visualConfig.closeButton.backgroundColor === 'string'
                      ? visualConfig.closeButton.backgroundColor
                      : visualConfig.closeButton.backgroundColor.hover,
                  },
                }}
              >
                {(() => {
                  const CloseIconComponent = visualConfig.pill.icons.closeIcon
                  return <CloseIconComponent />
                })()}
              </IconButton>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Panel: Chevrons + Pills (floating) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            gap: getSpacingPx(3),
            padding: getSpacingPx(4),
            zIndex: 5,
          }}
        >
          {/* Vertical Chevrons - Always reserve space */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: getSpacingPx(2),
              width: 40, // Fixed width to reserve space
            }}
          >
            <Box
              component="button"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              sx={{
                ...chevronStyles,
                opacity: hasActiveItem ? 1 : 0,
                pointerEvents: hasActiveItem ? 'auto' : 'none',
              }}
            >
              <KeyboardArrowUpIcon />
            </Box>
            <Box
              component="button"
              onClick={handleNext}
              disabled={!canGoNext}
              sx={{
                ...chevronStyles,
                opacity: hasActiveItem ? 1 : 0,
                pointerEvents: hasActiveItem ? 'auto' : 'none',
              }}
            >
              <KeyboardArrowDownIcon />
            </Box>
          </Box>

          {/* Vertical Pills Stack */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: getSpacingPx(2),
              maxWidth: visualConfig.pill.maxWidth || 340,
              maxHeight: '80%',
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 2,
              },
            }}
          >
            {allItems.map((item) => {
              const isActive = item.type === 'color'
                ? isColorSelectorActive
                : expandedFeatureIndex === item.index

              return (
                <div
                  key={item.id}
                  style={{ width: 'fit-content' }}
                >
                  <div
                    role="button"
                    tabIndex={isActive ? -1 : 0}
                    onClick={() => {
                      if (!isActive) {
                        setShouldAnimateImage(true)
                        onFeatureToggle(item.index)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (!isActive && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        setShouldAnimateImage(true)
                        onFeatureToggle(item.index)
                      }
                    }}
                    style={{
                      ...getGlassEffectSx({
                        type: isActive ? visualConfig.expandedCard.glassEffect : visualConfig.pill.glassEffect,
                        intensity: isActive ? visualConfig.expandedCard.glassIntensity : visualConfig.pill.glassIntensity,
                      }),
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '12px 20px',
                      borderRadius: typeof visualConfig.pill.borderRadius === 'number' ? visualConfig.pill.borderRadius : 24,
                      border: 'none',
                      backgroundColor: (() => {
                        const bgConfig = typeof visualConfig.pill.backgroundColor === 'string'
                          ? { default: visualConfig.pill.backgroundColor, active: visualConfig.pill.backgroundColor }
                          : visualConfig.pill.backgroundColor
                        return isActive ? bgConfig.active : bgConfig.default
                      })(),
                      color: isActive ? visualConfig.expandedCard.textColor : visualConfig.pill.textColor,
                      cursor: isActive ? 'default' : 'pointer',
                      textAlign: 'left',
                      overflow: 'hidden',
                      transition: `background-color ${DESKTOP_ANIMATIONS.expandedCard.duration}s ${DESKTOP_ANIMATIONS.expandedCard.ease}`,
                    }}
                  >
                    {item.type === 'feature' ? (
                      /* FEATURE PILLS: Header always visible, content expands below */
                      <>
                        {/* Header - always visible */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            height: 24,
                          }}
                        >
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: visualConfig.expandedCard.backgroundColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: `background-color ${DESKTOP_ANIMATIONS.iconBackground.duration}s ${DESKTOP_ANIMATIONS.iconBackground.ease}`,
                            }}
                          >
                            {(() => {
                              const IconComponent = isActive ? visualConfig.pill.icons.closeIcon : visualConfig.pill.icons.expandIcon
                              return (
                                <IconComponent
                                  sx={{
                                    fontSize: 14,
                                    color: visualConfig.expandedCard.textColor,
                                    transition: `color ${DESKTOP_ANIMATIONS.iconColor.duration}s ${DESKTOP_ANIMATIONS.iconColor.ease}`,
                                  }}
                                />
                              )
                            })()}
                          </Box>
                          <Text
                            variant="body2"
                            text={item.feature?.label || ''}
                            sx={{
                              color: isActive ? visualConfig.expandedCard.textColor : visualConfig.pill.textColor,
                              fontWeight: 500,
                              lineHeight: '24px',
                              margin: 0,
                              textTransform: 'none',
                              whiteSpace: 'nowrap',
                            }}
                          />
                        </div>

                        {/* Content - grows first (0.4s), then text fades in (0.35s delay) */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              key={`content-${item.id}`}
                              initial={{ height: 0, width: 0, marginTop: 0 }}
                              animate={{ height: 'auto', width: 'auto', marginTop: 12 }}
                              exit={{ height: 0, width: 0, marginTop: 0 }}
                              transition={{ duration: DESKTOP_ANIMATIONS.cardContent.duration, ease: DESKTOP_ANIMATIONS.cardContent.ease }}
                              style={{ overflow: 'hidden' }}
                            >
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: DESKTOP_ANIMATIONS.cardText.duration, delay: DESKTOP_ANIMATIONS.cardText.delay }}
                              >
                                <Text
                                  variant="body2"
                                  text={item.feature?.description || ''}
                                  sx={{
                                    color: visualConfig.expandedCard.textColor,
                                    opacity: visualConfig.expandedCard.descriptionOpacity,
                                    lineHeight: 1.5,
                                    maxWidth: visualConfig.expandedCard.maxWidth || 280,
                                  }}
                                />
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      /* COLOR PILLS: Header stays, content expands below */
                      <>
                        {/* Header - shows "Color" or selected color name when active */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            height: 24,
                          }}
                        >
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: selectedVariant?.colorHex,
                              border: '2px solid rgba(255, 255, 255, 0.4)',
                              flexShrink: 0,
                            }}
                          />
                          <Text
                            variant="body2"
                            // Lets keep title as Color always
                            text={'Color'}
                            // text={isActive ? (selectedVariant?.label || 'Color') : 'Color'}
                            sx={{
                              color: isActive ? visualConfig.expandedCard.textColor : visualConfig.pill.textColor,
                              fontWeight: 500,
                              lineHeight: '24px',
                              margin: 0,
                              textTransform: 'none',
                            }}
                          />
                        </div>

                        {/* Color Selector Content - expands below header */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              key="color-content"
                              initial={{ height: 0, width: 0, marginTop: 0 }}
                              animate={{ height: 'auto', width: 'auto', marginTop: 12 }}
                              exit={{ height: 0, width: 0, marginTop: 0 }}
                              transition={{ duration: DESKTOP_ANIMATIONS.cardContent.duration, ease: DESKTOP_ANIMATIONS.cardContent.ease }}
                              style={{ overflow: 'hidden' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: DESKTOP_ANIMATIONS.cardText.duration, delay: DESKTOP_ANIMATIONS.cardText.delay }}
                              >
                                <Text
                                  variant="body2"
                                  text={`${hero.name} displayed in ${selectedVariant?.label || ''}`}
                                  sx={{
                                    color: visualConfig.expandedCard.textColor,
                                    opacity: visualConfig.expandedCard.descriptionOpacity,
                                    lineHeight: 1.5,
                                    marginBottom: '12px',
                                  }}
                                />
                                <ColorSelector
                                  hideLabel
                                  colors={variants.map((v) => ({
                                    id: v.id,
                                    name: v.label,
                                    value: v.colorHex,
                                  }))}
                                  selectedColorId={selectedVariantId}
                                  onColorChange={onVariantChange}
                                  maxVisible={100}
                                />
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </Box>
        </Box>
      </Box>
    )
  }
)

ProductViewerDesktop.displayName = 'ProductViewerDesktop'
