/**
 * Downloads the demo assets listed in examples/assets.json and derives the files the
 * example content uses:
 *
 *   examples/media/<id>-640.webp / -1200.webp / -1920.webp   responsive sizes of each image
 *   examples/media/<id>.mp4                                    a short, muted loop cut from the source video
 *   examples/media/<id>.glb                                    the Poly Haven model packed into one GLB
 *
 * Nothing here is generated: every file is a real photo, clip or model with a free
 * licence, credited in examples/CREDITS.md (which this script writes).
 *
 * Run with: npm run fetch:assets
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const examples = join(root, 'examples')
const media = join(examples, 'media')
const cache = join(root, 'node_modules', '.cache', 'demo-assets')
const manifest = JSON.parse(readFileSync(join(examples, 'assets.json'), 'utf8'))

/**
 * Size tiers and the standard aspect ratio of each. The phone stage is portrait, the
 * tablet stage is close to square and the desktop stage is 16:9, so a background gets a
 * 9:16 small, a 1:1 medium and a 16:9 large. Product shots and cut-outs are 1:1 at every tier.
 */
const TIERS = [
  { tier: 640, square: [640, 640], wide: [720, 1280] },
  { tier: 1200, square: [1200, 1200], wide: [1200, 1200] },
  { tier: 1920, square: [1920, 1920], wide: [1920, 1080] },
]
const UA = 'product-viewer-demo-assets/1.0 (+https://github.com/tolgainam/product-viewer)'

mkdirSync(cache, { recursive: true })
mkdirSync(media, { recursive: true })

/** Cached by URL, so changing an asset's source in the manifest fetches the new file */
async function download(url, file) {
  file = file.replace(/(\.[^./]+)?$/, `-${createHash('sha1').update(url).digest('hex').slice(0, 8)}$1`)
  if (existsSync(file)) return file
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  return file
}

/* ----------------------------------------------------------------- images -- */

for (const image of manifest.images) {
  const src = await download(image.download, join(cache, image.id.replace(/\//g, '_') + '.src'))
  const outDir = join(media, dirname(image.id))
  mkdirSync(outDir, { recursive: true })
  const base = join(media, image.id)

  for (const { tier, square, wide } of TIERS) {
    let pipeline = sharp(src).rotate()
    if (image.fit === 'square') {
      // Product shots: 1:1, product centred, padded with the photo's own edge colour;
      // the content sets the same colour as the stage so the canvas disappears into it
      pipeline = pipeline.resize(square[0], square[1], { fit: 'contain', background: await edgeColor(src) })
    } else if (image.fit === 'transparent' || image.fit === 'tint') {
      // Cut-outs: 1:1 transparent canvas, object centred. `tint` recolours a render so one
      // product can be shown in several paints; the alpha channel is kept.
      if (image.fit === 'tint') pipeline = pipeline.tint(image.tint)
      pipeline = pipeline.resize(square[0], square[1], { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    } else {
      // Backgrounds: cropped to the tier's ratio around the manifest's focus (default centre)
      pipeline = pipeline.resize(wide[0], wide[1], { fit: 'cover', position: image.focus ?? 'centre' })
    }
    await pipeline.webp({ quality: image.fit === 'wide' || image.fit === 'square' ? 82 : 90, alphaQuality: 95 }).toFile(`${base}-${tier}.webp`)
  }
  console.log('image ', image.id)
}

/** Average colour of the photo's outer 1%, so a square canvas continues the backdrop */
async function edgeColor(file) {
  const img = sharp(file).rotate()
  const { width, height } = await img.metadata()
  const strip = Math.max(2, Math.round(Math.min(width, height) * 0.01))
  const bands = [
    { left: 0, top: 0, width, height: strip },
    { left: 0, top: height - strip, width, height: strip },
    { left: 0, top: 0, width: strip, height },
    { left: width - strip, top: 0, width: strip, height },
  ]
  const sum = [0, 0, 0]
  let n = 0
  for (const band of bands) {
    const { data } = await sharp(file).rotate().extract(band).raw().toBuffer({ resolveWithObject: true })
    for (let i = 0; i < data.length; i += 3) {
      sum[0] += data[i]
      sum[1] += data[i + 1]
      sum[2] += data[i + 2]
      n += 1
    }
  }
  return { r: Math.round(sum[0] / n), g: Math.round(sum[1] / n), b: Math.round(sum[2] / n) }
}

/* ----------------------------------------------------------------- videos -- */

for (const video of manifest.videos) {
  const src = await download(video.download, join(cache, video.id.replace(/\//g, '_') + '.mp4'))
  const out = join(media, `${video.id}.mp4`)
  mkdirSync(dirname(out), { recursive: true })
  const { default: ffmpeg } = await import('ffmpeg-static')
  execFileSync(ffmpeg, [
    '-y', '-loglevel', 'error',
    '-ss', String(video.trim.start), '-t', String(video.trim.seconds), '-i', src,
    '-vf', 'scale=1280:-2', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', out,
  ])
  console.log('video ', video.id)
}

/* ----------------------------------------------------------------- models -- */

for (const model of manifest.models) {
  const files = await fetch(`https://api.polyhaven.com/files/${model.polyhaven}`, { headers: { 'User-Agent': UA } }).then((r) => r.json())
  const entry = files.gltf[model.resolution].gltf
  const dir = join(cache, model.id)
  mkdirSync(join(dir, 'textures'), { recursive: true })
  const gltf = await download(entry.url, join(dir, `${model.id}.gltf`))
  for (const [rel, inc] of Object.entries(entry.include)) {
    await download(inc.url, join(dir, rel))
  }
  const out = join(media, `${model.id}.glb`)
  // Pack into one GLB and shrink textures: 1k WebP keeps the model under ~2 MB
  execFileSync('npx', ['--yes', '@gltf-transform/cli@4', 'webp', gltf, out, '--quality', '85'], { stdio: 'inherit' })
  console.log('model ', model.id)
}

/* ---------------------------------------------------------------- credits -- */

const credit = (a) => `- **${a.title}** by ${a.author} — [${a.license}](${a.source})`
writeFileSync(
  join(examples, 'CREDITS.md'),
  `# Demo asset credits

The example content uses real photographs, footage and a 3D model, all under licences that allow free use. Files under \`examples/media\` are derived from these sources by \`scripts/fetch-demo-assets.mjs\` (cropped to standard ratios, resized, re-encoded, trimmed or packed; nothing else changed).

## Photographs

${manifest.images.filter((i) => i.fit === 'wide' || i.fit === 'square').map(credit).join('\n')}

Unsplash License: free to use for commercial and non-commercial purposes, no permission or attribution required. https://unsplash.com/license

## Renders and 3D models

${[...manifest.images.filter((i) => i.fit === 'transparent' || i.fit === 'tint'), ...manifest.models].map(credit).join('\n')}

The colour variants are one transparent render recoloured with a tint, so the same chair appears in several paints.

CC0 1.0: public domain dedication, no attribution required. https://polyhaven.com/license

## Video

${manifest.videos.map(credit).join('\n')}

Pexels License: free to use, no attribution required. https://www.pexels.com/license/
`
)
console.log('credits written')

// Generated assets from earlier versions, if any are left over
for (const stale of ['example.glb', 'media/devices', 'media/features', 'media/video/motion.mp4']) {
  const p = join(examples, stale)
  if (existsSync(p)) rmSync(p, { recursive: true, force: true })
}
