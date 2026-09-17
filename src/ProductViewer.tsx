/**
 * ProductViewer Component
 *
 * Apple-inspired product viewer organism with:
 * - Expandable feature cards
 * - Color variant switching with crossfade
 * - Static images + optional video
 * - Scroll-triggered animations (Framer Motion)
 *
 * LAYOUT:
 * - Desktop: stage with a floating pill stack on the left
 * - Mobile: full-width stage with a swipeable pill strip at the bottom
 *
 * The layout is chosen from the component's own width (see `breakpoint`), so a viewer
 * in a narrow column gets the mobile layout on any screen.
 *
 * USAGE:
 * ```tsx
 * import product from './example-product.json'
 *
 * <ProductViewer data={product} />
 * ```
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { motion, MotionConfig, useInView } from 'framer-motion'
import { ProductViewerMobile } from './ProductViewerMobile'
import { ProductViewerDesktop } from './ProductViewerDesktop'
import { liquidGlassConfig } from './ProductViewerConfig'
import { useElementWidth, useMediaQuery } from './internal/hooks'
import { resolveLabels } from './internal/labels'
import { prefetchProductImages } from './internal/media'
import { useViewerStyles } from './internal/styles'
import { buildViewerItems, COLOR_ITEM_INDEX } from './internal/viewer-items'
import type { ProductViewerProps } from './ProductViewer.types'

/** Width below which the mobile layout is used, unless `breakpoint` says otherwise */
export const DEFAULT_BREAKPOINT = 1200

// Scroll-triggered fade-in animation
const fadeInVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
}

export const ProductViewer = forwardRef<HTMLDivElement, ProductViewerProps>(
  (
    {
      data,
      defaultVariantId,
      defaultFeatureIndex = -1,
      onVariantChange,
      onFeatureToggle,
      className,
      visualConfig: visualConfigProp,
      modelRenderer,
      breakpoint = DEFAULT_BREAKPOINT,
      layout = 'auto',
      labels: labelOverrides,
    },
    ref
  ) => {
    useViewerStyles()

    // ============================================================================
    // CONTENT
    // ============================================================================

    // Everything comes from the `data` prop — typically a JSON file. Missing
    // variants or features are tolerated; a missing hero renders an empty container.
    const { hero, variants = [], features = [] } = data

    // Use liquidGlassConfig by default if no config provided (better for product showcases)
    const visualConfig = visualConfigProp || liquidGlassConfig
    const labels = useMemo(() => resolveLabels(labelOverrides), [labelOverrides])
    const items = useMemo(() => buildViewerItems(variants, features), [variants, features])

    // ============================================================================
    // RESPONSIVE DETECTION
    // ============================================================================

    const rootRef = useRef<HTMLDivElement>(null)
    useImperativeHandle(ref, () => rootRef.current as HTMLDivElement, [])

    // Measured on the element itself; the viewport query only covers the first paint,
    // the server, and browsers without ResizeObserver.
    const measuredWidth = useElementWidth(rootRef)
    const viewportIsNarrow = useMediaQuery(`(max-width: ${breakpoint - 0.02}px)`)
    const isMobile =
      layout === 'mobile'
        ? true
        : layout === 'desktop'
          ? false
          : measuredWidth !== null && measuredWidth > 0
            ? measuredWidth < breakpoint
            : viewportIsNarrow

    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    // Selected variant (defaults to first variant or provided default). An id that is
    // not in `variants` — a stale default, or content that changed — falls back to the first.
    const [variantState, setVariantState] = useState<string>(defaultVariantId ?? variants[0]?.id ?? '')
    const selectedVariantId = variants.some((v) => v.id === variantState) ? variantState : (variants[0]?.id ?? '')

    // Expanded item: -1 none, -2 colour selector, 0+ a feature. Out-of-range values close.
    const [featureState, setFeatureState] = useState<number>(defaultFeatureIndex)
    const expandedFeatureIndex =
      (featureState === COLOR_ITEM_INDEX && variants.length > 1) ||
      (featureState >= 0 && featureState < features.length)
        ? featureState
        : -1

    const activeItemIndex = items.findIndex((item) => item.index === expandedFeatureIndex)
    const canGoPrevious = activeItemIndex > 0
    const canGoNext = activeItemIndex >= 0 && activeItemIndex < items.length - 1

    // Ref for scroll animation trigger
    const isInView = useInView(rootRef, { once: true, amount: 0.15 })

    // Warm the cache with the other variants and feature media once the page is idle
    useEffect(() => (hero ? prefetchProductImages(hero, variants, features) : undefined), [hero, variants, features])

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    const handleVariantChange = useCallback(
      (variantId: string) => {
        setVariantState(variantId)
        onVariantChange?.(variantId)
      },
      [onVariantChange]
    )

    /** Open the item at `index`, or close it when it is already open */
    const handleFeatureToggle = useCallback(
      (index: number) => {
        const newIndex = expandedFeatureIndex === index ? -1 : index
        setFeatureState(newIndex)
        onFeatureToggle?.(index, newIndex === index)
      },
      [expandedFeatureIndex, onFeatureToggle]
    )

    const openItem = useCallback(
      (position: number) => {
        const item = items[position]
        if (!item) return
        setFeatureState(item.index)
        onFeatureToggle?.(item.index, true)
      },
      [items, onFeatureToggle]
    )

    const handlePrevious = useCallback(() => {
      if (canGoPrevious) openItem(activeItemIndex - 1)
    }, [canGoPrevious, activeItemIndex, openItem])

    const handleNext = useCallback(() => {
      if (canGoNext) openItem(activeItemIndex + 1)
    }, [canGoNext, activeItemIndex, openItem])

    const handleClose = useCallback(() => {
      if (expandedFeatureIndex !== -1) onFeatureToggle?.(expandedFeatureIndex, false)
      setFeatureState(-1)
    }, [expandedFeatureIndex, onFeatureToggle])

    /** Escape closes; arrow keys move between open cards. Swatches handle their own arrows. */
    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        if (activeItemIndex < 0) return
        if (event.key === 'Escape') {
          event.preventDefault()
          handleClose()
          return
        }
        if ((event.target as HTMLElement).closest('[role="radiogroup"]')) return
        const previousKey = isMobile ? 'ArrowLeft' : 'ArrowUp'
        const nextKey = isMobile ? 'ArrowRight' : 'ArrowDown'
        if (event.key === previousKey) {
          event.preventDefault()
          handlePrevious()
        } else if (event.key === nextKey) {
          event.preventDefault()
          handleNext()
        }
      },
      [activeItemIndex, isMobile, handleClose, handlePrevious, handleNext]
    )

    // ============================================================================
    // RENDER
    // ============================================================================

    if (!hero) {
      console.warn('[ProductViewer] `data.hero` is missing — rendering an empty container.')
      return <div ref={rootRef} className={className} data-product-id={data.id} />
    }

    const layoutProps = {
      hero,
      variants,
      features,
      items,
      selectedVariantId,
      expandedFeatureIndex,
      activeItemIndex,
      canGoPrevious,
      canGoNext,
      onVariantChange: handleVariantChange,
      onFeatureToggle: handleFeatureToggle,
      onPrevious: handlePrevious,
      onNext: handleNext,
      onClose: handleClose,
      visualConfig,
      labels,
      modelRenderer,
    }

    return (
      <MotionConfig reducedMotion="user">
        <div
          ref={rootRef}
          className={className}
          data-product-id={data.id}
          data-layout={isMobile ? 'mobile' : 'desktop'}
          onKeyDown={handleKeyDown}
          style={{ position: 'relative', width: '100%' }}
        >
          <motion.div variants={fadeInVariants} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
            {isMobile ? <ProductViewerMobile {...layoutProps} /> : <ProductViewerDesktop {...layoutProps} />}
          </motion.div>
        </div>
      </MotionConfig>
    )
  }
)

ProductViewer.displayName = 'ProductViewer'
