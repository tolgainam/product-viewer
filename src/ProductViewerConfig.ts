/**
 * ProductViewer Visual Configuration
 *
 * Centralized styling configuration for ProductViewer component (desktop and mobile).
 * Allows customization of colors, backgrounds, glass effects, icons, and dimensions
 * with presets for different visual themes including Apple-inspired liquid glass effects.
 *
 * @module ProductViewerConfig
 * @category Organisms
 *
 * @example Basic Usage
 * ```typescript
 * import { defaultConfig, liquidGlassConfig } from './ProductViewerConfig'
 *
 * // Use default configuration
 * <ProductViewer visualConfig={defaultConfig} {...props} />
 *
 * // Use liquid glass effect (Apple-style)
 * <ProductViewer visualConfig={liquidGlassConfig} {...props} />
 * ```
 *
 * @example Custom Configuration
 * ```typescript
 * const customConfig: ProductViewerVisualConfig = {
 *   ...defaultConfig,
 *   pill: {
 *     ...defaultConfig.pill,
 *     maxWidth: 400, // Wider pills panel on desktop
 *   },
 *   expandedCard: {
 *     ...defaultConfig.expandedCard,
 *     maxWidth: 320, // Wider expanded content
 *     neighborPeek: 48, // More neighbor peek on mobile
 *   },
 *   container: {
 *     ...defaultConfig.container,
 *     dynamicBackground: true, // Enable color-based backgrounds
 *   },
 * }
 * ```
 *
 * @example Dynamic Backgrounds
 * ```typescript
 * // Enable in config
 * const config = { ...defaultConfig, container: { ...defaultConfig.container, dynamicBackground: true } }
 *
 * // Add backgroundColor to variants
 * const variants = [
 *   { id: 'green', colorHex: '#2D5A4A', backgroundColor: '#1a2e28', ... },
 *   { id: 'blue', colorHex: '#5B9BD5', backgroundColor: '#1a2d3d', ... },
 * ]
 * ```
 *
 * @example Configurable Dimensions
 * ```typescript
 * // Create a wide layout configuration
 * const wideConfig: ProductViewerVisualConfig = {
 *   ...defaultConfig,
 *   pill: {
 *     ...defaultConfig.pill,
 *     maxWidth: 420, // Wider pills panel on desktop (default: 340px)
 *   },
 *   expandedCard: {
 *     ...defaultConfig.expandedCard,
 *     maxWidth: 360, // Wider expanded content on desktop (default: 280px)
 *     neighborPeek: 48, // More neighbor pills visible on mobile (default: 32px)
 *   },
 * }
 *
 * <ProductViewer visualConfig={wideConfig} {...props} />
 * ```
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { ProductViewerVisualConfig } from './ProductViewer.types'

// Re-export type for convenience
export type { ProductViewerVisualConfig } from './ProductViewer.types'

/**
 * Default Configuration
 *
 * Classic frosted glass effect with medium blur and subtle backgrounds.
 * This matches the original ProductViewer styling.
 *
 * **Visual Characteristics:**
 * - Frosted glass pills with medium blur (20px saturate 180%)
 * - Semi-transparent white backgrounds
 * - Dark icon backgrounds with accent color on active state
 * - Subtle gradient overlay on mobile
 *
 * @example
 * ```typescript
 * <ProductViewer visualConfig={defaultConfig} {...props} />
 * ```
 */
export const defaultConfig: ProductViewerVisualConfig = {
  pill: {
    backgroundColor: {
      default: 'rgba(50 , 50, 40, 0.65)',
      hover: 'rgba(100, 255, 255, 0.25)',
      active: 'rgba(20, 20, 20, 0.65)',
    },
    glassEffect: 'liquid',
    glassIntensity: 'medium',
    textColor: '#ffffff',
    borderRadius: 24,
    icons: {
      expandIcon: AddIcon,
      closeIcon: CloseIcon,
      chevronLeftIcon: ChevronLeftIcon,
      chevronRightIcon: ChevronRightIcon,
    },
  },
  expandedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    glassEffect: 'frosted',
    glassIntensity: 'medium',
    textColor: '#ffffff',
    descriptionOpacity: 0.8,
  },
  container: {
    backgroundColor: '#1a1a1a',
    overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)',
    dynamicBackground: false,
  },
  closeButton: {
    backgroundColor: {
      default: 'rgba(255, 255, 255, 0.15)',
      hover: 'rgba(255, 255, 255, 0.25)',
    },
    glassEffect: 'frosted',
    iconColor: '#ffffff',
  },
}

/**
 * Liquid Glass Configuration
 *
 * Apple-inspired liquid glass effect (macOS Big Sur / iOS 15 style).
 * Enhanced blur, saturation, and vibrancy with stronger transparency effects.
 *
 * **Visual Characteristics:**
 * - Strong liquid glass blur (60px saturate 220%)
 * - Higher transparency for depth perception
 * - Transparent icon backgrounds with subtle active states
 * - Darker container background for contrast
 * - Inner shadows for added dimensionality
 *
 * @example
 * ```typescript
 * <ProductViewer visualConfig={liquidGlassConfig} {...props} />
 * ```
 */
export const liquidGlassConfig: ProductViewerVisualConfig = {
  pill: {
    backgroundColor: {
      default: 'rgba(255, 255, 255, 0.25)',
      hover: 'rgba(255, 255, 255, 0.35)',
      active: 'rgba(255, 255, 255, 0.35)',
    },
    glassEffect: 'frosted',
    glassIntensity: 'medium',
    textColor: '#000',
    borderRadius: 24,
    icons: {
      expandIcon: AddIcon,
      closeIcon: CloseIcon,
      chevronLeftIcon: ChevronLeftIcon,
      chevronRightIcon: ChevronRightIcon,
    },
  },
  expandedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    glassEffect: 'liquid',
    glassIntensity: 'strong',
    textColor: '#333',
    descriptionOpacity: 0.9,
  },
  container: {
    backgroundColor: '#0a0a0a',
    overlayGradient: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
    dynamicBackground: true,
  },
  closeButton: {
    backgroundColor: {
      default: 'rgba(255, 255, 255, 0.25)',
      hover: 'rgba(255, 255, 255, 0.35)',
    },
    glassEffect: 'liquid',
    iconColor: '#ffffff',
  },
}

/**
 * Transparent Blue Configuration
 *
 * Blue-tinted glass with iOS-inspired aesthetics.
 * Perfect for tech products or modern digital experiences.
 *
 * **Visual Characteristics:**
 * - Blue-tinted frosted glass (rgba(0, 122, 255, ...))
 * - Medium blur with blue color palette
 * - Blue icon backgrounds with active state highlighting
 * - Dark blue container background
 * - Gradient overlay with blue tint
 *
 * @example
 * ```typescript
 * <ProductViewer visualConfig={transparentBlueConfig} {...props} />
 * ```
 */
export const transparentBlueConfig: ProductViewerVisualConfig = {
  pill: {
    backgroundColor: {
      default: 'rgba(0, 122, 255, 0.2)',
      hover: 'rgba(0, 122, 255, 0.3)',
      active: 'rgba(0, 122, 255, 0.4)',
    },
    glassEffect: 'frosted',
    glassIntensity: 'medium',
    textColor: '#ffffff',
    borderRadius: 24,
    icons: {
      expandIcon: AddIcon,
      closeIcon: CloseIcon,
      chevronLeftIcon: ChevronLeftIcon,
      chevronRightIcon: ChevronRightIcon,
    },
  },
  expandedCard: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    glassEffect: 'frosted',
    glassIntensity: 'medium',
    textColor: '#ffffff',
    descriptionOpacity: 0.85,
  },
  container: {
    backgroundColor: '#0a1929',
    overlayGradient: 'linear-gradient(to top, rgba(0, 25, 41, 0.8) 0%, transparent 40%)',
    dynamicBackground: false,
  },
  closeButton: {
    backgroundColor: {
      default: 'rgba(0, 122, 255, 0.3)',
      hover: 'rgba(0, 122, 255, 0.4)',
    },
    glassEffect: 'frosted',
    iconColor: '#ffffff',
  },
}

/**
 * Light Theme Configuration
 *
 * Clean light background with dark text and subtle glass effects.
 * Perfect for products that benefit from bright, airy aesthetics.
 *
 * **Visual Characteristics:**
 * - Light container background (#f5f5f5)
 * - Dark text for readability (#1a1a1a)
 * - Subtle glass pills with light transparency
 * - Minimal gradient overlay
 * - Clean, modern appearance
 *
 * @example
 * ```typescript
 * <ProductViewer visualConfig={lightConfig} {...props} />
 * ```
 */
export const lightConfig: ProductViewerVisualConfig = {
  pill: {
    backgroundColor: {
      default: 'rgba(0, 0, 0, 0.08)',
      hover: 'rgba(0, 0, 0, 0.12)',
      active: 'rgba(0, 0, 0, 0.15)',
    },
    glassEffect: 'frosted',
    glassIntensity: 'light',
    textColor: '#1a1a1a',
    borderRadius: 24,
    icons: {
      expandIcon: AddIcon,
      closeIcon: CloseIcon,
      chevronLeftIcon: ChevronLeftIcon,
      chevronRightIcon: ChevronRightIcon,
    },
  },
  expandedCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    glassEffect: 'frosted',
    glassIntensity: 'light',
    textColor: '#1a1a1a',
    descriptionOpacity: 0.75,
  },
  container: {
    backgroundColor: '#f5f5f5',
    overlayGradient: 'linear-gradient(to top, rgba(255,255,255,0.5) 0%, transparent 40%)',
    dynamicBackground: false,
  },
  closeButton: {
    backgroundColor: {
      default: 'rgba(0, 0, 0, 0.1)',
      hover: 'rgba(0, 0, 0, 0.15)',
    },
    glassEffect: 'frosted',
    iconColor: '#1a1a1a',
  },
}

/**
 * Dynamic Background Configuration
 *
 * Based on defaultConfig with dynamic background colors enabled.
 * Container background changes to match selected color variant.
 *
 * **Visual Characteristics:**
 * - Same as defaultConfig (frosted glass, medium blur)
 * - Dynamic background: changes with color selection
 * - Reverts to default when features are expanded
 *
 * @example
 * ```typescript
 * <ProductViewer visualConfig={dynamicBackgroundConfig} {...props} />
 * ```
 */
export const dynamicBackgroundConfig: ProductViewerVisualConfig = {
  ...liquidGlassConfig,
  container: {
    ...liquidGlassConfig.container,
    dynamicBackground: true,
  },
}
