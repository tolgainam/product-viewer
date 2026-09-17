/**
 * ColorSelector Component Types
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import type { KeyboardEvent, Ref } from 'react'

export interface ColorOption {
  /** Unique identifier for the color */
  id: string

  /** Display name of the color */
  name: string

  /** Hex color value (e.g., "#00d1d2") */
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

  /** Array of available colors */
  colors: ColorOption[]

  /** Currently selected color ID */
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

  /** Optional className for custom styling */
  className?: string

  /** Accessible name of the swatch group */
  groupLabel?: string
  /** Accessible name of one swatch; `{name}` is replaced with the colour name */
  swatchLabel?: string
  /** Suffix for colours that cannot be selected */
  unavailableLabel?: string
  /** Accessible name of the previous-page button */
  previousLabel?: string
  /** Accessible name of the next-page button */
  nextLabel?: string
}

export interface ColorSwatchProps {
  /** Color option data */
  color: ColorOption

  /** Whether this swatch is selected */
  selected?: boolean

  /** Whether selector is disabled */
  disabled?: boolean

  /** Roving tabindex value */
  tabIndex?: number

  /** Accessible name */
  ariaLabel?: string

  /** Click handler */
  onClick?: () => void

  /** Keyboard handler */
  onKeyDown?: (event: KeyboardEvent) => void

  /** Ref to the underlying button, for focus management */
  swatchRef?: Ref<HTMLButtonElement>
}
