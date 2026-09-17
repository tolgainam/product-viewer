/**
 * Text Component
 *
 * Atomic component for text rendering with direct design token usage.
 * All styles come from src/theme/tokens.ts, not MUI theme.
 *
 * Specs from Figma: GenUI-DS (node-id=16-527)
 *
 * Variants:
 * - Headings (h1-h6): Bold weight (700), responsive mobile → desktop
 * - Display (poster, fs1-fs6): Regular weight (400), responsive
 * - Body (body1, body2, body3, caption): Fixed sizes
 *
 * @example
 * <Text variant="h1">Main Heading</Text>
 * <Text variant="body1" color="light">Paragraph on dark bg</Text>
 *
 * ============================================================================
 * BREAKING CHANGES (2026-02-07 Token Audit Refactor)
 * ============================================================================
 *
 * This component was refactored to use direct design tokens instead of MUI
 * Typography. The following changes affect molecules and organisms:
 *
 * REMOVED PROPS (no longer supported):
 * ────────────────────────────────────
 * - gutterBottom    → Use sx={{ mb: getSpacingPx(3) }} (16px) or parent spacing
 * - paragraph       → Not needed, use variant="body1" or "body2"
 * - noWrap          → Use sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
 * - display         → Use sx={{ display: '...' }}
 *
 * CHANGED: color prop
 * ────────────────────────────────────
 * OLD (MUI palette strings):     NEW (semantic options only):
 * - color="primary"          →   Use sx={{ color: colors.primary.dark }}
 * - color="secondary"        →   Use sx={{ color: colors.secondary.dark }}
 * - color="textSecondary"    →   color="dark" (or sx for exact color)
 * - color="text.secondary"   →   color="dark" (or sx for exact color)
 * - color="error"            →   Use sx={{ color: colors.status.error }}
 *
 * VALID color VALUES:
 * - "dark"  → colors.text.dark (#393e44) - for light backgrounds
 * - "light" → colors.text.light (#fffdfb) - for dark backgrounds
 *
 * MIGRATION EXAMPLES:
 * ────────────────────────────────────
 * // Before:
 * <Text variant="h5" gutterBottom>Title</Text>
 * <Text color="textSecondary">Subtitle</Text>
 * <Text color="primary">Accent text</Text>
 *
 * // After:
 * import { colors, getSpacingPx } from './tokens'
 * <Text variant="h5" sx={{ mb: getSpacingPx(2) }}>Title</Text>  // 8px
 * <Text color="dark">Subtitle</Text>
 * <Text sx={{ color: colors.primary.dark }}>Accent text</Text>
 *
 * For custom colors, always import from tokens:
 * <Text sx={{ color: colors.primary.accent }}>Custom color</Text>
 * ============================================================================
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import { Box } from '@mui/material'
import { memo, useMemo, type Ref } from 'react'
import type { ReactNode } from 'react'
import {
  colors,
  typography,
  muiBreakpoints,
} from './tokens'
import { getThemeForBackground } from './color-analysis'
import type { TextProps, TextVariant } from './Text.types'

/**
 * Parses **bold** markdown syntax into React nodes.
 * Splits on **...** pairs and wraps matched segments in <strong>.
 * Returns the original string unchanged if no ** markers are found.
 */
function parseInlineBold(text: string): ReactNode {
  if (!text.includes('**')) return text
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ fontWeight: 700 }}>{part}</strong>
      : part
  )
}

/**
 * Get typography styles for a variant
 * Returns mobile styles with desktop override at xl breakpoint
 */
const getTypographyStyles = (variant: TextVariant) => {
  const xlBreakpoint = `@media (min-width: ${muiBreakpoints.xl}px)`

  switch (variant) {
    // Poster - Display (Regular weight)
    case 'poster':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.poster.fontWeight,
        fontSize: typography.mobile.poster.fontSize,
        lineHeight: typography.mobile.poster.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.poster.fontSize,
          lineHeight: typography.desktop.poster.lineHeight,
        },
      }

    // Headings - Bold weight (700)
    case 'h1':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.h1.fontWeight,
        fontSize: typography.mobile.h1.fontSize,
        lineHeight: typography.mobile.h1.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.h1.fontSize,
          lineHeight: typography.desktop.h1.lineHeight,
        },
      }
    case 'h2':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.h2.fontWeight,
        fontSize: typography.mobile.h2.fontSize,
        lineHeight: typography.mobile.h2.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.h2.fontSize,
          lineHeight: typography.desktop.h2.lineHeight,
        },
      }
    case 'h3':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.h3.fontWeight,
        fontSize: typography.mobile.h3.fontSize,
        lineHeight: typography.mobile.h3.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.h3.fontSize,
          lineHeight: typography.desktop.h3.lineHeight,
        },
      }
    case 'h4':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.h4.fontWeight,
        fontSize: typography.mobile.h4.fontSize,
        lineHeight: typography.mobile.h4.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.h4.fontSize,
          lineHeight: typography.desktop.h4.lineHeight,
        },
      }
    case 'h5':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.h5.fontWeight,
        fontSize: typography.mobile.h5.fontSize,
        lineHeight: typography.mobile.h5.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.h5.fontSize,
          lineHeight: typography.desktop.h5.lineHeight,
        },
      }
    case 'h6':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.h6.fontWeight,
        fontSize: typography.mobile.h6.fontSize,
        lineHeight: typography.mobile.h6.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.h6.fontSize,
          lineHeight: typography.desktop.h6.lineHeight,
        },
      }

    // Display - Regular weight (400)
    case 'fs1':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.fs1.fontWeight,
        fontSize: typography.mobile.fs1.fontSize,
        lineHeight: typography.mobile.fs1.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.fs1.fontSize,
          lineHeight: typography.desktop.fs1.lineHeight,
        },
      }
    case 'fs2':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.fs2.fontWeight,
        fontSize: typography.mobile.fs2.fontSize,
        lineHeight: typography.mobile.fs2.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.fs2.fontSize,
          lineHeight: typography.desktop.fs2.lineHeight,
        },
      }
    case 'fs3':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.fs3.fontWeight,
        fontSize: typography.mobile.fs3.fontSize,
        lineHeight: typography.mobile.fs3.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.fs3.fontSize,
          lineHeight: typography.desktop.fs3.lineHeight,
        },
      }
    case 'fs4':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.fs4.fontWeight,
        fontSize: typography.mobile.fs4.fontSize,
        lineHeight: typography.mobile.fs4.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.fs4.fontSize,
          lineHeight: typography.desktop.fs4.lineHeight,
        },
      }
    case 'fs5':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.fs5.fontWeight,
        fontSize: typography.mobile.fs5.fontSize,
        lineHeight: typography.mobile.fs5.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.fs5.fontSize,
          lineHeight: typography.desktop.fs5.lineHeight,
        },
      }
    case 'fs6':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.desktop.fs6.fontWeight,
        fontSize: typography.mobile.fs6.fontSize,
        lineHeight: typography.mobile.fs6.lineHeight,
        [xlBreakpoint]: {
          fontSize: typography.desktop.fs6.fontSize,
          lineHeight: typography.desktop.fs6.lineHeight,
        },
      }

    // Body text - Fixed sizes (no responsive change)
    case 'body1':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.body.body1.fontWeight,
        fontSize: typography.body.body1.fontSize,
        lineHeight: typography.body.body1.lineHeight,
      }
    case 'body2':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.body.body2.fontWeight,
        fontSize: typography.body.body2.fontSize,
        lineHeight: typography.body.body2.lineHeight,
      }
    case 'body3':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.body.body3.fontWeight,
        fontSize: typography.body.body3.fontSize,
        lineHeight: typography.body.body3.lineHeight,
      }
    case 'caption':
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.body.caption.fontWeight,
        fontSize: typography.body.caption.fontSize,
        lineHeight: typography.body.caption.lineHeight,
      }

    // Default to body1
    default:
      return {
        fontFamily: typography.fontFamily,
        fontWeight: typography.body.body1.fontWeight,
        fontSize: typography.body.body1.fontSize,
        lineHeight: typography.body.body1.lineHeight,
      }
  }
}

/**
 * Get the semantic HTML element for a variant
 */
const getComponent = (variant: TextVariant): React.ElementType => {
  switch (variant) {
    case 'h1':
      return 'h1'
    case 'h2':
      return 'h2'
    case 'h3':
      return 'h3'
    case 'h4':
      return 'h4'
    case 'h5':
      return 'h5'
    case 'h6':
      return 'h6'
    case 'poster':
    case 'fs1':
    case 'fs2':
    case 'fs3':
    case 'fs4':
    case 'fs5':
    case 'fs6':
      return 'p' // Display text renders as paragraph
    case 'body1':
    case 'body2':
    case 'body3':
      return 'p'
    case 'caption':
      return 'span'
    default:
      return 'p'
  }
}

export const Text = memo(function Text(
  {
    text,
    children,
    variant = 'body1',
    color,
    backgroundColor,
    autoDetectColor = false,
    align,
    component,
    sx,
    gutterBottom,
    ref,
    ...props
  }: TextProps & { ref?: Ref<HTMLElement> }
) {
    // Resolve effective color with auto-detection support
    const effectiveColor = useMemo(() => {
      // Priority 1: Explicit color takes precedence
      if (color) return color

      // Priority 2: Auto-detect from backgroundColor
      if (autoDetectColor && backgroundColor) {
        const theme = getThemeForBackground(backgroundColor)
        if (theme) {
          // Invert: light bg needs dark text, dark bg needs light text
          return theme === 'light' ? 'dark' : 'light'
        }
      }

      // Fallback: undefined to inherit from parent
      return undefined
    }, [color, autoDetectColor, backgroundColor])

    // Get color from tokens only if explicitly provided
    // Otherwise, inherit from parent (for background-aware text)
    const textColor = effectiveColor === 'light'
      ? colors.text.light
      : effectiveColor === 'dark'
      ? colors.text.dark
      : undefined // undefined = inherit from parent

    // Get typography styles for variant
    const typographyStyles = getTypographyStyles(variant)

    // Determine HTML element
    const Element = component || getComponent(variant)

    return (
      <Box
        ref={ref}
        component={Element}
        sx={[
          {
            // Reset margins (let parent control spacing)
            margin: 0,

            // Color from tokens (or inherit if not specified)
            ...(textColor && { color: textColor }),

            // Text alignment
            ...(align && { textAlign: align }),

            // Typography styles from tokens
            ...typographyStyles,
          },
          // Allow custom sx to override
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...props}
      >
        {children ?? (text ? parseInlineBold(text) : undefined)}
      </Box>
    )
})

Text.displayName = 'Text'
