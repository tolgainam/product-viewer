/**
 * ColorSelector Component
 *
 * Interactive colour picker for product variants: a row of swatches with the
 * semantics of a radio group (one choice, arrow keys move between options).
 *
 * BEHAVIOR:
 * - Click a swatch to select it
 * - Unavailable colours show a diagonal line and cannot be selected
 * - Navigation buttons appear when there are more colours than `maxVisible`
 * - Arrow keys, Home and End move between swatches
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import { forwardRef, useState, useRef, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Text } from './Text'
import { colors as tokenColors, spacing } from './tokens'
import { formatLabel } from './media'
import { cx, useViewerStyles } from './styles'
import type { ColorSelectorProps, ColorSwatchProps } from './ColorSelector.types'

/**
 * ColorSwatch Component
 * Individual color circle that can be selected
 */
function ColorSwatch({
  color,
  selected = false,
  disabled = false,
  tabIndex,
  ariaLabel,
  onClick,
  onKeyDown,
  swatchRef,
}: ColorSwatchProps) {
  const isUnavailable = color.available === false
  const isDisabled = disabled || isUnavailable

  return (
    <button
      type="button"
      role="radio"
      ref={swatchRef}
      className={cx('pv-reset', 'pv-btn', 'pv-swatch')}
      onClick={() => !isDisabled && onClick?.()}
      onKeyDown={onKeyDown}
      disabled={isDisabled}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      aria-checked={selected}
    >
      {/* Inner color circle */}
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 24,
          height: 24,
          borderRadius: 100,
          backgroundColor: color.value, // Always show actual color
          border: `1.5px solid ${tokenColors.neutral[30]}`,
          opacity: isUnavailable ? 0.6 : 1, // Slightly dim unavailable colors
          boxSizing: 'border-box',
        }}
      >
        {/* Unavailable diagonal line */}
        {isUnavailable && (
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-45deg)',
              width: 20,
              height: 1.5,
              backgroundColor: tokenColors.primary.dark,
            }}
          />
        )}
      </span>
    </button>
  )
}

const navButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 100,
  backgroundColor: 'rgba(127, 127, 127, 0.2)',
} as const

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
      groupLabel = 'Color options',
      swatchLabel = 'Select {name}',
      unavailableLabel = 'unavailable',
      previousLabel = 'Previous colors',
      nextLabel = 'Next colors',
    },
    ref
  ) => {
    useViewerStyles()
    const [startIndex, setStartIndex] = useState(0)
    const swatchRefs = useRef<(HTMLButtonElement | null)[]>([])

    // Calculate visible colors
    const visibleColors = colors.slice(startIndex, startIndex + maxVisible)
    const hasMore = colors.length > maxVisible
    const canNavigateLeft = startIndex > 0
    const canNavigateRight = startIndex + maxVisible < colors.length

    // Find selected color to display name
    const selectedColor = colors.find((color) => color.id === selectedColorId)
    const displayLabel = selectedColor ? `${label}: ${selectedColor.name}` : label

    // Roving tabindex: only one swatch is in the tab order, arrows move between the rest
    const selectedVisibleIndex = visibleColors.findIndex((c) => c.id === selectedColorId)
    const tabbableIndex = selectedVisibleIndex >= 0 ? selectedVisibleIndex : 0

    const handleColorClick = (colorId: string) => {
      if (disabled) return
      onColorChange?.(colorId)
    }

    const handlePrevious = () => {
      if (canNavigateLeft) setStartIndex((prev) => Math.max(0, prev - 1))
    }

    const handleNext = () => {
      if (canNavigateRight) setStartIndex((prev) => Math.min(colors.length - maxVisible, prev + 1))
    }

    const handleKeyDown = (event: KeyboardEvent, index: number) => {
      if (disabled) return

      let newIndex = index
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault()
          newIndex = index > 0 ? index - 1 : visibleColors.length - 1
          break
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault()
          newIndex = index < visibleColors.length - 1 ? index + 1 : 0
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
        default:
          return
      }

      if (newIndex !== index) {
        swatchRefs.current[newIndex]?.focus()
        // Radio groups select on arrow movement
        const next = visibleColors[newIndex]
        if (next && next.available !== false) handleColorClick(next.id)
      }
    }

    return (
      <div ref={ref} className={className} style={{ width: 'fit-content' }}>
        {/* Label with selected color name */}
        {!hideLabel && (
          <div style={{ marginBottom: spacing[2] }}>
            <Text variant="body1" text={displayLabel} />
          </div>
        )}

        {/* Color selector row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
          {hasMore && (
            <button
              type="button"
              className={cx('pv-reset', 'pv-btn')}
              onClick={handlePrevious}
              disabled={!canNavigateLeft || disabled}
              aria-label={previousLabel}
              style={{ ...navButtonStyle, opacity: !canNavigateLeft || disabled ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} aria-hidden />
            </button>
          )}

          <div style={{ display: 'flex', gap: spacing[1] }} role="radiogroup" aria-label={groupLabel}>
            {visibleColors.map((color, index) => {
              const unavailable = color.available === false
              const name = formatLabel(swatchLabel, { name: color.name })
              return (
                <ColorSwatch
                  key={color.id}
                  color={color}
                  selected={color.id === selectedColorId}
                  disabled={disabled}
                  tabIndex={index === tabbableIndex ? 0 : -1}
                  ariaLabel={unavailable ? `${name} (${unavailableLabel})` : name}
                  swatchRef={(el) => {
                    swatchRefs.current[index] = el
                  }}
                  onClick={() => handleColorClick(color.id)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              )
            })}
          </div>

          {hasMore && (
            <button
              type="button"
              className={cx('pv-reset', 'pv-btn')}
              onClick={handleNext}
              disabled={!canNavigateRight || disabled}
              aria-label={nextLabel}
              style={{ ...navButtonStyle, opacity: !canNavigateRight || disabled ? 0.4 : 1 }}
            >
              <ChevronRight size={16} aria-hidden />
            </button>
          )}
        </div>
      </div>
    )
  }
)

ColorSelector.displayName = 'ColorSelector'
