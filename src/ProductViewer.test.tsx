/**
 * ProductViewer behaviour tests — rendering from JSON, variant selection, feature toggling.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { ProductViewer } from './ProductViewer'
import type { ProductViewerData, ProductViewerFeature } from './ProductViewer.types'
import example from '../examples/example-product.json'

const data = example as ProductViewerData

/** The viewer reads matchMedia before it can measure itself; `matches` true means narrow. */
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

/** The stage draws a real <img>; the first one in the document is the visible layer */
const stageImageSrc = (container: HTMLElement) => container.querySelector('picture img')?.getAttribute('src') ?? ''

const mediaUrl = (feature: ProductViewerFeature) => (feature.mediaType === 'image' ? feature.media.small : '')

beforeEach(() => setViewport(false))

describe('ProductViewer', () => {
  it('renders the product from a JSON file', () => {
    const { container } = render(<ProductViewer data={data} />)

    expect(container.querySelector('[data-product-id="example-product"]')).toBeInTheDocument()
    // Every feature offers a pill labelled with its short label
    for (const feature of data.features) {
      expect(screen.getAllByText(feature.label).length).toBeGreaterThan(0)
    }
    // The stage is an image with alt text, not a background
    expect(screen.getByAltText(data.variants[0].image.alt)).toBeInTheDocument()
  })

  it('reports the selected colour variant', () => {
    const onVariantChange = vi.fn()
    render(<ProductViewer data={data} defaultFeatureIndex={-2} onVariantChange={onVariantChange} />)

    const swatches = screen.getAllByRole('radio')
    expect(swatches).toHaveLength(data.variants.length)

    fireEvent.click(swatches[swatches.length - 1])
    expect(onVariantChange).toHaveBeenCalledWith(data.variants[data.variants.length - 1].id)
  })

  it('expands a feature card and reports the toggle', async () => {
    const onFeatureToggle = vi.fn()
    render(<ProductViewer data={data} onFeatureToggle={onFeatureToggle} />)

    const first = data.features[0]
    const pill = screen.getByRole('button', { name: first.label })
    expect(pill).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(pill)

    expect(onFeatureToggle).toHaveBeenCalledWith(0, true)
    expect(pill).toHaveAttribute('aria-expanded', 'true')
    // The expanded card shows the feature description; the pill keeps the short label
    expect(await screen.findByText(first.description)).toBeInTheDocument()

    // Clicking the open header closes it again
    fireEvent.click(pill)
    expect(onFeatureToggle).toHaveBeenLastCalledWith(0, false)
    expect(pill).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the feature named by defaultFeatureIndex', () => {
    render(<ProductViewer data={data} defaultFeatureIndex={1} />)
    expect(screen.getByText(data.features[1].description)).toBeInTheDocument()
  })

  it('ignores an out-of-range defaultFeatureIndex and an unknown defaultVariantId', () => {
    render(<ProductViewer data={data} defaultFeatureIndex={42} defaultVariantId="nope" />)
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    expect(screen.getByAltText(data.variants[0].image.alt)).toBeInTheDocument()
  })

  it('closes with Escape and moves between cards with the arrow keys', async () => {
    const onFeatureToggle = vi.fn()
    const { container } = render(<ProductViewer data={data} defaultFeatureIndex={0} onFeatureToggle={onFeatureToggle} />)
    const root = container.querySelector('[data-product-id]') as HTMLElement

    fireEvent.keyDown(root, { key: 'ArrowDown' })
    expect(onFeatureToggle).toHaveBeenLastCalledWith(1, true)
    expect(screen.getByText(data.features[1].description)).toBeInTheDocument()

    fireEvent.keyDown(root, { key: 'Escape' })
    expect(onFeatureToggle).toHaveBeenLastCalledWith(1, false)
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument())
  })

  it('renders the mobile layout on a narrow viewport', () => {
    setViewport(true)
    const { container } = render(<ProductViewer data={data} />)

    const root = container.querySelector('[data-product-id="example-product"]') as HTMLElement
    expect(root).toHaveAttribute('data-layout', 'mobile')
    expect(within(root).getAllByText(data.features[0].label).length).toBeGreaterThan(0)
  })

  it('lets the host force a layout', () => {
    setViewport(true)
    const { container } = render(<ProductViewer data={data} layout="desktop" />)
    expect(container.querySelector('[data-product-id]')).toHaveAttribute('data-layout', 'desktop')
  })

  it('swaps the stage media when switching feature categories', async () => {
    const { container } = render(<ProductViewer data={data} />)
    const root = container.querySelector('[data-product-id]') as HTMLElement

    const imageFeature = data.features.find((f) => f.mediaType === 'image')!
    const videoFeature = data.features.find((f) => f.mediaType === 'video')!

    fireEvent.click(screen.getByRole('button', { name: imageFeature.label }))
    await waitFor(() => expect(stageImageSrc(root)).toBe(mediaUrl(imageFeature)))
    // The overlay is drawn on top of the background
    if (imageFeature.overlay) {
      expect(screen.getByAltText(imageFeature.overlay.alt)).toBeInTheDocument()
    }

    // Switching to a video must drop the picture (no poster is ever drawn) and mount the video
    fireEvent.click(screen.getByRole('button', { name: videoFeature.label }))
    await waitFor(() => expect(root.querySelector('picture')).toBeNull())
    expect(root.querySelector('video')).toBeInTheDocument()
  })

  it('plays a video feature with its own source and poster', () => {
    const videoIndex = data.features.findIndex((f) => f.mediaType === 'video')
    const feature = data.features[videoIndex]
    const { container } = render(<ProductViewer data={data} defaultFeatureIndex={videoIndex} />)

    const video = container.querySelector('video') as HTMLVideoElement
    expect(video).toBeInTheDocument()
    expect(video.querySelector('source')).toHaveAttribute('src', feature.mediaType === 'video' ? feature.media.src : '')
    expect(video.querySelector('source')).toHaveAttribute('type', 'video/mp4')
    expect(video).not.toHaveAttribute('poster')
  })

  it('applies custom labels', () => {
    render(<ProductViewer data={data} defaultFeatureIndex={0} labels={{ color: 'Farbe', close: 'Schließen' }} />)
    expect(screen.getByRole('button', { name: 'Farbe' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Schließen' })).toBeInTheDocument()
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
