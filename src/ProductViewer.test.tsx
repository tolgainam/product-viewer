/**
 * ProductViewer behaviour tests — rendering from JSON, variant selection, feature toggling.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { ProductViewer } from './ProductViewer'
import type { ProductViewerData } from './ProductViewer.types'
import example from '../examples/example-product.json'

const data = example as ProductViewerData

/** MUI reads matchMedia; `matches` true puts the component in the mobile layout. */
function setViewport(isMobile: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: isMobile,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

beforeEach(() => setViewport(false))

describe('ProductViewer', () => {
  it('renders the product from a JSON file', () => {
    const { container } = render(<ProductViewer data={data} />)

    expect(container.querySelector('[data-product-id="example-product"]')).toBeInTheDocument()
    // Every feature offers a pill labelled with its short label
    for (const feature of data.features) {
      expect(screen.getAllByText(feature.label).length).toBeGreaterThan(0)
    }
  })

  it('reports the selected colour variant', () => {
    const onVariantChange = vi.fn()
    render(<ProductViewer data={data} defaultFeatureIndex={-2} onVariantChange={onVariantChange} />)

    const swatches = screen.getAllByRole('button', { name: /colou?r|select/i })
    expect(swatches.length).toBeGreaterThan(0)

    fireEvent.click(swatches[swatches.length - 1])
    expect(onVariantChange).toHaveBeenCalled()
    expect(data.variants.map((v) => v.id)).toContain(onVariantChange.mock.calls[0][0])
  })

  it('expands a feature card and reports the toggle', async () => {
    const onFeatureToggle = vi.fn()
    render(<ProductViewer data={data} onFeatureToggle={onFeatureToggle} />)

    const first = data.features[0]
    fireEvent.click(screen.getAllByText(first.label)[0])

    expect(onFeatureToggle).toHaveBeenCalledWith(0, true)
    // The expanded card shows the feature description; the pill keeps the short label
    expect(await screen.findByText(first.description)).toBeInTheDocument()
  })

  it('opens the feature named by defaultFeatureIndex', () => {
    render(<ProductViewer data={data} defaultFeatureIndex={1} />)
    expect(screen.getByText(data.features[1].description)).toBeInTheDocument()
  })

  it('renders the mobile layout on a narrow viewport', () => {
    setViewport(true)
    const { container } = render(<ProductViewer data={data} />)

    const root = container.querySelector('[data-product-id="example-product"]') as HTMLElement
    expect(root).toBeInTheDocument()
    expect(within(root).getAllByText(data.features[0].label).length).toBeGreaterThan(0)
  })

  it('swaps the background media when switching feature categories', async () => {
    const mediaUrl = (feature: ProductViewerData['features'][number]) =>
      'src' in feature.media ? feature.media.poster.large : feature.media.large
    const { container } = render(<ProductViewer data={data} />)
    const backgroundStyle = () =>
      container.querySelector('div[style*="background-image"]')?.getAttribute('style') ?? ''

    fireEvent.click(screen.getAllByText(data.features[0].label)[0])
    await waitFor(() => expect(backgroundStyle()).toContain(mediaUrl(data.features[0])))

    // Switching to another category must replace the media, not keep the previous one
    fireEvent.click(screen.getAllByText(data.features[2].label)[0])
    await waitFor(() => expect(backgroundStyle()).toContain(mediaUrl(data.features[2])))
  })

  it('renders an empty container when hero is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(
      <ProductViewer data={{ id: 'broken', variants: [], features: [] } as unknown as ProductViewerData} />
    )

    expect(container.querySelector('[data-product-id="broken"]')).toBeEmptyDOMElement()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
