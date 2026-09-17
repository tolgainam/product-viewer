/**
 * ColorSelector Component
 *
 * PURPOSE:
 * Interactive color picker for selecting product color variants.
 * Displays a horizontal row of color swatches with optional navigation.
 *
 * DESIGN SYSTEM:
 * Based on Figma design: https://www.figma.com/design/ymvwDS0UFLQF26isVZxQ2s/GenUI-DS?node-id=67-4485
 * - Label: Body1 typography (16px), primary color
 * - Swatch size: 32px outer circle
 * - Inner color circle: 24px
 * - Border: 1.5px solid (selection ring)
 * - Gap: 2px between swatches
 * - Navigation buttons: 32px circles with chevron icons
 *
 * BEHAVIOR:
 * - Click swatch to select color
 * - Unavailable colors show with diagonal line but cannot be selected
 * - Navigation buttons appear after 5th color (default maxVisible = 5)
 * - Keyboard navigation supported (arrow keys)
 * - Selected color shows border ring
 *
 * STATES:
 * - Idle: Normal unselected state
 * - Active: Selected with border ring
 * - Focus: Keyboard focused with border ring
 * - Unavailable: Shows actual color with diagonal line, slightly dimmed, not clickable
 * - Disabled: All swatches disabled
 *
 * USAGE EXAMPLES:
 * ```tsx
 * // Basic usage
 * <ColorSelector
 *   colors={[
 *     { id: '1', name: 'Teal', value: '#00d1d2' },
 *     { id: '2', name: 'Navy', value: '#1a3b5c' }
 *   ]}
 *   selectedColorId="1"
 *   onColorChange={(id) => console.log(id)}
 * />
 *
 * // With unavailable colors
 * <ColorSelector
 *   colors={[
 *     { id: '1', name: 'Teal', value: '#00d1d2' },
 *     { id: '2', name: 'Navy', value: '#1a3b5c', available: false }
 *   ]}
 * />
 * ```
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

// React imports
import { forwardRef, useState, useRef } from 'react'
// MUI component imports
import { Box, IconButton } from '@mui/material'
// MUI icon imports
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
// Custom component imports
import { Text } from './Text'
// Design token imports
import { colors as tokenColors, spacing, borderRadius, getSpacingPx } from './tokens'
// Type imports
import type { ColorSelectorProps, ColorSwatchProps } from './ColorSelector.types'

/**
 * ColorSwatch Component
 * Individual color circle that can be selected
 */
function ColorSwatch({
  color,
  selected = false,
  focused = false,
  disabled = false,
  onClick,
  onFocus,
  onBlur,
  onKeyDown,
}: ColorSwatchProps) {
  const isUnavailable = color.available === false
  const isDisabled = disabled || isUnavailable

  return (
    <Box
      component="button"
      onClick={() => !isDisabled && onClick?.()}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      disabled={isDisabled}
      aria-label={`Select ${color.name} color${isUnavailable ? ' (unavailable)' : ''}`}
      aria-pressed={selected}
      sx={{
        position: 'relative',
        width: 32,
        height: 32,
        borderRadius: `${borderRadius[100]}px`,
        border: 'none',
        padding: 0,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        backgroundColor: 'transparent',
        overflow: 'hidden',
        // Selection/focus ring
        ...(selected || focused
          ? {
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: `${borderRadius[100]}px`,
                border: '1.5px solid',
                borderColor: tokenColors.border.focus, // #00476e
                pointerEvents: 'none',
              },
            }
          : {}),
        '&:hover:not(:disabled)': {
          opacity: 0.8,
        },
        '&:focus-visible': {
          outline: 'none',
        },
      }}
    >
      {/* Inner color circle */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 24,
          height: 24,
          borderRadius: `${borderRadius[100]}px`,
          backgroundColor: color.value, // Always show actual color
          border: '1.5px solid',
          borderColor: tokenColors.neutral[30], // #c3c5c6
          opacity: isUnavailable ? 0.6 : 1, // Slightly dim unavailable colors
        }}
      >
        {/* Unavailable diagonal line */}
        {isUnavailable && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-45deg)',
              width: 20,
              height: 1.5,
              backgroundColor: tokenColors.primary.dark, // Dark line for better visibility
            }}
          />
        )}
      </Box>
    </Box>
  )
}

export const ColorSelector = forwardRef<HTMLDivElement, ColorSelectorProps>(
  (
    {
      label = 'Selected Colour',
      hideLabel = false,
      colors,
      selectedColorId,
      onColorChange,
      maxVisible = 5,
      disabled = false,
      className,
    },
    ref
  ) => {
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    const [startIndex, setStartIndex] = useState(0)
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
    const swatchRefs = useRef<(HTMLButtonElement | null)[]>([])

    // Calculate visible colors
    const visibleColors = colors.slice(startIndex, startIndex + maxVisible)
    const hasMore = colors.length > maxVisible
    const canNavigateLeft = startIndex > 0
    const canNavigateRight = startIndex + maxVisible < colors.length

    // Find selected color to display name
    const selectedColor = colors.find((color) => color.id === selectedColorId)
    const displayLabel = selectedColor ? `${label}: ${selectedColor.name}` : label

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================

    /**
     * Handle color selection
     */
    const handleColorClick = (colorId: string) => {
      if (disabled) return
      onColorChange?.(colorId)
    }

    /**
     * Handle previous button click
     */
    const handlePrevious = () => {
      if (canNavigateLeft) {
        setStartIndex((prev) => Math.max(0, prev - 1))
      }
    }

    /**
     * Handle next button click
     */
    const handleNext = () => {
      if (canNavigateRight) {
        setStartIndex((prev) => Math.min(colors.length - maxVisible, prev + 1))
      }
    }

    /**
     * Handle keyboard navigation
     */
    const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
      if (disabled) return

      let newIndex = index

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          newIndex = index > 0 ? index - 1 : index
          break
        case 'ArrowRight':
          event.preventDefault()
          newIndex = index < visibleColors.length - 1 ? index + 1 : index
          break
        case 'Home':
          event.preventDefault()
          newIndex = 0
          break
        case 'End':
          event.preventDefault()
          newIndex = visibleColors.length - 1
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          handleColorClick(visibleColors[index].id)
          return
      }

      if (newIndex !== index && swatchRefs.current[newIndex]) {
        swatchRefs.current[newIndex]?.focus()
      }
    }

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
      <Box ref={ref} className={className} sx={{ width: 'fit-content' }}>
        {/* Label with selected color name */}
        {!hideLabel && (
          <Box sx={{ marginBottom: `${spacing[2]}px` }}>
            <Text variant="body1" text={displayLabel} />
          </Box>
        )}

        {/* Color selector row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: getSpacingPx(1),
          }}
        >
          {/* Previous button */}
          {hasMore && (
            <IconButton
              onClick={handlePrevious}
              disabled={!canNavigateLeft || disabled}
              aria-label="Previous colors"
              sx={{
                width: 32,
                height: 32,
                padding: 0,
                backgroundColor: tokenColors.neutral[5],
                '&:hover': {
                  opacity: 0.8,
                },
                '&.Mui-disabled': {
                  backgroundColor: tokenColors.neutral[5],
                  opacity: 0.5,
                },
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}

          {/* Color swatches */}
          <Box
            sx={{
              display: 'flex',
              gap: getSpacingPx(1),
            }}
            role="group"
            aria-label="Color options"
          >
            {visibleColors.map((color, index) => (
              <ColorSwatch
                key={color.id}
                color={color}
                selected={color.id === selectedColorId}
                focused={focusedIndex === index}
                disabled={disabled}
                onClick={() => handleColorClick(color.id)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
          </Box>

          {/* Next button */}
          {hasMore && (
            <IconButton
              onClick={handleNext}
              disabled={!canNavigateRight || disabled}
              aria-label="Next colors"
              sx={{
                width: 32,
                height: 32,
                padding: 0,
                backgroundColor: tokenColors.neutral[5],
                '&:hover': {
                  opacity: 0.8,
                },
                '&.Mui-disabled': {
                  backgroundColor: tokenColors.neutral[5],
                  opacity: 0.5,
                },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      </Box>
    )
  }
)

ColorSelector.displayName = 'ColorSelector'
