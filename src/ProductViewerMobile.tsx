/**
 * ProductViewerMobile Component
 *
 * Mobile/Tablet layout for ProductViewer with Apple-inspired pill navigation.
 * Features:
 * - Full-screen gallery with background image
 * - Single rendering mode: absolute positioning for all states
 * - Transform-based "scrolling" via scrollOffset
 * - Smooth animations between collapsed ↔ expanded (no mode switch)
 * - Two-stage animation: card grows first, then content fades in
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import { forwardRef, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Box, IconButton } from '@mui/material'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { Text } from './internal/Text'
import { ColorSelector } from './internal/ColorSelector'
import { getGlassEffectSx } from './internal/glass-effects'
import type {
  ProductViewerVariant,
  ProductViewerFeature,
  ProductViewerHero,
  ResponsiveImage,
  ResponsiveVideo,
  ProductViewerVisualConfig,
  ProductViewerColor,
  ProductViewerModel,
  ModelRenderer,
} from './ProductViewer.types'

interface ProductViewerMobileProps {
  hero: ProductViewerHero
  variants: ProductViewerVariant[]
  features: ProductViewerFeature[]
  selectedVariantId: string
  expandedFeatureIndex: number
  onVariantChange: (variantId: string) => void
  onFeatureToggle: (index: number) => void
  onPreviousFeature: () => void
  onNextFeature: () => void
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

// Constants
const PILL_GAP = 16 // Gap between pills
const PADDING_LEFT = 16 // Left padding
const DEFAULT_NEIGHBOR_PEEK = 32 // Default: How much of neighbor pills peek from edges when expanded

/**
 * Animation Configuration - Mobile
 * Centralized settings for all animations in ProductViewerMobile
 */
const MOBILE_ANIMATIONS = {
  // Pill scrolling (collapsed mode - horizontal scroll to center)
  pillScroll: {
    duration: 0.9, // seconds (changed from 500ms for Framer Motion)
   // ease: [0.77, 0, 0.175, 1], // easeOutQuart as cubic-bezier
    ease: [0.32, 0.72, 0, 1],
  },

  // Background image transitions (hero/feature images)
  backgroundImage: {
    expandCollapse: {
      duration: 0.7, // seconds
      easeExpand: [0.25, 0.1, 0.25, 1], // Apple softness for expand
      easeCollapse: [0.34, 1.2, 0.64, 1], // Gentle elastic for collapse
    },
    switchCard: {
      duration: 0.3, // seconds - Quick but gentle
      ease: [0.32, 0.72, 0, 1],
      //duration: 0.5, // seconds (changed from 500ms for Framer Motion)
      //ease: [0.77, 0, 0.175, 1], // easeOutQuart as cubic-bezier
    },
  },

  // Pill horizontal positioning (when switching between collapsed/expanded)
  pillPosition: {
    duration: 1.1, // seconds
    //ease: [0.77, 0, 0.175, 1], // easeOutQuart as cubic-bezier
  ease: [0.32, 0.72, 0, 1],
  },

  // Pill width expansion (pill → card width)
  pillWidth: {
    duration: 0.5, // seconds
    ease: [0.32, 0.72, 0, 1],
//    ease: 'cubic-bezier(0.32, 0.72, 0, 1)',
  },

  // Pill background color transitions
  pillBackground: {
    duration: 0.3, // seconds
    ease: [0.32, 0.72, 0, 1],
  },

  // Expanded content (title/description fade in)
  expandedContent: {
    duration: 1.1, // seconds
    ease: [0.32, 0.72, 0, 1],
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

// Debug logging helper
const logPillState = (
  stage: string,
  data: {
    containerWidth: number
    expandedCardWidth: number
    pillWidths: number[]
    scrollOffset: number
    centeredIndex: number | null
    activeArrayIndex: number | null
    hasActiveItem: boolean
    allItems: { id: string; type: string }[]
    neighborPeek: number
  }
) => {
  const { containerWidth, expandedCardWidth, pillWidths, scrollOffset, centeredIndex, activeArrayIndex, hasActiveItem, allItems, neighborPeek } = data
  const NEIGHBOR_PEEK = neighborPeek // For backward compatibility with existing code

  // Calculate strip length
  const collapsedStripLength = pillWidths.length > 0
    ? PADDING_LEFT + pillWidths.reduce((sum, w) => sum + w, 0) + (pillWidths.length - 1) * PILL_GAP + PADDING_LEFT
    : 0
  const expandedStripLength = pillWidths.length > 0 && hasActiveItem
    ? PADDING_LEFT + pillWidths.reduce((sum, w) => sum + w, 0) - (pillWidths[activeArrayIndex || 0] || 0) + expandedCardWidth + (pillWidths.length - 1) * PILL_GAP + PADDING_LEFT
    : collapsedStripLength

  // Calculate positions for each pill
  const positions = allItems.map((item, arrayIndex) => {
    const myPillWidth = pillWidths[arrayIndex] || 120
    let xPosition: number

    const isLeftNeighbor = hasActiveItem && activeArrayIndex !== null && arrayIndex === activeArrayIndex - 1
    const isRightNeighbor = hasActiveItem && activeArrayIndex !== null && arrayIndex === activeArrayIndex + 1

    if (hasActiveItem && activeArrayIndex !== null) {
      const expandedX = (containerWidth - expandedCardWidth) / 2
      if (arrayIndex === activeArrayIndex) {
        xPosition = expandedX
      } else if (arrayIndex === activeArrayIndex - 1) {
        xPosition = NEIGHBOR_PEEK - myPillWidth
      } else if (arrayIndex === activeArrayIndex + 1) {
        xPosition = containerWidth - NEIGHBOR_PEEK
      } else if (arrayIndex < activeArrayIndex) {
        const distance = activeArrayIndex - arrayIndex
        xPosition = NEIGHBOR_PEEK - myPillWidth - (distance - 1) * (myPillWidth + PILL_GAP)
      } else {
        const distance = arrayIndex - activeArrayIndex
        xPosition = containerWidth - NEIGHBOR_PEEK + (distance - 1) * (myPillWidth + PILL_GAP)
      }
    } else {
      let x = PADDING_LEFT
      for (let i = 0; i < arrayIndex; i++) {
        x += (pillWidths[i] || 120) + PILL_GAP
      }
      xPosition = x + scrollOffset
    }

    return {
      index: arrayIndex,
      id: item.id,
      type: item.type,
      width: hasActiveItem && arrayIndex === activeArrayIndex ? expandedCardWidth : myPillWidth,
      x: Math.round(xPosition),
      rightEdge: Math.round(xPosition + (hasActiveItem && arrayIndex === activeArrayIndex ? expandedCardWidth : myPillWidth)),
      isActive: arrayIndex === activeArrayIndex,
      isCentered: !hasActiveItem && centeredIndex === arrayIndex,
      isLeftNeighbor,
      isRightNeighbor,
      peekOffset: isLeftNeighbor ? NEIGHBOR_PEEK : (isRightNeighbor ? NEIGHBOR_PEEK : null),
    }
  })

  console.group(`%c[PillStrip] ${stage}`, 'color: #00bcd4; font-weight: bold')
  console.log('Container Width:', containerWidth)
  console.log('Strip Length:', hasActiveItem ? expandedStripLength : collapsedStripLength, hasActiveItem ? '(expanded)' : '(collapsed)')
  console.log('Expanded Card Width:', expandedCardWidth)
  console.log('Scroll Offset:', scrollOffset)
  console.log('Centered Index:', centeredIndex)
  console.log('Active Index:', activeArrayIndex)
  console.log('Has Active Item:', hasActiveItem)

  // Neighbor offsets summary
  if (hasActiveItem && activeArrayIndex !== null) {
    const leftNeighbor = positions.find(p => p.isLeftNeighbor)
    const rightNeighbor = positions.find(p => p.isRightNeighbor)
    console.group('%cNeighbor Offsets (Expanded)', 'color: #ff9800')
    if (leftNeighbor) {
      console.log(`Left Neighbor [${leftNeighbor.id}]: x=${leftNeighbor.x}, rightEdge=${leftNeighbor.rightEdge}, peek=${NEIGHBOR_PEEK}px from left`)
    } else {
      console.log('Left Neighbor: none (active is first)')
    }
    if (rightNeighbor) {
      console.log(`Right Neighbor [${rightNeighbor.id}]: x=${rightNeighbor.x}, peek=${NEIGHBOR_PEEK}px from right (at ${containerWidth - NEIGHBOR_PEEK})`)
    } else {
      console.log('Right Neighbor: none (active is last)')
    }
    console.groupEnd()
  } else {
    console.group('%cNeighbor Offsets (Collapsed)', 'color: #4caf50')
    positions.forEach(p => {
      const distFromLeft = p.x
      const distFromRight = containerWidth - p.rightEdge
      console.log(`[${p.id}]: x=${p.x}, rightEdge=${p.rightEdge}, fromLeft=${distFromLeft}px, fromRight=${distFromRight}px`)
    })
    console.groupEnd()
  }

  console.table(positions)
  console.groupEnd()
}

export const ProductViewerMobile = forwardRef<HTMLDivElement, ProductViewerMobileProps>(
  (
    {
      hero,
      variants,
      features,
      selectedVariantId,
      expandedFeatureIndex,
      onVariantChange,
      onFeatureToggle,
      onPreviousFeature: _onPreviousFeature,
      onNextFeature: _onNextFeature,
      onClose,
      visualConfig,
      modelRenderer,
    },
    ref
  ) => {
    // Core state
    const [centeredIndex, setCenteredIndex] = useState<number | null>(null)
    const [containerWidth, setContainerWidth] = useState(375)
    const [pillWidths, setPillWidths] = useState<number[]>([])
    const [contentHeights, setContentHeights] = useState<number[]>([])
    const [scrollOffset, setScrollOffset] = useState(0) // Transform-based scroll
    const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null)

    // Refs
    const pillRefs = useRef<Map<number, HTMLDivElement>>(new Map())
    const contentMeasureRefs = useRef<Map<number, HTMLDivElement>>(new Map())
    const scrollOffsetRef = useRef(0) // Track current scroll offset for animations
    const wasExpandedRef = useRef(false) // Track if we're closing (transitioning from expanded)
    const collapsedWidthsRef = useRef<number[]>([]) // Permanent storage for collapsed widths - NEVER overwrite

    // Derived state
    const selectedVariant = variants.find((v) => v.id === selectedVariantId)
    const expandedFeature = expandedFeatureIndex >= 0 ? features[expandedFeatureIndex] : null
    const isExpanded = expandedFeatureIndex >= 0
    const isColorSelectorActive = expandedFeatureIndex === -2
    const hasActiveItem = isExpanded || isColorSelectorActive

    // Refs that depend on derived state
    const prevHasActiveItemRef = useRef(hasActiveItem) // Track previous active state for image transitions
    const prevBackgroundImageRef = useRef<string>('') // Track previous background image

    // All items (color selector + features)
    const allItems = useMemo(() => [
      ...(variants.length > 1 ? [{ type: 'color' as const, id: 'colors', index: -2 }] : []),
      ...features.map((f, i) => ({ type: 'feature' as const, id: f.id, index: i, feature: f })),
    ], [variants.length, features])

    // Find active item's array index
    const activeArrayIndex = useMemo(() => {
      if (isColorSelectorActive) return allItems.findIndex(item => item.type === 'color')
      if (isExpanded) return allItems.findIndex(item => item.type === 'feature' && item.index === expandedFeatureIndex)
      return null
    }, [isColorSelectorActive, isExpanded, expandedFeatureIndex, allItems])

    // Get neighbor peek value from config
    const neighborPeek = visualConfig.expandedCard.neighborPeek ?? DEFAULT_NEIGHBOR_PEEK

    // Calculate expanded card width dynamically: containerWidth - neighbor peeks and padding
    const expandedCardWidth = useMemo(() => {
      return containerWidth - (neighborPeek * 2) - (PADDING_LEFT * 2)
    }, [containerWidth, neighborPeek])

    // Track last active index when expanded + track expanded state for close detection
    useEffect(() => {
      if (hasActiveItem && activeArrayIndex !== null) {
        setLastActiveIndex(activeArrayIndex)
        wasExpandedRef.current = true
      }
    }, [hasActiveItem, activeArrayIndex])

    // Keep scrollOffsetRef in sync with state (for animation callbacks)
    useEffect(() => {
      scrollOffsetRef.current = scrollOffset
    }, [scrollOffset])

    // Update container width on mount/resize
    useEffect(() => {
      const updateWidth = () => setContainerWidth(window.innerWidth)
      updateWidth()
      window.addEventListener('resize', updateWidth)
      return () => window.removeEventListener('resize', updateWidth)
    }, [])

    // Measure pill widths from collapsed-state pills (only once, stored permanently in ref)
    const measurePillWidths = useCallback(() => {
      // Already measured - never re-measure
      if (collapsedWidthsRef.current.length === allItems.length) return
      // Don't measure while expanded - would get wrong widths
      if (hasActiveItem) return

      const widths: number[] = []
      allItems.forEach((_, index) => {
        const el = pillRefs.current.get(index)
        if (el) {
          widths[index] = el.offsetWidth
        }
      })
      if (widths.length === allItems.length && widths.every(w => w > 0)) {
        // Store permanently in ref (never overwrite)
        collapsedWidthsRef.current = widths
        setPillWidths(widths)

        // Log on load
        logPillState('ON LOAD', {
          containerWidth,
          expandedCardWidth,
          pillWidths: widths,
          scrollOffset: 0,
          centeredIndex: null,
          activeArrayIndex: null,
          hasActiveItem: false,
          allItems: allItems.map(item => ({ id: item.id, type: item.type })),
          neighborPeek,
        })
      }
    }, [allItems, hasActiveItem, containerWidth, expandedCardWidth])

    // Measure on mount (only once)
    useEffect(() => {
      if (!hasActiveItem && collapsedWidthsRef.current.length === 0) {
        const timer = setTimeout(measurePillWidths, 100)
        return () => clearTimeout(timer)
      }
    }, [measurePillWidths, hasActiveItem])

    // Measure content heights for smooth animations
    const measureContentHeights = useCallback(() => {
      const heights: number[] = []
      allItems.forEach((_, index) => {
        const el = contentMeasureRefs.current.get(index)
        if (el) {
          heights[index] = el.offsetHeight
        }
      })
      if (heights.length === allItems.length && heights.every(h => h > 0)) {
        setContentHeights(heights)
      }
    }, [allItems])

    useEffect(() => {
      const timer = setTimeout(measureContentHeights, 150)
      return () => clearTimeout(timer)
    }, [measureContentHeights])

    // Get pre-measured content height
    const getContentHeight = useCallback((arrayIndex: number) => {
      const measured = contentHeights[arrayIndex] || 100
      const item = allItems[arrayIndex]
      const buffer = item?.type === 'color' ? 16 : 0
      return measured + buffer
    }, [contentHeights, allItems])

    // Calculate total content width (replicating flexbox)
    const getTotalContentWidth = useCallback(() => {
      if (pillWidths.length === 0) return 0
      const pillsWidth = pillWidths.reduce((sum, w) => sum + w, 0)
      const gapsWidth = (pillWidths.length - 1) * PILL_GAP
      return PADDING_LEFT + pillsWidth + gapsWidth + PADDING_LEFT // padding on both sides
    }, [pillWidths])

    // Get scroll bounds (like flexbox - can't scroll past edges)
    const getScrollBounds = useCallback(() => {
      const totalWidth = getTotalContentWidth()
      if (totalWidth <= containerWidth) {
        return { min: 0, max: 0 } // No scrolling needed
      }
      return {
        min: -(totalWidth - containerWidth), // Last pill at right edge
        max: 0, // First pill at left edge
      }
    }, [getTotalContentWidth, containerWidth])

    // Clamp scroll offset to bounds (first/last pills stay at edges)
    const clampScrollOffset = useCallback((offset: number) => {
      const { min, max } = getScrollBounds()
      return Math.max(min, Math.min(max, offset))
    }, [getScrollBounds])

    // Calculate scrollOffset needed to center a specific pill
    const calculateScrollOffsetToCenter = useCallback((pillIndex: number) => {
      const getPillWidth = (idx: number) => pillWidths[idx] || 120

      // Calculate pill's position in the row (from left edge)
      let pillX = PADDING_LEFT
      for (let i = 0; i < pillIndex; i++) {
        pillX += getPillWidth(i) + PILL_GAP
      }

      const pillWidth = getPillWidth(pillIndex)
      const pillCenter = pillX + pillWidth / 2
      const screenCenter = containerWidth / 2

      // Offset needed to center this pill (will be clamped by bounds)
      return screenCenter - pillCenter
    }, [pillWidths, containerWidth])

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
        if (expandedFeature.mediaType === 'video' && isResponsiveVideo(expandedFeature.media)) {
          return expandedFeature.media.poster.large
        }
        return (expandedFeature.media as ResponsiveImage).large
      }
      if (selectedVariant) {
        return selectedVariant.image.large
      }
      return hero.image.large
    }

    // Determine animation type based on transition
    const currentImage = getCurrentBackgroundImage()
    const wasActive = prevHasActiveItemRef.current
    const prevImage = prevBackgroundImageRef.current

    let animationType: 'expand' | 'switch-card' | 'collapse' | 'initial' = 'initial'

    if (prevImage && prevImage !== currentImage) {
      if (!wasActive && hasActiveItem) {
        // Collapsed → Expanded: Zoom in to 115%
        animationType = 'expand'
      } else if (wasActive && !hasActiveItem) {
        // Expanded → Collapsed: Zoom out
        animationType = 'collapse'
      } else if (wasActive && hasActiveItem) {
        // Expanded → Expanded: Slide/fade between cards
        animationType = 'switch-card'
      }
    }

    // Update refs after determining animation
    useEffect(() => {
      prevHasActiveItemRef.current = hasActiveItem
      prevBackgroundImageRef.current = currentImage
    }, [hasActiveItem, currentImage])

    // Determine background size: contain for color picker variants, cover for everything else
    const getCurrentImage = getCurrentBackgroundImage()
    const isVariantImage = variants.some(v => v.image.large === getCurrentImage)
    const backgroundSize = isVariantImage ? 'contain' : 'cover'

    // Determine container background color (dynamic based on selected variant if enabled)
    const getContainerBackgroundColor = () => {
      const selectedVariant = variants.find((v) => v.id === selectedVariantId)
      const expandedFeature = expandedFeatureIndex >= 0 ? features[expandedFeatureIndex] : null

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

    // Animate scrollOffset to center a pill (used in collapsed mode)
    // First/last pills stay at edges (clamped like flexbox)
    const animateScrollToCenter = useCallback((arrayIndex: number) => {
      const rawOffset = calculateScrollOffsetToCenter(arrayIndex)
      const targetOffset = clampScrollOffset(rawOffset) // Clamp to bounds

      // Use Framer Motion's animate function
      animate(scrollOffsetRef.current, targetOffset, {
        duration: MOBILE_ANIMATIONS.pillScroll.duration,
        ease: MOBILE_ANIMATIONS.pillScroll.ease,
        onUpdate: (value) => {
          scrollOffsetRef.current = value
          setScrollOffset(value)
        },
      })
    }, [calculateScrollOffsetToCenter, clampScrollOffset])

    // When closing (transitioning from expanded to collapsed), set scrollOffset and restore centeredIndex
    useEffect(() => {
      if (!hasActiveItem && wasExpandedRef.current && lastActiveIndex !== null && pillWidths.length > 0) {
        const rawOffset = calculateScrollOffsetToCenter(lastActiveIndex)
        const clampedOffset = clampScrollOffset(rawOffset)

        // Log on close
        logPillState('ON CLOSE', {
          containerWidth,
          expandedCardWidth,
          pillWidths,
          scrollOffset: clampedOffset,
          centeredIndex: lastActiveIndex,
          activeArrayIndex: null,
          hasActiveItem: false,
          allItems: allItems.map(item => ({ id: item.id, type: item.type })),
          neighborPeek,
        })

        setScrollOffset(clampedOffset)
        setCenteredIndex(lastActiveIndex) // Restore centered state so single click expands again
        wasExpandedRef.current = false // Reset so this only runs on actual close
      }
    }, [hasActiveItem, lastActiveIndex, pillWidths.length, calculateScrollOffsetToCenter, clampScrollOffset, containerWidth, expandedCardWidth, pillWidths, allItems])

    // Handle pill click (two-click: center first, then expand)
    const handlePillClick = useCallback((item: typeof allItems[0], arrayIndex: number) => {
      const currentPillWidths = collapsedWidthsRef.current.length > 0 ? collapsedWidthsRef.current : pillWidths

      if (hasActiveItem) {
        // Already expanded - switch between pills
        const isActive = item.type === 'color' ? isColorSelectorActive : expandedFeatureIndex === item.index
        if (!isActive) {
          onFeatureToggle(item.index)
        }
      } else if (centeredIndex === arrayIndex) {
        // Second click - pill is centered, expand it
        // Log BEFORE expanding (will show state transition)
        const rawOffset = calculateScrollOffsetToCenter(arrayIndex)
        const currentScrollOffset = clampScrollOffset(rawOffset)

        logPillState('SECOND CLICK (EXPAND)', {
          containerWidth,
          expandedCardWidth,
          pillWidths: currentPillWidths,
          scrollOffset: currentScrollOffset,
          centeredIndex: arrayIndex,
          activeArrayIndex: arrayIndex, // Will become active
          hasActiveItem: true, // Will be expanded
          allItems: allItems.map(i => ({ id: i.id, type: i.type })),
          neighborPeek,
        })

        setCenteredIndex(null)
        onFeatureToggle(item.index)
      } else {
        // First click - center the pill
        const rawOffset = calculateScrollOffsetToCenter(arrayIndex)
        const targetScrollOffset = clampScrollOffset(rawOffset)

        logPillState('FIRST CLICK (CENTER)', {
          containerWidth,
          expandedCardWidth,
          pillWidths: currentPillWidths,
          scrollOffset: targetScrollOffset,
          centeredIndex: arrayIndex,
          activeArrayIndex: null,
          hasActiveItem: false,
          allItems: allItems.map(i => ({ id: i.id, type: i.type })),
          neighborPeek,
        })

        setCenteredIndex(arrayIndex)
        animateScrollToCenter(arrayIndex)
      }
    }, [hasActiveItem, centeredIndex, isColorSelectorActive, expandedFeatureIndex, onFeatureToggle, animateScrollToCenter, pillWidths, containerWidth, expandedCardWidth, allItems, calculateScrollOffsetToCenter, clampScrollOffset])

    // Register pill ref for measurement
    const setPillRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
      if (el) {
        pillRefs.current.set(index, el)
      }
    }, [])

    return (
      <Box
        ref={ref}
        sx={{
          position: 'relative',
          width: '100%',
          height: '85vh',
          minHeight: 480,
          maxHeight: 700,
          overflow: 'hidden',
        }}
      >
        {/* Background Image */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundColor: containerBackgroundColor,
            transition: `background-color ${MOBILE_ANIMATIONS.backgroundColor.duration} ${MOBILE_ANIMATIONS.backgroundColor.ease}`,
            overflow: 'hidden',
          }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={getCurrentBackgroundImage()}
              initial={
                animationType === 'expand'
                  ? { opacity: 0, scale: 1, x: 0 } // Feature starts invisible at normal scale
                  : animationType === 'switch-card'
                  ? { opacity: 1, scale: 1.2, x: 80 } // Start visible from right at 120%
                  : animationType === 'collapse'
                  ? { opacity: 0, scale: 1.2, x: 0 } // Hero starts invisible at 120%
                  : { opacity: 0, scale: 1, x: 0 }
              }
              animate={{
                opacity: 1,
                scale: hasActiveItem ? 1.2 : 1, // 120% when expanded
                x: 0,
              }}
              exit={
                animationType === 'expand'
                  ? { opacity: 0, scale: 1.2, x: 0 } // Hero fades out while enlarging to 120%
                  : animationType === 'switch-card'
                  ? { opacity: 0, scale: 1.2, x: -80 } // Fade out to left
                  : animationType === 'collapse'
                  ? { opacity: 0, scale: 1, x: 0 } // Feature scales down 120%→100% while fading out
                  : { opacity: 0 }
              }
              transition={{
                duration:
                  animationType === 'switch-card'
                    ? MOBILE_ANIMATIONS.backgroundImage.switchCard.duration
                    : MOBILE_ANIMATIONS.backgroundImage.expandCollapse.duration,
                ease:
                  animationType === 'expand'
                    ? MOBILE_ANIMATIONS.backgroundImage.expandCollapse.easeExpand
                    : animationType === 'collapse'
                    ? MOBILE_ANIMATIONS.backgroundImage.expandCollapse.easeCollapse
                    : MOBILE_ANIMATIONS.backgroundImage.switchCard.ease,
              }}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${getCurrentBackgroundImage()})`,
                backgroundSize,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                zIndex: animationType === 'switch-card' ? 2 : 1, // New image on top during switch
              }}
            />
          </AnimatePresence>
        </Box>

        {/* Dark overlay */}
        {visualConfig.container.overlayGradient && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: visualConfig.container.overlayGradient,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* 3D model for model features — three.js loads only when this mounts */}
        {expandedFeature?.mediaType === 'model' && ModelRendererComponent && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 10, // Above background images, like the video player
            }}
          >
            <ModelRendererComponent
              src={(expandedFeature.media as ProductViewerModel).src}
              poster={(expandedFeature.media as ProductViewerModel).poster?.large}
              background={(expandedFeature.media as ProductViewerModel).background}
            />
          </Box>
        )}

        {/* Video player */}
        {expandedFeature?.mediaType === 'video' && isResponsiveVideo(expandedFeature.media) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: containerBackgroundColor,
              transition: `background-color ${MOBILE_ANIMATIONS.backgroundColor.duration} ${MOBILE_ANIMATIONS.backgroundColor.ease}`,
              zIndex: 10, // Above background images
            }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            >
              <source src={expandedFeature.media.src} type="video/mp4" />
            </video>
          </Box>
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

        {/* Pills Strip - Single list, items animate between pill/expanded states */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            zIndex: 20, // Above video player
          }}
        >
          <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
            {allItems.map((item, arrayIndex) => {
              const isActive = hasActiveItem && (item.type === 'color'
                ? isColorSelectorActive
                : expandedFeatureIndex === item.index)
              const feature = item.type === 'feature' ? item.feature : null
              const isCentered = !hasActiveItem && centeredIndex === arrayIndex

              // Get pill width (always use collapsed width from ref - never changes)
              const getPillWidth = (idx: number) => collapsedWidthsRef.current[idx] || pillWidths[idx] || 120
              const myPillWidth = getPillWidth(arrayIndex)
              const hasMeasuredWidths = collapsedWidthsRef.current.length === allItems.length

              // Calculate X position using simplified, predictable calculations
              let xPosition: number
              if (hasActiveItem && activeArrayIndex !== null) {
                // EXPANDED MODE: fixed positions based on container width
                const expandedX = (containerWidth - expandedCardWidth) / 2

                if (arrayIndex === activeArrayIndex) {
                  // Active pill: centered
                  xPosition = expandedX
                } else if (arrayIndex === activeArrayIndex - 1) {
                  // Immediate left neighbor: peeks neighborPeek from left edge
                  xPosition = neighborPeek - myPillWidth
                } else if (arrayIndex === activeArrayIndex + 1) {
                  // Immediate right neighbor: peeks neighborPeek from right edge
                  xPosition = containerWidth - neighborPeek
                } else if (arrayIndex < activeArrayIndex) {
                  // Non-immediate left neighbors: pushed further off-screen
                  const distance = activeArrayIndex - arrayIndex
                  xPosition = neighborPeek - myPillWidth - (distance - 1) * (myPillWidth + PILL_GAP)
                } else {
                  // Non-immediate right neighbors: pushed further off-screen
                  const distance = arrayIndex - activeArrayIndex
                  xPosition = containerWidth - neighborPeek + (distance - 1) * (myPillWidth + PILL_GAP)
                }
              } else {
                // COLLAPSED MODE: simple row with scrollOffset
                let x = PADDING_LEFT
                for (let i = 0; i < arrayIndex; i++) {
                  x += getPillWidth(i) + PILL_GAP
                }
                xPosition = x + scrollOffset
              }

              // Neighbor detection for chevrons
              const isLeftNeighbor = hasActiveItem && activeArrayIndex !== null && arrayIndex === activeArrayIndex - 1
              const isRightNeighbor = hasActiveItem && activeArrayIndex !== null && arrayIndex === activeArrayIndex + 1

              return (
                <motion.div
                  key={item.id}
                  ref={setPillRef(arrayIndex)}
                  initial={false}
                  animate={{ x: xPosition }}
                  transition={{ x: { duration: MOBILE_ANIMATIONS.pillPosition.duration, ease: MOBILE_ANIMATIONS.pillPosition.ease } }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    // Width: fit-content before measurement, then CSS transition for expand/collapse
                    width: hasMeasuredWidths ? (isActive ? expandedCardWidth : myPillWidth) : 'fit-content',
                    // CSS transition for width (more reliable than framer-motion for this use case)
                    transition: hasMeasuredWidths ? `width ${MOBILE_ANIMATIONS.pillWidth.duration}s ${MOBILE_ANIMATIONS.pillWidth.ease}` : 'none',
                    overflow: 'hidden',
                    zIndex: isActive ? 10 : 1,
                  }}
                >
                  <motion.button
                    onClick={() => handlePillClick(item, arrayIndex)}
                    initial={false}
                    animate={{
                      backgroundColor: (() => {
                        const bgConfig = typeof visualConfig.pill.backgroundColor === 'string'
                          ? { default: visualConfig.pill.backgroundColor, hover: visualConfig.pill.backgroundColor, active: visualConfig.pill.backgroundColor }
                          : visualConfig.pill.backgroundColor
                        return isActive ? bgConfig.active : (isCentered ? bgConfig.hover : bgConfig.default)
                      })(),
                    }}
                    transition={{ duration: MOBILE_ANIMATIONS.pillBackground.duration, ease: MOBILE_ANIMATIONS.pillBackground.ease }}
                    style={{
                      ...getGlassEffectSx({
                        type: isActive ? visualConfig.expandedCard.glassEffect : visualConfig.pill.glassEffect,
                        intensity: isActive ? visualConfig.expandedCard.glassIntensity : visualConfig.pill.glassIntensity,
                      }),
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      width: '100%',
                      padding: '12px 16px',
                      boxSizing: 'border-box',
                      borderRadius: typeof visualConfig.pill.borderRadius === 'number'
                        ? (isActive ? 16 : visualConfig.pill.borderRadius)
                        : visualConfig.pill.borderRadius,
                      border: 'none',
                      color: isActive ? visualConfig.expandedCard.textColor : visualConfig.pill.textColor,
                      cursor: isActive ? 'default' : 'pointer',
                      textAlign: 'left',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Header row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        height: 24,
                        gap: 12,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {/* Left section: Icon Slot 1 + Label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Icon Slot 1: Expand/Close icon (hidden when left neighbor) */}
                        {item.type === 'color' ? (
                          <Box
                            onClick={isActive ? (e) => { e.stopPropagation(); onClose() } : undefined}
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: selectedVariant?.colorHex,
                              border: '2px solid rgba(255, 255, 255, 0.4)',
                              flexShrink: 0,
                              cursor: isActive ? 'pointer' : 'inherit',
                              '&:hover': isActive ? { transform: 'scale(1.1)' } : {},
                              visibility: isLeftNeighbor ? 'hidden' : 'visible',
                            }}
                          />
                        ) : (
                          <Box
                            onClick={isActive ? (e) => { e.stopPropagation(); onClose() } : undefined}
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: isRightNeighbor ? 'transparent' : visualConfig.expandedCard.backgroundColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              cursor: isActive ? 'pointer' : 'inherit',
                              '&:hover': isActive ? { transform: 'scale(1.1)' } : {},
                              visibility: isLeftNeighbor ? 'hidden' : 'visible',
                              marginLeft: isRightNeighbor ? '-8px' : 0,
                            }}
                          >
                            {(() => {
                              // Right neighbor chevron: uses pill text color (no background)
                              if (isRightNeighbor) {
                                const ChevronRightIconComponent = visualConfig.pill.icons.chevronRightIcon
                                return <ChevronRightIconComponent sx={{ fontSize: 16, color: visualConfig.pill.textColor }} />
                              }

                              // Expand/Close icons: use expandedCard colors
                              const IconComponent = isActive ? visualConfig.pill.icons.closeIcon : visualConfig.pill.icons.expandIcon
                              return (
                                <IconComponent
                                  sx={{
                                    fontSize: 14,
                                    color: visualConfig.expandedCard.textColor,
                                  }}
                                />
                              )
                            })()}
                          </Box>
                        )}

                        {/* Label */}
                        <Text
                          variant="body2"
                          text={item.type === 'color' ? 'Color' : (feature?.label || '')}
                          sx={{
                            color: isActive ? visualConfig.expandedCard.textColor : visualConfig.pill.textColor,
                            fontWeight: 500,
                            lineHeight: '24px',
                            margin: 0,
                            textTransform: 'none',
                          }}
                        />
                      </div>

                      {/* Icon Slot 2: Chevron icon (visible only when left neighbor) */}
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          visibility: isLeftNeighbor ? 'visible' : 'hidden',
                          marginRight: '-8px',
                        }}
                      >
                        {(() => {
                          const ChevronLeftIconComponent = visualConfig.pill.icons.chevronLeftIcon
                          return <ChevronLeftIconComponent sx={{ fontSize: 16, color: visualConfig.pill.textColor }} />
                        })()}
                      </Box>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence mode="sync">
                      {isActive && (
                        <motion.div
                          key={`content-${item.id}`}
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: getContentHeight(arrayIndex), opacity: 1, marginTop: 12 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                         // transition={{ 
                         // duration: MOBILE_ANIMATIONS.expandedContent.duration, 
                         // ease: MOBILE_ANIMATIONS.expandedContent.ease 
                         //}}
                         transition={{                                                                                                                                                                       
                          opacity: { duration: MOBILE_ANIMATIONS.expandedContent.duration, ease: MOBILE_ANIMATIONS.expandedContent.ease },                                                                                                                             
                          height: { duration: MOBILE_ANIMATIONS.expandedContent.duration, delay: 0.1, ease: MOBILE_ANIMATIONS.expandedContent.ease },                                                                                                                  
                          marginTop: { duration: MOBILE_ANIMATIONS.expandedContent.duration, delay: 0.1, ease: MOBILE_ANIMATIONS.expandedContent.ease },                                                                                                               
                        }} 
                          style={{ overflow: 'hidden', width: '100%' }}
                        >
                          {item.type === 'feature' && expandedFeature && (
                            <Text
                              variant="body2"
                              text={expandedFeature.description}
                              sx={{
                                color: visualConfig.expandedCard.textColor,
                                opacity: visualConfig.expandedCard.descriptionOpacity,
                                lineHeight: 1.5,
                                whiteSpace: 'normal',
                              }}
                            />
                          )}

                          {item.type === 'color' && (
                            <>
                              <Text
                                variant="body2"
                                text={`${hero.name} displayed in ${selectedVariant?.label || ''}`}
                                sx={{
                                  color: visualConfig.expandedCard.textColor,
                                  opacity: visualConfig.expandedCard.descriptionOpacity,
                                  lineHeight: 1.5,
                                  marginBottom: '12px',
                                  whiteSpace: 'normal',
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
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              )
            })}
          </Box>
        </Box>

        {/* Hidden measurement container - renders all content to measure heights */}
        <Box
          sx={{
            position: 'absolute',
            visibility: 'hidden',
            pointerEvents: 'none',
            width: expandedCardWidth - 32, // Account for padding (16px each side)
            left: -9999,
          }}
        >
          {allItems.map((item, arrayIndex) => {
            const feature = item.type === 'feature' ? item.feature : null
            return (
              <div
                key={`measure-${item.id}`}
                ref={(el) => {
                  if (el) contentMeasureRefs.current.set(arrayIndex, el)
                }}
              >
                {item.type === 'feature' && feature && (
                  <Text
                    variant="body2"
                    text={feature.description}
                    sx={{
                      color: visualConfig.expandedCard.textColor,
                      opacity: visualConfig.expandedCard.descriptionOpacity,
                      lineHeight: 1.5,
                      whiteSpace: 'normal',
                    }}
                  />
                )}
                {item.type === 'color' && (
                  <>
                    <Text
                      variant="body2"
                      text={`${hero.name} displayed in ${selectedVariant?.label || ''}`}
                      sx={{
                        color: visualConfig.expandedCard.textColor,
                        opacity: visualConfig.expandedCard.descriptionOpacity,
                        lineHeight: 1.5,
                        mb: 1.5,
                        whiteSpace: 'normal',
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
                  </>
                )}
              </div>
            )
          })}
        </Box>
      </Box>
    )
  }
)

ProductViewerMobile.displayName = 'ProductViewerMobile'
