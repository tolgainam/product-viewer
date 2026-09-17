/**
 * Text Component Types
 *
 * Type definitions for the Text component.
 * Uses direct design tokens from src/theme/tokens.ts.
 *
 * Typography variants from Figma GenUI-DS (node-id=16-527):
 * - Headings (h1-h6): Bold weight (700), responsive
 * - Display (poster, fs1-fs6): Regular weight (400), responsive
 * - Body (body1, body2, body3, caption): Fixed sizes
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import type { SxProps, Theme } from '@mui/material'
import type { ElementType, ReactNode } from 'react'

/**
 * Typography variants matching Figma design system
 */
export type TextVariant =
  // Headings - Bold (700), responsive mobile → desktop
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  // Display - Regular (400), responsive mobile → desktop
  | 'poster'
  | 'fs1'
  | 'fs2'
  | 'fs3'
  | 'fs4'
  | 'fs5'
  | 'fs6'
  // Body - Regular (400), fixed sizes
  | 'body1'
  | 'body2'
  | 'body3'
  | 'caption'

/**
 * Text color options (BREAKING CHANGE from MUI Typography)
 *
 * Only semantic background-aware colors are supported:
 * - 'dark': colors.text.dark (#393e44) - for light backgrounds
 * - 'light': colors.text.light (#fffdfb) - for dark backgrounds
 *
 * MIGRATION: MUI color values are no longer supported:
 * - "primary", "secondary", "error" → Use sx={{ color: colors.X.dark }}
 * - "textSecondary", "text.secondary" → Use color="dark"
 *
 * For custom colors, use the sx prop with token imports:
 * import { colors } from './tokens'
 * <Text sx={{ color: colors.primary.dark }}>...</Text>
 */
export type TextColor = 'dark' | 'light'

/**
 * Text alignment options
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify'

export interface TextProps {
  /** Text content (alternative to children) */
  text?: string

  /** React children (alternative to text prop) */
  children?: ReactNode

  /** Typography variant from design system */
  variant?: TextVariant

  /**
   * Text color theme
   * - 'dark' (default): Dark text for light backgrounds
   * - 'light': Light text for dark backgrounds
   */
  color?: TextColor

  /**
   * Background color for automatic color detection
   * When provided with autoDetectColor, analyzes the color to determine appropriate text color
   */
  backgroundColor?: string

  /**
   * Enable automatic color detection based on backgroundColor
   * When true, analyzes backgroundColor to choose light/dark text color
   * @default false
   */
  autoDetectColor?: boolean

  /** Text alignment */
  align?: TextAlign

  /** Override the rendered HTML element */
  component?: ElementType

  /** @deprecated No longer supported. Use sx={{ mb: ... }} instead. Silently ignored to prevent DOM warnings. */
  gutterBottom?: boolean

  /** MUI sx prop for additional styling */
  sx?: SxProps<Theme>

  /** Additional class name */
  className?: string

  /** HTML id attribute */
  id?: string
}
