/**
 * Documentation site for @tolgainam/product-viewer.
 *
 * Every example renders the real component from ../../src, so the docs cannot show
 * behaviour the package does not have.
 */
import { useState } from 'react'
import { ProductViewer, defaultLabels } from '../../src'
import { ModelViewer } from '../../src/model'
import type { ProductViewerVisualConfig } from '../../src'
import { data } from '../data'
import { Code } from './Code'
import { ConfigEditor, PRESETS } from './ConfigEditor'
const pkg = '@tolgainam/product-viewer'

const SECTIONS = [
  ['playground', 'Playground'],
  ['install', 'Install'],
  ['content', 'Content file'],
  ['backgrounds', 'Backgrounds'],
  ['presets', 'Presets'],
  ['colours', 'Colours'],
  ['labels', 'Labels'],
  ['layout', 'Layout'],
  ['props', 'Props'],
  ['interaction', 'Interaction'],
] as const

const exampleJson = JSON.stringify(
  {
    id: 'example-product',
    hero: { name: 'Loft Chair', alt: 'Loft Chair', image: { small: '/media/chairs/yellow-640.webp', medium: '/media/chairs/yellow-1200.webp', large: '/media/chairs/yellow-1920.webp', alt: 'Loft Chair in Mustard' } },
    variants: [
      { id: 'mustard', label: 'Mustard', colorHex: '#d0a12d', backgroundColor: '#f4e7c4', image: { small: '…', medium: '…', large: '…', alt: 'Loft Chair in Mustard' } },
      { id: 'blush', label: 'Blush', colorHex: '#e59cc5', backgroundColor: '#f9e4ef', image: { small: '…', medium: '…', large: '…', alt: 'Loft Chair in Blush' } },
    ],
    features: [
      { id: 'finish', label: 'Finish', description: 'A **solid stage colour** with a cut-out on top.', mediaType: 'color', media: { color: '#1c1f22' }, overlay: { small: '…', medium: '…', large: '…', alt: 'Chair cut-out' } },
      { id: 'materials', label: 'Materials', description: 'A background photograph with a cut-out on top.', mediaType: 'image', media: { small: '…', medium: '…', large: '…', alt: 'Grey plaster' }, overlay: { small: '…', medium: '…', large: '…', alt: 'Chair, side view' } },
      { id: 'light', label: 'Light', description: 'A looping video background.', mediaType: 'video', media: { src: '/media/video/shadows.mp4', alt: 'Shadows on a sunlit wall' } },
      { id: 'build', label: 'Build', description: 'A 3D model you can drag to rotate.', mediaType: 'model', media: { src: '/media/painted_wooden_chair_01.glb', background: '#1c1f22' } },
    ],
  },
  null,
  2
)

function Playground() {
  const [preset, setPreset] = useState<keyof typeof PRESETS>('liquidGlassConfig')
  const [phone, setPhone] = useState(false)
  const config: ProductViewerVisualConfig = PRESETS[preset]
  const viewer = <ProductViewer key={`${preset}-${phone}`} data={data} visualConfig={config} modelRenderer={ModelViewer} />
  return (
    <section id="playground" className="playground bleed">
      <div className="toolbar" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <label>
          Preset
          <select value={preset} onChange={(e) => setPreset(e.target.value as keyof typeof PRESETS)}>
            {Object.keys(PRESETS).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <span className="seg" role="group" aria-label="Frame">
          <button type="button" aria-pressed={!phone} onClick={() => setPhone(false)}>Full width</button>
          <button type="button" aria-pressed={phone} onClick={() => setPhone(true)}>Phone</button>
        </span>
        <span className="muted" style={{ fontSize: '0.85rem' }}>
          The layout follows the viewer's own width, so the phone frame is the same component in a 390px box.
        </span>
      </div>
      {phone ? <div className="phone-frame">{viewer}</div> : viewer}
    </section>
  )
}

export function DocsApp() {
  return (
    <>
      <nav className="nav">
        <a className="brand" href="#top">{pkg}</a>
        {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        <span className="spacer" />
        <a href="./demo.html">Demo only</a>
        <a href="./devices.html">Device frames</a>
        <a href="https://github.com/tolgainam/product-viewer">GitHub</a>
      </nav>

      <main className="page" id="top">
        <header className="hero">
          <h1>Product viewer for React</h1>
          <p className="lead">
            An Apple-style product stage: colour variants that cross-fade, expandable feature cards, and image, video,
            flat-colour or 3D backgrounds. It renders from one JSON file and depends on nothing but React and framer-motion.
          </p>
          <div className="badges">
            <span className="badge">React 18 / 19</span>
            <span className="badge">No UI framework</span>
            <span className="badge">3D optional</span>
            <span className="badge">MIT</span>
          </div>
        </header>

        <Playground />

        <h2 id="install">Install</h2>
        <Code lang="bash">{`npm install ${pkg} react react-dom framer-motion`}</Code>
        <p className="muted">
          Also available straight from a GitHub release:{' '}
          <code>npm install https://github.com/tolgainam/product-viewer/releases/latest/download/product-viewer.tgz</code>
        </p>
        <p>Then render it with a content file. No provider, no theme, no CSS import.</p>
        <Code lang="tsx">{`import { ProductViewer } from '${pkg}'
import product from './product.json'

export function ProductPage() {
  return <ProductViewer data={product} />
}`}</Code>
        <p>
          For 3D backgrounds, also install <code>three</code>, <code>@react-three/fiber</code> and <code>@react-three/drei</code>{' '}
          and pass the renderer from the <code>./model</code> entry. Apps without 3D never download three.js.
        </p>
        <Code lang="tsx">{`import { ProductViewer } from '${pkg}'
import { ModelViewer } from '${pkg}/model'

<ProductViewer data={product} modelRenderer={ModelViewer} />`}</Code>

        <h2 id="content">Content file</h2>
        <p>
          One product is one JSON object: a <code>hero</code>, a list of colour <code>variants</code>, and a list of feature
          cards. The shape is described by <code>schema/product-viewer.schema.json</code>, which ships in the package, and a
          complete working example is at <code>examples/example-product.json</code>.
        </p>
        <Code lang="json">{exampleJson}</Code>
        <div className="grid">
          <div className="card"><h3>hero</h3><p>The product name and the picture shown when no card is open and no variant matches.</p></div>
          <div className="card"><h3>variants</h3><p>One entry per colour: a swatch colour, a picture, and an optional stage colour used when the background follows the variant. May be empty.</p></div>
          <div className="card"><h3>features</h3><p>The cards. Each has a short <code>label</code> for the pill, a <code>description</code> for the open card (supports <code>**bold**</code>), a background, and optionally an <code>overlay</code> image drawn on top. May be empty.</p></div>
          <div className="card"><h3>images</h3><p><code>small</code> is used below 600px viewports, <code>medium</code> below 1200px, <code>large</code> above; add <code>small2x</code> etc. for high-density screens. Pointing all three at one file is fine.</p></div>
        </div>

        <h2 id="backgrounds">Background types</h2>
        <p>A feature's <code>mediaType</code> decides what fills the stage while its card is open.</p>
        <table>
          <thead><tr><th>mediaType</th><th>media</th><th>Behaviour</th></tr></thead>
          <tbody>
            <tr><td><code>image</code></td><td><code>{'{ small, medium, large, alt }'}</code></td><td>Fills the stage. Cross-fades once the file has loaded. Add <code>overlay</code> for a cut-out on top.</td></tr>
            <tr><td><code>color</code></td><td><code>{'{ color }'}</code></td><td>Recolours the stage and shows the <code>overlay</code>, or the selected product without one.</td></tr>
            <tr><td><code>video</code></td><td><code>{'{ src, alt? }'}</code></td><td>Plays muted and looped, fading in from the plain stage on its first frame. No poster is drawn. Users who prefer reduced motion get controls instead of autoplay.</td></tr>
            <tr><td><code>model</code></td><td><code>{'{ src, background?, poster? }'}</code></td><td>A GLB/GLTF, auto-fitted to the stage and slowly rotating, with a progress bar while it loads. <code>poster</code> is only shown when 3D is unavailable.</td></tr>
          </tbody>
        </table>
        <p>
          Colour values in content (<code>backgroundColor</code>, a colour feature's <code>color</code>, a model's{' '}
          <code>background</code>) must be plain CSS colours. Anything else is ignored, so a CMS field cannot inject CSS.
        </p>
        <p className="muted">
          The demo uses real photographs, a clip and a model under free licences (Unsplash, Pexels, CC0), listed in{' '}
          <code>examples/CREDITS.md</code>.
        </p>

        <h2 id="presets">Presets</h2>
        <p>Pass one of the three presets as <code>visualConfig</code>, or spread one into your own (see Colours).</p>
        <Code lang="tsx">{`import { ProductViewer, transparentBlueConfig } from '${pkg}'

<ProductViewer data={product} visualConfig={transparentBlueConfig} />`}</Code>
        <div className="grid">
          <div className="card"><h3>liquidGlassConfig</h3><p>Default. Frosted translucent pills; the stage colour follows the selected variant.</p></div>
          <div className="card"><h3>defaultConfig</h3><p>Darker liquid-glass pills with white text on a fixed dark stage.</p></div>
          <div className="card"><h3>transparentBlueConfig</h3><p>Blue-tinted frosted glass on a navy stage.</p></div>
        </div>
        <p>Try them in the <a href="#playground">playground</a> above.</p>

        <h2 id="colours">Colours and glass</h2>
        <p>
          Everything visual lives in one object, <code>ProductViewerVisualConfig</code>: pill colours per state, the open
          card's colours, the stage colour, the close button, glass effect and intensity, corner radius and icons. Edit the
          values below, watch the preview, and copy the generated config.
        </p>
        <ConfigEditor data={data} />
        <h3>Icons</h3>
        <p>
          The four icons (expand, close, and the two chevrons) are components from <code>lucide-react</code>. Any component that
          accepts <code>size</code> and <code>color</code> works:
        </p>
        <Code lang="tsx">{`import { ArrowUpRight, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { liquidGlassConfig } from '${pkg}'

const config = {
  ...liquidGlassConfig,
  pill: {
    ...liquidGlassConfig.pill,
    icons: { expandIcon: ArrowUpRight, closeIcon: X, chevronLeftIcon: ChevronLeft, chevronRightIcon: ChevronRight },
  },
}`}</Code>

        <h2 id="labels">Labels and translation</h2>
        <p>Every rendered string can be replaced through the <code>labels</code> prop. Braces are placeholders.</p>
        <Code lang="tsx">{`<ProductViewer
  data={product}
  labels={{ color: 'Farbe', displayedIn: '{product} in {variant}', close: 'Schließen' }}
/>`}</Code>
        <table>
          <thead><tr><th>Key</th><th>Default</th><th>Used for</th></tr></thead>
          <tbody>
            {(Object.keys(defaultLabels) as (keyof typeof defaultLabels)[]).map((key) => (
              <tr key={key}><td><code>{key}</code></td><td><code>{defaultLabels[key]}</code></td><td>{LABEL_USE[key]}</td></tr>
            ))}
          </tbody>
        </table>

        <h2 id="layout">Layout and breakpoints</h2>
        <p>
          Two layouts ship in one component. The desktop layout is a 16:9 stage with a pill stack on the left; the mobile
          layout is a full-width stage with a swipeable pill strip at the bottom. Which one renders is decided by the
          viewer's <em>own</em> width, measured with <code>ResizeObserver</code>, so a viewer in a sidebar gets the mobile
          layout on a large screen.
        </p>
        <Code lang="tsx">{`// Switch to the mobile layout below 900px of viewer width instead of 1200px
<ProductViewer data={product} breakpoint={900} />

// Or pin a layout
<ProductViewer data={product} layout="mobile" />`}</Code>
        <p>
          Before the first measurement (and on the server) the viewport width decides, so server-rendered markup can start in
          the other layout and correct on hydration; pass <code>layout</code> to avoid that. The outer element is transparent
          with no padding and carries <code>data-layout="desktop"</code> or <code>"mobile"</code> for your own styling.
        </p>

        <h3>Breakpoints</h3>
        <table>
          <thead><tr><th>Viewer width</th><th>Layout</th><th>Stage</th><th>Open card</th></tr></thead>
          <tbody>
            <tr><td>below 600px</td><td>Mobile</td><td>Full width, 85% of the viewport height (480 to 700px)</td><td>Viewer width minus 96px</td></tr>
            <tr><td>600 to 1199px</td><td>Mobile (tablet)</td><td>Full width, 85% of the viewport height (480 to 700px)</td><td>Viewer width minus 96px, at most 520px, centred</td></tr>
            <tr><td>1200px and up</td><td>Desktop</td><td>16:9, at least 500px tall, at most 1408px wide, centred</td><td>320px wide beside the stage's left edge</td></tr>
          </tbody>
        </table>
        <p>
          The 1200px switch is the <code>breakpoint</code> prop and is measured on the viewer, not the window. Image sources use
          the <em>window</em> width, because that is what <code>&lt;picture&gt;</code> can see: <code>small</code> below 600px,{' '}
          <code>medium</code> from 600px, <code>large</code> from 1200px, and the <code>2x</code> file of each on screens with a
          device pixel ratio above 1.5.
        </p>

        <h3>Image sizes and aspect ratios</h3>
        <p>
          Each size has a standard aspect ratio that matches the stage it is shown on: the phone stage is portrait, the
          tablet stage is close to square, the desktop stage is 16:9. Pixel sizes are for a device pixel ratio of 1; add the{' '}
          <code>2x</code> files for high-density screens, or double every size and skip them.
        </p>
        <table>
          <thead><tr><th>Use</th><th>small (below 600px)</th><th>medium (600 to 1199px)</th><th>large (1200px and up)</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>Product shots (hero, variants)</td><td>1:1, 640×640</td><td>1:1, 1200×1200</td><td>1:1, 1920×1920</td><td>Product centred on a uniform or transparent backdrop. Letterboxed with a 5% margin; set each variant's <code>backgroundColor</code> to the backdrop colour so the square disappears.</td></tr>
            <tr><td>Backgrounds (<code>image</code> features)</td><td>9:16, 720×1280</td><td>1:1, 1200×1200</td><td>16:9, 1920×1080</td><td>Fills the stage, so crop each size around the subject. WebP or AVIF, under 300 KB at 1920.</td></tr>
            <tr><td>Overlays (cut-outs)</td><td>1:1, 640×640</td><td>1:1, 1200×1200</td><td>1:1, 1920×1920</td><td>Transparent PNG or WebP, object centred on the square canvas. Letterboxed inside 90% of the stage.</td></tr>
            <tr><td>Video</td><td colSpan={3}>16:9, 1280×720 H.264 MP4</td><td>One file for every layout, muted, 5 to 15 seconds, under 2 MB. Phones show the middle of the frame, so keep the subject central.</td></tr>
            <tr><td>3D model</td><td colSpan={3}>GLB, 1k WebP textures</td><td>Under 2 MB; fetched only when the card opens.</td></tr>
          </tbody>
        </table>
        <p className="muted">
          Any size may point at the same file; the ratios only decide how much the stage crops. The demo's{' '}
          <code>fetch:assets</code> script derives all three from one source with sharp.
        </p>

        <h2 id="props">Props</h2>
        <table>
          <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><code>data</code></td><td><code>ProductViewerData</code></td><td>required</td><td>The content file.</td></tr>
            <tr><td><code>defaultVariantId</code></td><td><code>string</code></td><td>first variant</td><td>Colour selected on mount. Unknown ids fall back to the first.</td></tr>
            <tr><td><code>defaultFeatureIndex</code></td><td><code>number</code></td><td><code>-1</code></td><td><code>-1</code> nothing open, <code>-2</code> the colour selector, <code>0+</code> that feature. Out-of-range values open nothing.</td></tr>
            <tr><td><code>onVariantChange</code></td><td><code>(id) =&gt; void</code></td><td></td><td>Fires on colour change.</td></tr>
            <tr><td><code>onFeatureToggle</code></td><td><code>(index, expanded) =&gt; void</code></td><td></td><td>Fires when a card opens or closes (<code>-2</code> for the colour selector).</td></tr>
            <tr><td><code>visualConfig</code></td><td><code>ProductViewerVisualConfig</code></td><td><code>liquidGlassConfig</code></td><td>Colours, glass, radius, icons.</td></tr>
            <tr><td><code>modelRenderer</code></td><td><code>ModelRenderer</code></td><td></td><td>Renderer for <code>model</code> features, from <code>{pkg}/model</code>.</td></tr>
            <tr><td><code>breakpoint</code></td><td><code>number</code></td><td><code>1200</code></td><td>Viewer width below which the mobile layout is used.</td></tr>
            <tr><td><code>layout</code></td><td><code>'auto' | 'desktop' | 'mobile'</code></td><td><code>'auto'</code></td><td>Force a layout.</td></tr>
            <tr><td><code>labels</code></td><td><code>Partial&lt;ProductViewerLabels&gt;</code></td><td>English</td><td>Rendered strings.</td></tr>
            <tr><td><code>className</code></td><td><code>string</code></td><td></td><td>Applied to the outer element, which also receives the forwarded ref.</td></tr>
          </tbody>
        </table>
        <p>
          Types ship with the package: <code>ProductViewerData</code>, <code>ProductViewerFeature</code> (a discriminated union
          on <code>mediaType</code>), <code>ProductViewerVisualConfig</code>, <code>ProductViewerLabels</code>,{' '}
          <code>ResponsiveImage</code>, <code>ResponsiveVideo</code>, <code>ModelRenderer</code>. Cast an imported JSON file once:{' '}
          <code>product as ProductViewerData</code>.
        </p>

        <h2 id="interaction">Interaction and accessibility</h2>
        <ul>
          <li><strong>Desktop:</strong> click a pill to open it; click its header, the close button, or press <kbd>Esc</kbd> to close. <kbd>↑</kbd> <kbd>↓</kbd> move between open cards.</li>
          <li><strong>Mobile:</strong> drag the pill strip. Tap a pill to open it. Swipe an open card left or right, or use <kbd>←</kbd> <kbd>→</kbd>.</li>
          <li>Pills are real buttons with <code>aria-expanded</code>; card content is a labelled region; swatches form a radio group with arrow-key selection; stage images carry the content's <code>alt</code>.</li>
          <li>Transforms are skipped and videos do not autoplay when the user prefers reduced motion.</li>
          <li>Other variants and feature images are prefetched once the page is idle, unless the browser asks to save data.</li>
        </ul>

        <footer>
          MIT © 2026 Tolga Inam. Source and issues on{' '}
          <a href="https://github.com/tolgainam/product-viewer">GitHub</a>.
        </footer>
      </main>
    </>
  )
}

const LABEL_USE: Record<keyof typeof defaultLabels, string> = {
  color: 'Text on the colour pill',
  displayedIn: 'Caption in the open colour card',
  close: 'Accessible name of the close button',
  previous: 'Accessible name of the previous-card control',
  next: 'Accessible name of the next-card control',
  colorOptions: 'Accessible name of the swatch group',
  selectColor: 'Accessible name of one swatch',
  unavailable: 'Suffix for a colour that cannot be chosen',
}
