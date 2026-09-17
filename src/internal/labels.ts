/**
 * Default strings. Override through the `labels` prop on ProductViewer.
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import type { ProductViewerLabels } from '../ProductViewer.types'

export const defaultLabels: ProductViewerLabels = {
  color: 'Color',
  displayedIn: '{product} displayed in {variant}',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
  colorOptions: 'Color options',
  selectColor: 'Select {name}',
  unavailable: 'unavailable',
}

export function resolveLabels(overrides?: Partial<ProductViewerLabels>): ProductViewerLabels {
  return overrides ? { ...defaultLabels, ...overrides } : defaultLabels
}
