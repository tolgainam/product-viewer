/**
 * ProductViewer Component
 *
 * Apple-inspired product viewer organism with:
 * - Expandable feature cards
 * - Color variant switching with crossfade
 * - Static images + optional video
 * - Scroll-triggered animations (Framer Motion)
 *
 * DESIGN INSPIRATION:
 * Based on Apple's iPhone 17 Pro product viewer with expandable
 * feature cards, color selection, and media galleries.
 *
 * LAYOUT:
 * - Desktop: Two-column (gallery left, controls right)
 * - Mobile: Stacked (gallery top, controls bottom)
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

import { forwardRef, useState, useCallback, useRef } from 'react'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { colors, getSpacingPx } from './internal/tokens'
import { motion, useInView } from 'framer-motion'
import { ProductViewerMobile } from './ProductViewerMobile'
import { ProductViewerDesktop } from './ProductViewerDesktop'
import { liquidGlassConfig } from './ProductViewerConfig'
import type { ProductViewerProps } from './ProductViewer.types'

// Scroll-triggered fade-in animation
const fadeInVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as const,
    },
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
    },
    ref
  ) => {
    // ============================================================================
    // CONTENT
    // ============================================================================

    // Everything comes from the `data` prop — typically a JSON file. Missing
    // variants or features are tolerated; a missing hero renders an empty container.
    const { hero, variants = [], features = [] } = data

    // Use liquidGlassConfig by default if no config provided (better for product showcases)
    const visualConfig = visualConfigProp || liquidGlassConfig

    // ============================================================================
    // RESPONSIVE DETECTION
    // ============================================================================

    const theme = useTheme()
    // Use mobile/tablet layout for screens under 'lg' (1200px)
    const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('lg'))

    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    // Selected variant (defaults to first variant or provided default)
    const [selectedVariantId, setSelectedVariantId] = useState<string>(
      defaultVariantId || (variants.length > 0 ? variants[0].id : '')
    )

    // Expanded feature index (-1 means none expanded)
    const [expandedFeatureIndex, setExpandedFeatureIndex] = useState<number>(
      defaultFeatureIndex
    )

    // Ref for scroll animation trigger
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, margin: '-100px' })

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    /**
     * Handle variant selection change
     */
    const handleVariantChange = useCallback(
      (variantId: string) => {
        setSelectedVariantId(variantId)
        onVariantChange?.(variantId)
      },
      [onVariantChange]
    )

    /**
     * Handle feature toggle (expand/collapse)
     */
    const handleFeatureToggle = useCallback(
      (index: number) => {
        const newIndex = expandedFeatureIndex === index ? -1 : index
        setExpandedFeatureIndex(newIndex)
        onFeatureToggle?.(index, newIndex === index)
      },
      [expandedFeatureIndex, onFeatureToggle]
    )

    /**
     * Navigate to previous feature
     */
    const handlePreviousFeature = useCallback(() => {
      if (expandedFeatureIndex > 0) {
        const newIndex = expandedFeatureIndex - 1
        setExpandedFeatureIndex(newIndex)
        onFeatureToggle?.(newIndex, true)
      }
    }, [expandedFeatureIndex, onFeatureToggle])

    /**
     * Navigate to next feature
     */
    const handleNextFeature = useCallback(() => {
      if (expandedFeatureIndex < features.length - 1) {
        const newIndex = expandedFeatureIndex + 1
        setExpandedFeatureIndex(newIndex)
        onFeatureToggle?.(newIndex, true)
      }
    }, [expandedFeatureIndex, features.length, onFeatureToggle])

    /**
     * Close expanded feature
     */
    const handleClose = useCallback(() => {
      if (expandedFeatureIndex >= 0) {
        onFeatureToggle?.(expandedFeatureIndex, false)
      }
      setExpandedFeatureIndex(-1)
    }, [expandedFeatureIndex, onFeatureToggle])

    // ============================================================================
    // RENDER
    // ============================================================================

    if (!hero) {
      console.warn('[ProductViewer] `data.hero` is missing — rendering an empty container.')
      return <Box ref={ref} className={className} data-product-id={data.id} />
    }

    // Mobile/Tablet Layout (Apple-style full-screen with bottom pills)
    if (isMobileOrTablet) {
      return (
        <Box
          ref={ref}
          className={className}
          data-product-id={data.id}
          sx={{
            width: '100%',
            backgroundColor: colors.primary.dark,
            overflow: 'hidden',
          }}
        >
          <ProductViewerMobile
            hero={hero}
            variants={variants}
            features={features}
            selectedVariantId={selectedVariantId}
            expandedFeatureIndex={expandedFeatureIndex}
            onVariantChange={handleVariantChange}
            onFeatureToggle={handleFeatureToggle}
            onPreviousFeature={handlePreviousFeature}
            onNextFeature={handleNextFeature}
            onClose={handleClose}
            visualConfig={visualConfig}
            modelRenderer={modelRenderer}
          />
        </Box>
      )
    }

    // Desktop Layout (Two-column with pills)
    return (
      <Box
        ref={ref}
        className={className}
        data-product-id={data.id}
        sx={{
          width: '100%',
          backgroundColor: colors.background.default,
          overflow: 'hidden',
          padding: { xs: getSpacingPx(3), md: getSpacingPx(5) },
        }}
      >
        <motion.div
          ref={containerRef}
          variants={fadeInVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <ProductViewerDesktop
            hero={hero}
            variants={variants}
            features={features}
            selectedVariantId={selectedVariantId}
            expandedFeatureIndex={expandedFeatureIndex}
            onVariantChange={handleVariantChange}
            onFeatureToggle={handleFeatureToggle}
            onClose={handleClose}
            visualConfig={visualConfig}
            modelRenderer={modelRenderer}
          />
        </motion.div>
      </Box>
    )
  }
)

ProductViewer.displayName = 'ProductViewer'
