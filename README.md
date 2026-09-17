# @tolgainam/product-viewer

An Apple-style product viewer for React: a hero image or video, colour variants that cross-fade, and expandable feature cards with their own media. It renders entirely from a JSON content file, so it carries no catalog, CMS or design-system dependency.

Two layouts ship in one component: a two-column desktop layout, and a full-screen mobile layout with bottom pills. It switches automatically below 1199px.

## Install

Straight from the latest release — no registry account, no auth:

```bash
npm install https://github.com/tolgainam/product-viewer/releases/latest/download/product-viewer.tgz
```

Or pin a version:

```bash
npm install https://github.com/tolgainam/product-viewer/releases/download/v0.1.0/product-viewer.tgz
```

**Peer dependencies** — the host app provides these:

```bash
npm install react react-dom @mui/material @mui/icons-material @emotion/react @emotion/styled framer-motion
```

React 18 or 19, MUI 6, framer-motion 12. three.js is **not** in that list: it is an optional peer, needed only for the `model` background type — see [Background types](#background-types) below.

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
    "name": "Aperture One",
    "alt": "Aperture One",
    "image": {
      "small": "/media/devices/forest.webp",
      "medium": "/media/devices/forest.webp",
      "large": "/media/devices/forest.webp",
      "alt": "Aperture One in Forest"
    }
  },
  "variants": [
    {
      "id": "forest",
      "label": "Forest",
      "colorHex": "#2D5A4A",
      "backgroundColor": "#1a2e28",
      "image": { "small": "...", "medium": "...", "large": "...", "alt": "Forest" }
    }
  ],
  "features": [
    {
      "id": "optics",
      "label": "Optics",
      "title": "SIX-ELEMENT ASSEMBLY",
      "description": "A six-element lens stack, aligned to within a few microns.",
      "mediaType": "image",
      "media": { "small": "...", "medium": "...", "large": "...", "alt": "Optics" },
      "footnotes": ["Measured under laboratory conditions."]
    }
  ]
}
```

Notes:

- **Images** take `small`, `medium` and `large` URLs plus `alt`, with optional `small2x`, `medium2x` and `large2x`. Note that the current layouts read **`large`** only; the other sizes are carried in the content for future use.
- **Videos** replace an image with `{ "src": "...", "poster": { ...image... } }` and need `"mediaType": "video"` on the feature. Only a *feature's* video plays — `hero.video` is accepted by the schema but not rendered; the hero shows `hero.image`.
- **URLs are yours.** The example points at relative paths; serve your own files from anywhere.
- `variants` and `features` may be empty arrays. A missing `hero` renders an empty container and logs a warning.
- **What a feature card shows:** the pill and the card heading use `label`, and the open card shows `description`. `title` is optional and is carried with the content rather than displayed.

### Background types

A feature's `mediaType` decides what fills the stage behind the card:

| `mediaType` | `media` shape | Notes |
|---|---|---|
| `image` | `ResponsiveImage` | The default. |
| `video` | `{ src, poster }` | Plays muted and looped while the card is open. |
| `color` | `{ color: "#1a2e28" }` | Recolours the stage; the selected product stays on it. |
| `model` | `{ src, poster?, background? }` | A GLB/GLTF model, auto-fitted to the card and slowly rotating. |

A `model` feature is framed automatically, so a GLB of any scale fills the card. It sits on a dark, slightly green backdrop (`#1e2a26`) unless the content sets `background`, lit by a three-point rig with contact shadows — no HDRI download, so it renders offline. Panning and zooming are off to keep the framing; the model rotates on its own. While the scene loads, the card shows that plain backdrop rather than the poster, so there is no flash before the canvas appears.

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

The example content is backed by assets under `examples/media` plus `examples/example.glb`. Copy them next to your app's static files and the example JSON renders as-is.

They are **generated from code**, not photographed or modelled: `npm run generate:assets` rebuilds every image, the GLB and the video from `scripts/generate-demo-assets.mjs`. Nothing in the package carries a licence or attribution separate from the MIT licence on the source.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `ProductViewerData` | — | Required. The product content above. |
| `defaultVariantId` | `string` | first variant | Colour selected on mount. |
| `defaultFeatureIndex` | `number` | `-1` | `-1` nothing expanded, `-2` opens the colour selector, `0+` opens that feature. |
| `onVariantChange` | `(variantId: string) => void` | — | Fires on colour change. |
| `onFeatureToggle` | `(index: number, expanded: boolean) => void` | — | Fires when a feature card opens or closes. |
| `modelRenderer` | `ModelRenderer` | — | Renderer for `model` features. Without one they show their poster. |
| `visualConfig` | `ProductViewerVisualConfig` | `liquidGlassConfig` | Colours, glass effects, radii and icons. |
| `className` | `string` | — | Applied to the outer element. |

The component forwards a ref to its outer element.

## Looks

Five presets are included:

```tsx
import { ProductViewer, lightConfig } from '@tolgainam/product-viewer'

<ProductViewer data={product} visualConfig={lightConfig} />
```

| Preset | Use |
|---|---|
| `liquidGlassConfig` | Default. Frosted translucent pills on a dark stage. |
| `defaultConfig` | Solid surfaces, no glass. |
| `transparentBlueConfig` | Tinted glass variant. |
| `lightConfig` | Light background with dark text. |
| `dynamicBackgroundConfig` | Background follows the selected colour variant. |

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

- ESM only, with source maps. Bundle it as you would any modern React package.
- Animations use framer-motion and respect the browser's reduced-motion setting.
- The mobile layout is chosen with MUI's `useMediaQuery`, so server-rendered markup starts in the desktop layout and corrects on hydration.

## Development

```bash
npm install
npm run dev              # playground at http://localhost:5173
npm run generate:assets  # rebuild the demo images, model and video
npm run typecheck
npm test
npm run verify:consumer  # builds a throwaway consumer app twice: 2D-only, then with 3D
```

`verify:consumer` exists because type-checks, unit tests and server rendering can all pass while a real bundler build fails — that is how the optional three.js peers broke once before.

Releases are cut by tagging: `git tag v0.1.1 && git push --tags` builds, verifies and attaches the tarball to a GitHub Release.

## Licence

MIT © 2026 Tolga Inam <tolgainam@gmail.com>
