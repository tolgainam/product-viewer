/**
 * ProductViewer Component Types
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import type { ComponentType } from 'react'
import type { GlassEffectType, GlassIntensity } from './internal/glass-effects'
import type { SvgIconComponent } from '@mui/icons-material'

/** What a model renderer receives. See {@link ModelRenderer}. */
export interface ModelRendererProps {
  /** URL of the .glb / .gltf file */
  src: string
  /** Backdrop behind the model */
  background?: string
  /** Image to show while loading or if the model fails */
  poster?: string
}

/**
 * Component that draws a 3D model, supplied by the host app.
 *
 * The package ships one at `@tolgainam/product-viewer/model`; importing that entry is what
 * pulls in three.js, so apps without 3D features never install or bundle it.
 */
export type ModelRenderer = ComponentType<ModelRendererProps>

/**
 * Visual configuration for ProductViewer component
 *
 * Centralized styling configuration that allows customization of colors,
 * backgrounds, glass effects, and icons for both desktop and mobile variants.
 *
 * @example
 * ```typescript
 * const customConfig: ProductViewerVisualConfig = {
 *   pill: {
 *     backgroundColor: 'rgba(0, 122, 255, 0.2)',
 *     glassEffect: 'liquid',
 *     textColor: '#ffffff',
 *     // ... other pill config
 *   },
 *   // ... other sections
 * }
 * ```
 */
export interface ProductViewerVisualConfig {
  /** Pill component styling (collapsed and active states) */
  pill: {
    /** Background color (single value or state-specific) */
    backgroundColor: string | { default: string; hover: string; active: string }
    /** Type of glass effect to apply */
    glassEffect: GlassEffectType
    /** Intensity of glass effect */
    glassIntensity?: GlassIntensity
    /** Text color */
    textColor: string
    /** Border radius (24 for pills, 16 for expanded) */
    borderRadius: number | string
    /** Max width for pills panel on desktop (default: 340px) */
    maxWidth?: number
    /** Icon configuration */
    icons: {
      /** Icon to show when pill is collapsed (expand action) */
      expandIcon: SvgIconComponent
      /** Icon to show when pill is active (close action) */
      closeIcon: SvgIconComponent
      /** Left chevron icon for left neighbor */
      chevronLeftIcon: SvgIconComponent
      /** Right chevron icon for right neighbor */
      chevronRightIcon: SvgIconComponent
      // Note: Icon colors are automatically derived from container (pill or expandedCard)
    }
  }

  /** Expanded card styling */
  expandedCard: {
    /** Background color */
    backgroundColor: string
    /** Type of glass effect to apply */
    glassEffect: GlassEffectType
    /** Intensity of glass effect */
    glassIntensity?: GlassIntensity
    /** Text color */
    textColor: string
    /** Description text opacity (0-1) */
    descriptionOpacity: number
    /** Max width for expanded card content on desktop (default: 280px) */
    maxWidth?: number
    /** Neighbor peek amount on mobile - how much neighbor pills show (default: 32px) */
    neighborPeek?: number
  }

  /** Container/background styling */
  container: {
    /** Main background color */
    backgroundColor: string
    /** Optional gradient overlay (for mobile bottom fade) */
    overlayGradient?: string
    /** Enable dynamic background colors based on selected color variant */
    dynamicBackground?: boolean
  }

  /** Close button styling (mobile) */
  closeButton: {
    /** Background color (single value or state-specific) */
    backgroundColor: string | { default: string; hover: string }
    /** Type of glass effect to apply */
    glassEffect: GlassEffectType
    /** Icon color */
    iconColor: string
  }
}

/**
 * Responsive image configuration for different breakpoints
 */
export interface ResponsiveImage {
  small: string
  medium: string
  large: string
  small2x?: string
  medium2x?: string
  large2x?: string
  alt: string
}

/**
 * Responsive video configuration
 */
export interface ResponsiveVideo {
  src: string
  poster: ResponsiveImage
  startFrame?: string
  endFrame?: string
}

/**
 * Product color/variant option
 */
export interface ProductViewerVariant {
  id: string
  label: string
  colorHex: string
  image: ResponsiveImage
  ariaLabel?: string
  /** Optional background color for container when this variant is selected (requires dynamicBackground enabled) */
  backgroundColor?: string
}

/**
 * A flat colour background instead of media — for features whose point is the finish
 * or the colourway rather than a picture.
 */
export interface ProductViewerColor {
  /** Any CSS colour, e.g. "#1a2e28" */
  color: string
  alt?: string
}

/**
 * A 3D model background (GLB/GLTF).
 *
 * Rendering it needs `three`, `@react-three/fiber` and `@react-three/drei`, which are peer
 * dependencies of this package. The scene is code-split, so three.js is fetched only when a
 * model feature is first opened; if the model fails to load, `poster` is shown instead.
 */
export interface ProductViewerModel {
  /** URL of the .glb / .gltf file */
  src: string
  /** Shown while the model loads, and if the 3D libraries are not installed */
  poster?: ResponsiveImage
  /** Backdrop behind the model; defaults to a dark grey that suits most products */
  background?: string
  alt?: string
}

/**
 * Expandable feature card configuration
 */
export interface ProductViewerFeature {
  id: string
  /** Short text on the pill, and the heading of the expanded card */
  label: string
  /**
   * Longer headline. Carried with the content but not displayed by the current
   * layouts — the pill shows `label` and the expanded card shows `description`.
   */
  title?: string
  description: string
  /** Which kind of background this feature shows */
  mediaType: 'image' | 'video' | 'color' | 'model'
  media: ResponsiveImage | ResponsiveVideo | ProductViewerColor | ProductViewerModel
  footnotes?: string[]
}

/**
 * Hero/initial display configuration
 */
export interface ProductViewerHero {
  /** Product name for display */
  name: string
  image: ResponsiveImage
  video?: ResponsiveVideo
  alt: string
}

/**
 * Content for one product — the shape of the JSON file you pass in.
 * Matches `schema/product-viewer.schema.json`.
 *
 * @example
 * ```tsx
 * import product from './example-product.json'
 * <ProductViewer data={product} />
 * ```
 */
export interface ProductViewerData {
  /** Optional identifier, rendered as data-product-id for analytics */
  id?: string
  /** Hero image/video and product name */
  hero: ProductViewerHero
  /** Selectable colour variants (may be empty) */
  variants: ProductViewerVariant[]
  /** Expandable feature cards (may be empty) */
  features: ProductViewerFeature[]
}

/**
 * ProductViewer main component props
 */
export interface ProductViewerProps {
  /** Product content, typically imported from a JSON file */
  data: ProductViewerData
  /** Default selected variant ID */
  defaultVariantId?: string
  /** Default expanded feature index (-1 for none, -2 for color selector) */
  defaultFeatureIndex?: number
  /** Callback when variant selection changes */
  onVariantChange?: (variantId: string) => void
  /** Callback when feature is toggled */
  onFeatureToggle?: (featureIndex: number, expanded: boolean) => void
  /** Additional CSS class */
  className?: string
  /** Visual configuration for colors, backgrounds, glass effects, and icons */
  visualConfig?: ProductViewerVisualConfig
  /**
   * Renderer for `model` features. Import it from `@tolgainam/product-viewer/model`:
   * `<ProductViewer data={data} modelRenderer={ModelViewer} />`.
   * Without it a model feature shows its `poster`.
   */
  modelRenderer?: ModelRenderer
}
