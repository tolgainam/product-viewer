/**
 * color-analysis
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import { colors } from './tokens'

/**
 * Parse any color format (hex, rgb, rgba, design tokens) to RGB values
 * @param color - Color string in various formats
 * @returns RGB object or null if invalid
 */
export function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (!color || typeof color !== 'string') {
    return null
  }

  const trimmed = color.trim()

  // Handle design tokens (e.g., 'colors.text.dark')
  if (trimmed.startsWith('colors.')) {
    const tokenPath = trimmed.split('.')
    let value: unknown = colors

    for (const key of tokenPath.slice(1)) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key]
      } else {
        console.warn(`[color-analysis] Invalid design token: ${color}`)
        return null
      }
    }

    if (typeof value === 'string') {
      return parseColor(value) // Recursively parse the token value
    }
    console.warn(`[color-analysis] Design token did not resolve to string: ${color}`)
    return null
  }

  // Handle hex colors (#fff, #ffffff)
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1)
    let r: number, g: number, b: number

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    } else {
      console.warn(`[color-analysis] Invalid hex color: ${color}`)
      return null
    }

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      console.warn(`[color-analysis] Invalid hex color values: ${color}`)
      return null
    }

    return { r, g, b }
  }

  // Handle rgb/rgba colors
  const rgbMatch = trimmed.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/)
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10)
    const g = parseInt(rgbMatch[2], 10)
    const b = parseInt(rgbMatch[3], 10)

    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return { r, g, b }
    }
    console.warn(`[color-analysis] Invalid RGB values: ${color}`)
    return null
  }

  // Handle transparent
  if (trimmed === 'transparent') {
    return null
  }

  // Handle gradients - extract first solid color
  if (trimmed.includes('gradient')) {
    const colorMatch = trimmed.match(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/)
    if (colorMatch) {
      return parseColor(colorMatch[0])
    }
    console.warn(`[color-analysis] Could not extract color from gradient: ${color}`)
    return null
  }

  console.warn(`[color-analysis] Unsupported color format: ${color}`)
  return null
}

/**
 * Calculate WCAG 2.0 relative luminance for a color channel
 * @param channel - RGB channel value (0-255)
 * @returns Linearized channel value (0-1)
 */
function linearizeChannel(channel: number): number {
  const normalized = channel / 255
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4)
}

/**
 * Calculate WCAG 2.0 relative luminance (0-1, where 1=white, 0=black)
 * @param r - Red channel (0-255)
 * @param g - Green channel (0-255)
 * @param b - Blue channel (0-255)
 * @returns Relative luminance value
 */
export function getLuminance(r: number, g: number, b: number): number {
  const rLin = linearizeChannel(r)
  const gLin = linearizeChannel(g)
  const bLin = linearizeChannel(b)

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

/**
 * Determine if a color is light based on its luminance
 * @param color - Color string in any supported format
 * @param threshold - Luminance threshold (default: 0.5)
 * @returns True if light, false if dark, null if invalid
 */
export function isLightColor(color: string, threshold: number = 0.5): boolean | null {
  const rgb = parseColor(color)
  if (!rgb) {
    return null
  }

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
  return luminance >= threshold
}

/**
 * Get appropriate theme for components on this background
 * Light backgrounds need 'light' theme (dark text/buttons)
 * Dark backgrounds need 'dark' theme (light text/buttons)
 * @param backgroundColor - Background color string
 * @returns 'light' or 'dark' theme, or null if invalid
 */
export function getThemeForBackground(backgroundColor: string): 'light' | 'dark' | null {
  const isLight = isLightColor(backgroundColor)
  if (isLight === null) {
    return null
  }

  return isLight ? 'light' : 'dark'
}

/**
 * Calculate contrast ratio between two colors (WCAG 2.0)
 * @param color1 - First color string
 * @param color2 - Second color string
 * @returns Contrast ratio (1-21), or null if invalid
 */
export function getContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = parseColor(color1)
  const rgb2 = parseColor(color2)

  if (!rgb1 || !rgb2) {
    return null
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Validate minimum contrast requirements (WCAG 2.0)
 * @param foreground - Foreground color string
 * @param background - Background color string
 * @param level - WCAG level ('AA' or 'AAA')
 * @returns True if meets requirement, false otherwise
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean | null {
  const ratio = getContrastRatio(foreground, background)
  if (ratio === null) {
    return null
  }

  // WCAG 2.0 requirements for normal text
  const minRatio = level === 'AAA' ? 7 : 4.5

  return ratio >= minRatio
}
