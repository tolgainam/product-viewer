/**
 * Text Component Types
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

import type { CSSProperties, ElementType, ReactNode } from 'react'

/** Body variants from the package palette */
export type TextVariant = 'body1' | 'body2' | 'body3' | 'caption'

export interface TextProps {
  /** Text content (alternative to children). Supports `**bold**` spans. */
  text?: string

  /** React children (alternative to text prop) */
  children?: ReactNode

  /** Typography variant */
  variant?: TextVariant

  /** Override the rendered HTML element */
  component?: ElementType

  /** Inline style, merged over the variant's typography */
  style?: CSSProperties

  /** Additional class name */
  className?: string

  /** HTML id attribute */
  id?: string
}
