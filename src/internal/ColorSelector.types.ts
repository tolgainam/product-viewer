/**
 * ColorSelector Component Types
 *
 * Type definitions for the ColorSelector component.
 *
 * DESIGN SYSTEM:
 * Based on Figma design: https://www.figma.com/design/ymvwDS0UFLQF26isVZxQ2s/GenUI-DS?node-id=67-4485
 *
 * PURPOSE:
 * Allows users to select a color from a palette of available options.
 * Used for product color variants (device colors, accessory colors).
 *
 * STATES:
 * - Idle: Normal unselected color
 * - Active: Currently selected color (with border ring)
 * - Focus: Keyboard focused color (with border ring)
 * - Unavailable: Color not available (grayed out with diagonal line)
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

export interface ColorOption {
  /**
   * Unique identifier for the color
   */
  id: string

  /**
   * Display name of the color
   */
  name: string

  /**
   * Hex color value (e.g., "#00d1d2")
   */
  value: string

  /**
   * Whether this color is available for selection
   * @default true
   */
  available?: boolean
}

export interface ColorSelectorProps {
  /**
   * Label text displayed above color selector
   * @default "Selected Colour"
   */
  label?: string

  /**
   * Hide the label section entirely
   * @default false
   */
  hideLabel?: boolean

  /**
   * Array of available colors
   */
  colors: ColorOption[]

  /**
   * Currently selected color ID
   */
  selectedColorId?: string

  /**
   * Callback when color selection changes
   * @param colorId - ID of newly selected color
   */
  onColorChange?: (colorId: string) => void

  /**
   * Maximum number of colors to display at once
   * If exceeded, navigation arrows appear
   * @default 5
   */
  maxVisible?: number

  /**
   * Disable all interactions
   * @default false
   */
  disabled?: boolean

  /**
   * Optional className for custom styling
   */
  className?: string
}

export interface ColorSwatchProps {
  /**
   * Color option data
   */
  color: ColorOption

  /**
   * Whether this swatch is selected
   */
  selected?: boolean

  /**
   * Whether this swatch is focused
   */
  focused?: boolean

  /**
   * Whether selector is disabled
   */
  disabled?: boolean

  /**
   * Click handler
   */
  onClick?: () => void

  /**
   * Focus handler
   */
  onFocus?: () => void

  /**
   * Blur handler
   */
  onBlur?: () => void

  /**
   * Keyboard handler
   */
  onKeyDown?: (event: React.KeyboardEvent) => void
}
