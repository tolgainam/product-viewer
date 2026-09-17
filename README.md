# @tolgainam/product-viewer

**Documentation and live playground:** https://tolgainam.github.io/product-viewer (built from `dev/` on every deploy, so it always matches the package).

An Apple-style product viewer for React: a hero image or video, colour variants that cross-fade, and expandable feature cards with their own media. It renders entirely from a JSON content file, so it carries no catalog, CMS or design-system dependency.

Two layouts ship in one component: a desktop stage with a floating pill stack, and a full-width mobile stage with a swipeable pill strip. The layout is chosen from the viewer's **own width** (below 1200px by default), so a viewer in a narrow column gets the mobile layout on any screen.

## Install

From npm:

```bash
npm install @tolgainam/product-viewer
```

Or straight from a GitHub release, no registry needed:

```bash
npm install https://github.com/tolgainam/product-viewer/releases/latest/download/product-viewer.tgz
```

**Peer dependencies** — the host app provides these:

```bash
npm install react react-dom framer-motion
```

React 18 or 19 and framer-motion 12. There is no UI framework in the chain: styling is inline plus one small stylesheet the component injects on first render, and icons come from `lucide-react` (bundled as a regular dependency, tree-shaken to the six icons used). three.js is **not** in the list: it is an optional peer, needed only for the `model` background type — see [Background types](#background-types) below.

## Quick start

```tsx
import { ProductViewer } from '@tolgainam/product-viewer'
import product from './example-product.json'

export function ProductPage() {
  return <ProductViewer data={product} />
}
```

That's the whole setup: no provider, no theme, no CSS import.

## The content file

`data` holds one product. A complete, working example ships at `examples/example-product.json`, and the shape is described by `schema/product-viewer.schema.json`.

```json
{
  "id": "example-product",
  "hero": {
    "name": "Loft Chair",
    "alt": "Loft Chair",
    "image": {
      "small": "/media/chairs/mustard-640.webp",
      "medium": "/media/chairs/mustard-1200.webp",
      "large": "/media/chairs/mustard-1920.webp",
      "alt": "Loft Chair in Mustard"
    }
  },
  "variants": [
    {
      "id": "mustard",
      "label": "Mustard",
      "colorHex": "#d0a12d",
      "backgroundColor": "#f4e7c4",
      "image": { "small": "...", "medium": "...", "large": "...", "alt": "Loft Chair in Mustard" }
    }
  ],
  "features": [
    {
      "id": "materials",
      "label": "Materials",
      "title": "SOLID BEECH",
      "description": "Solid beech, mortise-and-tenon joints, no metal.",
      "mediaType": "image",
      "media": { "small": "...", "medium": "...", "large": "...", "alt": "Grey plaster wall" },
      "overlay": { "small": "...", "medium": "...", "large": "...", "alt": "Loft Chair, side view" },
      "footnotes": ["Measured under laboratory conditions."]
    }
  ]
}
```

Notes:

- **Images** take `small`, `medium` and `large` URLs plus `alt`, with optional `small2x`, `medium2x` and `large2x`. They render as a `<picture>`: `small` below 600px viewports, `medium` below 1200px, `large` above, and the `2x` file on high-density screens. Product shots (hero and variants) are letterboxed to fit; feature media fills the stage. The next image is fetched before the crossfade starts, and the other variants and feature images are prefetched once the page is idle (skipped when the browser asks to save data). Recommended sizes are in [Breakpoints and image sizes](#breakpoints-and-image-sizes).
- **Videos** replace an image with `{ "src": "...", "alt": "..." }` and need `"mediaType": "video"` on the feature. MP4, WebM, Ogg and MOV are recognised by extension. No poster is drawn: the stage shows its plain colour until the video can play, then the video fades in (a `poster` object is still accepted for older content, but only its `alt` is used). Only a *feature's* video plays — `hero.video` is accepted by the schema but not rendered; the hero shows `hero.image`. When the user prefers reduced motion the video does not autoplay and shows controls instead.
- **URLs are yours.** The example points at relative paths; serve your own files from anywhere.
- `variants` and `features` may be empty arrays. A missing `hero` renders an empty container and logs a warning.
- **What a feature card shows:** the pill and the card heading use `label`, and the open card shows `description`. `title` is optional and is carried with the content rather than displayed. `description` may contain `**bold**` spans.
- **Overlay:** any `image` or `color` feature may add `overlay`, a `ResponsiveImage` drawn on top of the background, letterboxed and centred with a small margin. A transparent PNG or WebP cut-out works best. A `color` feature without an overlay shows the selected variant's picture.
- **Colour values** in content (`variant.backgroundColor`, a `color` feature's `color`, a model's `background`) must be plain CSS colours (`#hex`, `rgb()`, `hsl()`, a named colour). Anything else is ignored and the preset colour is used, so a CMS field cannot inject arbitrary CSS.

### Background types

A feature's `mediaType` decides what fills the stage behind the card:

| `mediaType` | `media` shape | Notes |
|---|---|---|
| `image` | `ResponsiveImage` | Fills the stage. Add `overlay` for a picture on top. |
| `video` | `{ src, alt? }` | Plays muted and looped while the card is open; fades in from the plain stage. |
| `color` | `{ color: "#1a2e28" }` | Recolours the stage and shows `overlay`, or the selected product. |
| `model` | `{ src, poster?, background? }` | A GLB/GLTF model, auto-fitted to the card and slowly rotating. `poster` is only a fallback for when 3D is unavailable. |

While a model loads, the card shows its plain backdrop with a thin progress bar (never the poster, which used to flash for a frame), and the stage picture is removed the instant the canvas takes over. A `model` feature is framed automatically, so a GLB of any scale and any canvas aspect fills the card. It sits on a dark, slightly green backdrop (`#1e2a26`) unless the content sets `background`, lit by a three-point rig with contact shadows — no HDRI download, so it renders offline (a Draco-compressed GLB still fetches the decoder from Google's CDN, as drei does by default). Panning and zooming are off to keep the framing; the model rotates on its own. While the scene loads, the card shows that plain backdrop rather than the poster, so there is no flash before the canvas appears.

**3D is opt-in.** The main entry contains no reference to three.js, so an app with no `model` features neither installs nor bundles it. To enable 3D, install the three peers and pass the renderer from the `./model` entry:

```bash
npm install three @react-three/fiber @react-three/drei
```

```tsx
import { ProductViewer } from '@tolgainam/product-viewer'
import { ModelViewer } from '@tolgainam/product-viewer/model'

<ProductViewer data={product} modelRenderer={ModelViewer} />
```

Importing `./model` is what pulls in three.js, and it stays code-split: the scene is fetched when a model card first opens, not at page load. Without `modelRenderer`, a `model` feature shows its `poster`; if the model file fails to load, it falls back to the poster too.

You can pass your own renderer instead — any component taking `{ src, background?, poster? }` — if you'd rather drive three.js yourself.

### Demo assets

The example content is backed by real photographs, a video clip and a 3D model under `examples/media`, all with licences that allow free use (Unsplash License, Pexels License and CC0) and none showing a brand name or logo. They are listed with their sources in `examples/assets.json` and credited in `examples/CREDITS.md`. Copy `examples/media` next to your app's static files and the example JSON renders as-is.

The media files live in the repository, not in the npm package (the package ships only the JSON and the credits). `npm run fetch:assets` downloads the originals and derives the responsive sizes, the 12-second loop and the packed GLB from the manifest, so the set is reproducible.

## Breakpoints and image sizes

| Viewer width | Layout | Stage | Open card |
|---|---|---|---|
| below 600px | Mobile | full width, 85% of the viewport height (480 to 700px) | viewer width minus 96px |
| 600 to 1199px | Mobile (tablet) | full width, 85% of the viewport height (480 to 700px) | viewer width minus 96px, at most 520px, centred |
| 1200px and up | Desktop | 16:9, at least 500px tall, at most 1408px wide, centred | 320px, beside the stage's left edge |

The 1200px switch is the `breakpoint` prop and is measured on the viewer element. Image sources are chosen by the *window* width, because that is what `<picture>` can see: `small` below 600px, `medium` from 600px, `large` from 1200px, and the `2x` file of each on screens with a device pixel ratio above 1.5.

Each size has a standard aspect ratio that matches the stage it is shown on. The phone stage is portrait, the tablet stage is close to square and the desktop stage is 16:9. Pixel sizes are for a device pixel ratio of 1; add the `2x` files for high-density screens, or double every size and skip them.

| Use | small (below 600px) | medium (600 to 1199px) | large (1200px and up) | Notes |
|---|---|---|---|---|
| Product shots (hero, variants) | 1:1, 640×640 | 1:1, 1200×1200 | 1:1, 1920×1920 | Product centred on a uniform or transparent backdrop. Letterboxed with a 5% margin; set each variant's `backgroundColor` to the backdrop colour so the square disappears. |
| Backgrounds (`image` features) | 9:16, 720×1280 | 1:1, 1200×1200 | 16:9, 1920×1080 | Fills the stage (`cover`), so crop each size around the subject. WebP or AVIF, under 300 KB at 1920. |
| Overlays (cut-outs) | 1:1, 640×640 | 1:1, 1200×1200 | 1:1, 1920×1920 | Transparent PNG or WebP, object centred on the square canvas. Letterboxed inside 90% of the stage. |
| Video | 16:9, 1280×720 H.264 MP4 | | | One file for every layout, muted, 5 to 15 seconds, under 2 MB. Phones show the middle of the frame, so keep the subject central. |
| 3D model | GLB, 1k WebP textures | | | Under 2 MB; fetched only when the card opens. |

Any size may point at the same file; the ratios only decide how much the stage crops. `scripts/fetch-demo-assets.mjs` derives all three from one source with sharp (a `focus` of `attention` or `entropy` per asset moves the crop off centre).

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `ProductViewerData` | — | Required. The product content above. |
| `defaultVariantId` | `string` | first variant | Colour selected on mount. |
| `defaultFeatureIndex` | `number` | `-1` | `-1` nothing expanded, `-2` opens the colour selector, `0+` opens that feature. |
| `onVariantChange` | `(variantId: string) => void` | — | Fires on colour change. |
| `onFeatureToggle` | `(index: number, expanded: boolean) => void` | — | Fires when a feature card opens or closes. |
| `modelRenderer` | `ModelRenderer` | — | Renderer for `model` features. Without one they show their poster. |
| `visualConfig` | `ProductViewerVisualConfig` | `liquidGlassConfig` | Colours, glass effects, radii and icons (any `lucide-react` icon, or a component taking `size`/`color`). |
| `breakpoint` | `number` | `1200` | Viewer width below which the mobile layout is used. |
| `layout` | `'auto' \| 'desktop' \| 'mobile'` | `'auto'` | Force a layout instead of measuring. |
| `labels` | `Partial<ProductViewerLabels>` | English | Every rendered string, for translation (see below). |
| `className` | `string` | — | Applied to the outer element. |

The component forwards a ref to its outer element. The outer element is transparent and has no padding, so the host page decides the surrounding spacing; it carries `data-layout="desktop"` or `"mobile"` for styling hooks.

### Interaction

- **Desktop:** click a pill to open it, click its header (or the close button, or press Escape) to close. Arrow up/down move between open cards.
- **Mobile:** the pill strip can be dragged. Tap a pill to open it; the strip slides so the card sits centred. An open card can be swiped left or right to its neighbours; arrow left/right do the same from the keyboard.
- Every pill is a real button with `aria-expanded`, the card content is a labelled region, and colour swatches form a radio group with arrow-key selection. Animations honour the reduced-motion preference.

### Labels

All rendered strings can be replaced, for instance for translation:

```tsx
<ProductViewer
  data={product}
  labels={{ color: 'Farbe', displayedIn: '{product} in {variant}', close: 'Schließen' }}
/>
```

The full set is `color`, `displayedIn`, `close`, `previous`, `next`, `colorOptions`, `selectColor` and `unavailable`; `defaultLabels` exports the English defaults.

## Looks

Three presets are included:

```tsx
import { ProductViewer, transparentBlueConfig } from '@tolgainam/product-viewer'

<ProductViewer data={product} visualConfig={transparentBlueConfig} />
```

| Preset | Use |
|---|---|
| `liquidGlassConfig` | Default. Frosted translucent pills; the stage colour follows the selected variant. |
| `defaultConfig` | Darker liquid-glass pills with white text on a fixed dark stage. |
| `transparentBlueConfig` | Blue-tinted glass on a navy stage. |

Build your own by spreading a preset:

```tsx
import { defaultConfig, colors } from '@tolgainam/product-viewer'

const config = {
  ...defaultConfig,
  container: { ...defaultConfig.container, backgroundColor: colors.neutral[140] },
  expandedCard: { ...defaultConfig.expandedCard, maxWidth: 320 },
}
```

## Palette

The package ships its own frozen palette — colours, type scale, spacing and radii — so it looks identical in any app. Import it to match your surrounding surfaces:

```tsx
import { colors, typography, spacing, getSpacingPx, palette } from '@tolgainam/product-viewer'
```

The font stack is `"Inter", "Roboto", "Helvetica", "Arial", sans-serif` and no font is bundled. Note that it is applied as an inline style, so a stylesheet rule in the host app will not override it — using a different face currently means changing `typography.fontFamily` in the source.

## TypeScript

Types ship with the package:

```ts
import type {
  ProductViewerData,
  ProductViewerProps,
  ProductViewerVisualConfig,
  ProductViewerHero,
  ProductViewerVariant,
  ProductViewerFeature,
  ModelRenderer,
  ResponsiveImage,
  ResponsiveVideo,
} from '@tolgainam/product-viewer'
```

To type an imported JSON file, cast it once: `const data = product as ProductViewerData`.

## Notes

- ESM only, with source maps. Bundle it as you would any modern React package. No MUI, Emotion or other CSS-in-JS runtime: hover, focus and loading-bar rules live in a 1 KB stylesheet tagged `data-product-viewer` that the component appends to `<head>` once.
- Animations use framer-motion and respect the browser's reduced-motion setting (transforms are skipped, opacity fades remain).
- The layout is measured from the viewer's own width with `ResizeObserver`; until the first measurement (and on the server) the viewport width decides, so server-rendered markup may start in the other layout and correct on hydration. Pass `layout` to pin it.
- `ProductViewerFeature` is a discriminated union on `mediaType`, so narrowing on it also narrows `media`.

## Development

```bash
npm install
npm run dev              # docs site + playground at http://localhost:5199 (/demo.html viewer only, /devices.html phone frames)
npm run demo:build       # build the docs site for GitHub Pages into docs/dist
npm run fetch:assets     # download the demo photos, clip and model and derive the sizes
npm run typecheck
npm test
npm run verify:consumer  # builds a throwaway consumer app twice: 2D-only, then with 3D
```

`verify:consumer` exists because type-checks, unit tests and server rendering can all pass while a real bundler build fails — that is how the optional three.js peers broke once before.

### Releasing

Releases are cut by tagging. `npm version minor` (or `patch` / `major`) bumps `package.json` and creates the tag; `git push --follow-tags` then runs the Release workflow, which type-checks, tests, builds two consumer apps, attaches the tarball to a GitHub Release and, when enabled, publishes to npm.

**Publishing to npm** uses [trusted publishing](https://docs.npmjs.com/trusted-publishers): GitHub Actions proves its identity to npm with OIDC, so no token is stored anywhere and every version carries a provenance attestation. One-time setup:

1. Publish the first version by hand, because a trusted publisher can only be attached to a package that exists: `npm login`, then `npm publish` from the repo root (`prepack` runs the build). The scope `@tolgainam` must be your npm user name or an organisation you own.
2. On npmjs.com open the package → *Settings* → *Trusted publishing* → *GitHub Actions*, and enter the repository `tolgainam/product-viewer` and the workflow file name `release.yml`.
3. In the GitHub repository go to *Settings* → *Secrets and variables* → *Actions* → *Variables* and add `PUBLISH_TO_NPM` = `true`.

From then on every `v*` tag publishes automatically. The job skips a version that is already on npm, so re-running a release is safe.

## Licence

MIT © 2026 Tolga Inam <tolgainam@gmail.com>
