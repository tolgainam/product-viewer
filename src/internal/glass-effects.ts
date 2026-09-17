/**
 * Glass Effect Utilities
 *
 * Utilities for creating glassmorphism effects (frosted glass, liquid glass, etc.)
 * inspired by Apple's design language in iOS and macOS.
 *
 * @module glass-effects
 *
 * @example
 * ```typescript
 * import { getGlassEffect, getGlassEffectSx } from './glass-effects'
 *
 * // Frosted glass (iOS style)
 * const frosted = getGlassEffect({ type: 'frosted', intensity: 'medium' })
 *
 * // Liquid glass (macOS Big Sur style)
 * const liquid = getGlassEffectSx({ type: 'liquid', intensity: 'strong' })
 * ```
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

export type GlassEffectType = 'frosted' | 'liquid' | 'minimal' | 'none'
export type GlassIntensity = 'light' | 'medium' | 'strong'

export interface GlassEffectOptions {
  /** The type of glass effect to apply */
  type: GlassEffectType
  /** The intensity of the effect (default: 'medium') */
  intensity?: GlassIntensity
  /** Custom background color (overrides preset) */
  backgroundColor?: string
  /** Border opacity for subtle borders (0-1, default varies by type) */
  borderOpacity?: number
}

export interface GlassEffectResult {
  backdropFilter: string
  /** Safari before 18 only honours the prefixed property */
  WebkitBackdropFilter: string
  backgroundColor: string
  border?: string
  boxShadow?: string
}

type Preset = Omit<GlassEffectResult, 'WebkitBackdropFilter'>

/**
 * Glass effect presets configuration
 */
const GLASS_PRESETS: Record<GlassEffectType, Record<GlassIntensity, Preset>> = {
  frosted: {
    light: {
      backdropFilter: 'blur(10px) saturate(150%)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
    },
    medium: {
      backdropFilter: 'blur(20px) saturate(180%)',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    strong: {
      backdropFilter: 'blur(30px) saturate(200%)',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
    },
  },
  liquid: {
    light: {
      backdropFilter: 'blur(30px) saturate(180%)',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)',
    },
    medium: {
      backdropFilter: 'blur(40px) saturate(200%)',
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: 'inset 0 1px 2px 0 rgba(255, 255, 255, 0.4)',
    },
    strong: {
      backdropFilter: 'blur(60px) saturate(220%)',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.35)',
      boxShadow: 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.5)',
    },
  },
  minimal: {
    light: {
      backdropFilter: 'blur(5px)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    medium: {
      backdropFilter: 'blur(10px)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
    },
    strong: {
      backdropFilter: 'blur(15px)',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
  },
  none: {
    light: { backdropFilter: 'none', backgroundColor: 'transparent' },
    medium: { backdropFilter: 'none', backgroundColor: 'transparent' },
    strong: { backdropFilter: 'none', backgroundColor: 'transparent' },
  },
}

/**
 * Generate glassmorphism CSS properties
 *
 * Creates backdrop-filter, background-color, border, and box-shadow properties
 * for creating frosted glass, liquid glass, or minimal glass effects.
 */
export const getGlassEffect = (options: GlassEffectOptions): GlassEffectResult => {
  const { type, intensity = 'medium', backgroundColor, borderOpacity } = options

  const preset = GLASS_PRESETS[type][intensity]

  const result: GlassEffectResult = {
    backdropFilter: preset.backdropFilter,
    WebkitBackdropFilter: preset.backdropFilter,
    backgroundColor: backgroundColor ?? preset.backgroundColor,
  }

  if (preset.border) {
    result.border =
      borderOpacity !== undefined ? `1px solid rgba(255, 255, 255, ${borderOpacity})` : preset.border
  }

  if (preset.boxShadow) {
    result.boxShadow = preset.boxShadow
  }

  return result
}

/**
 * Get MUI sx object with glass effect properties. Same shape as {@link getGlassEffect};
 * kept as a separate name so call sites read as styling.
 */
export const getGlassEffectSx = (options: GlassEffectOptions) => getGlassEffect(options)
