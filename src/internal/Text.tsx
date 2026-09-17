/**
 * Text Component
 *
 * Renders one body variant from the package palette as a plain element with inline
 * styles. Supports `**bold**` spans in `text`.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import { createElement, memo, type CSSProperties, type ReactNode } from 'react'
import { typography } from './tokens'
import type { TextProps, TextVariant } from './Text.types'

/**
 * Parses **bold** markdown syntax into React nodes.
 * Splits on **...** pairs and wraps matched segments in <strong>.
 * Returns the original string unchanged if no ** markers are found.
 */
export function parseInlineBold(text: string): ReactNode {
  if (!text.includes('**')) return text
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} style={{ fontWeight: 700 }}>
        {part}
      </strong>
    ) : (
      part
    )
  )
}

const STYLES: Record<TextVariant, CSSProperties> = Object.fromEntries(
  (Object.keys(typography.body) as TextVariant[]).map((key) => [
    key,
    {
      margin: 0,
      fontFamily: typography.fontFamily,
      fontSize: typography.body[key].fontSize,
      fontWeight: typography.body[key].fontWeight,
      lineHeight: typography.body[key].lineHeight,
    },
  ])
) as Record<TextVariant, CSSProperties>

export const Text = memo(function Text({ text, children, variant = 'body1', component, style, ...props }: TextProps) {
  return createElement(
    component || (variant === 'caption' ? 'span' : 'p'),
    { style: { ...STYLES[variant], ...style }, ...props },
    children ?? (text ? parseInlineBold(text) : undefined)
  )
})

Text.displayName = 'Text'
