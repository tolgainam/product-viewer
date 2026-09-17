/**
 * Generates the demo assets that ship with the package.
 *
 * Everything here is produced from code — no third-party photography, models or
 * footage — so the published package carries no asset whose provenance or licence
 * has to be tracked separately from the MIT licence on the source.
 *
 * Outputs (all under examples/):
 *   media/devices/<variant>.webp   1200x1200  stylised device, one per colour variant
 *   media/features/<feature>.webp  1920x1080  abstract feature backgrounds
 *   media/video/motion.mp4         1280x720   short looping gradient (needs ffmpeg-static)
 *   example.glb                               procedural device body for the model demo
 *
 * Run with: npm run generate:assets
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import sharp from 'sharp'
import { mkdirSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const examples = join(root, 'examples')

/* ---------------------------------------------------------------- colours -- */

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t))
const lighten = (c, t) => mix(c, '#ffffff', t)
const darken = (c, t) => mix(c, '#000000', t)

/** One entry per colour variant in examples/example-product.json */
const VARIANTS = [
  { id: 'forest', color: '#2D5A4A' },
  { id: 'glacier', color: '#b4dfe0' },
  { id: 'ember', color: '#785165' },
  { id: 'graphite', color: '#7f8592' },
]

/** One entry per feature card that uses an image (or a video poster) */
const FEATURES = [
  { id: 'optics', from: '#11242c', to: '#2b5f6e', motif: 'rings' },
  { id: 'battery', from: '#13241e', to: '#2f5d4e', motif: 'bars' },
  { id: 'motion', from: '#1b1622', to: '#4a3566', motif: 'wave' },
  { id: 'materials', from: '#1a1c1e', to: '#4a5055', motif: 'grid' },
]

/* ------------------------------------------------------------------ SVGs -- */

/** A stylised device body: rounded slab, vertical sheen, contact shadow. */
const deviceSvg = (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${lighten(c, 0.3)}"/>
      <stop offset="42%" stop-color="${c}"/>
      <stop offset="100%" stop-color="${darken(c, 0.42)}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/>
      <stop offset="16%" stop-color="#ffffff" stop-opacity="0.07"/>
      <stop offset="62%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.12"/>
    </linearGradient>
    <radialGradient id="shadow">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="600" cy="1006" rx="248" ry="44" fill="url(#shadow)"/>
  <rect x="434" y="190" width="332" height="772" rx="94" fill="url(#body)"/>
  <rect x="434" y="190" width="332" height="772" rx="94" fill="url(#sheen)"/>
  <rect x="470" y="230" width="70" height="692" rx="35" fill="#ffffff" opacity="0.06"/>
  <rect x="540" y="286" width="120" height="6" rx="3" fill="${darken(c, 0.55)}" opacity="0.5"/>
  <circle cx="600" cy="884" r="25" fill="${darken(c, 0.6)}" opacity="0.45"/>
</svg>`

const motifs = {
  rings: Array.from({ length: 7 }, (_, i) =>
    `<circle cx="1360" cy="540" r="${140 + i * 92}" fill="none" stroke="#ffffff" stroke-opacity="${0.16 - i * 0.018}" stroke-width="2"/>`
  ).join(''),
  bars: Array.from({ length: 9 }, (_, i) =>
    `<rect x="${1040 + i * 88}" y="${540 - (60 + i * 34)}" width="46" height="${(60 + i * 34) * 2}" rx="23" fill="#ffffff" fill-opacity="${0.05 + i * 0.012}"/>`
  ).join(''),
  wave: Array.from({ length: 6 }, (_, i) =>
    `<path d="M0 ${430 + i * 46} C 420 ${330 + i * 46}, 900 ${560 + i * 46}, 1920 ${380 + i * 46}" fill="none" stroke="#ffffff" stroke-opacity="${0.2 - i * 0.026}" stroke-width="3"/>`
  ).join(''),
  grid: Array.from({ length: 13 }, (_, i) =>
    `<line x1="${900 + i * 82}" y1="0" x2="${700 + i * 82}" y2="1080" stroke="#ffffff" stroke-opacity="0.055" stroke-width="2"/>`
  ).join(''),
}

/** An abstract feature background — a two-stop field with one geometric motif. */
const featureSvg = ({ from, to, motif }) => `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="field" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.72" cy="0.38" r="0.62">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#field)"/>
  ${motifs[motif]}
  <rect width="1920" height="1080" fill="url(#glow)"/>
</svg>`

/* ------------------------------------------------------------------- GLB -- */

/**
 * Builds the model demo's GLB by hand rather than exporting from a scene.
 *
 * glTF is a documented container — a JSON chunk describing accessors into a
 * binary chunk — so writing it directly avoids pulling a 3D toolchain into the
 * build just to emit one extruded shape. Geometry is an extruded rounded
 * rectangle: a device body with smooth normals around the corners.
 */
function buildGlb({ width = 0.62, height = 1.3, depth = 0.17, radius = 0.1, seg = 10, color = [0.18, 0.35, 0.3] } = {}) {
  // Outline of the rounded rectangle, counter-clockwise in XY
  const outline = []
  const hw = width / 2 - radius
  const hh = height / 2 - radius
  const corners = [
    [hw, hh, 0],
    [-hw, hh, Math.PI / 2],
    [-hw, -hh, Math.PI],
    [hw, -hh, -Math.PI / 2],
  ]
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (Math.PI / 2) * (i / seg)
      outline.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)])
    }
  }
  const M = outline.length
  const z = depth / 2

  const pos = []
  const nrm = []
  const idx = []
  const push = (p, n) => {
    pos.push(p[0], p[1], p[2])
    nrm.push(n[0], n[1], n[2])
    return pos.length / 3 - 1
  }

  // Front and back caps as triangle fans around a centre vertex
  const frontCentre = push([0, 0, z], [0, 0, 1])
  const frontRing = outline.map(([x, y]) => push([x, y, z], [0, 0, 1]))
  const backCentre = push([0, 0, -z], [0, 0, -1])
  const backRing = outline.map(([x, y]) => push([x, y, -z], [0, 0, -1]))

  for (let i = 0; i < M; i++) {
    const j = (i + 1) % M
    idx.push(frontCentre, frontRing[i], frontRing[j])
    idx.push(backCentre, backRing[j], backRing[i])
  }

  // Side wall: its own vertices so the caps keep flat normals while the wall
  // stays smooth around the corners.
  const sideFront = []
  const sideBack = []
  for (let i = 0; i < M; i++) {
    const [px, py] = outline[(i - 1 + M) % M]
    const [nx, ny] = outline[(i + 1) % M]
    const tx = nx - px
    const ty = ny - py
    const len = Math.hypot(tx, ty) || 1
    const n = [ty / len, -tx / len, 0] // outward normal of a CCW outline
    const [x, y] = outline[i]
    sideFront.push(push([x, y, z], n))
    sideBack.push(push([x, y, -z], n))
  }
  for (let i = 0; i < M; i++) {
    const j = (i + 1) % M
    idx.push(sideFront[i], sideBack[i], sideBack[j])
    idx.push(sideFront[i], sideBack[j], sideFront[j])
  }

  const positions = new Float32Array(pos)
  const normals = new Float32Array(nrm)
  const indices = new Uint32Array(idx)

  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], positions[i + k])
      max[k] = Math.max(max[k], positions[i + k])
    }
  }

  const parts = [Buffer.from(positions.buffer), Buffer.from(normals.buffer), Buffer.from(indices.buffer)]
  const bin = Buffer.concat(parts)
  let offset = 0
  const views = parts.map((p) => {
    const v = { buffer: 0, byteOffset: offset, byteLength: p.length }
    offset += p.length
    return v
  })

  const json = {
    asset: { version: '2.0', generator: '@tolgainam/product-viewer demo asset generator' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'DeviceBody' }],
    meshes: [{ name: 'DeviceBody', primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
    materials: [
      {
        name: 'AnodisedShell',
        pbrMetallicRoughness: {
          baseColorFactor: [...color, 1],
          metallicFactor: 0.72,
          roughnessFactor: 0.34,
        },
      },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: positions.length / 3, type: 'VEC3', min, max },
      { bufferView: 1, componentType: 5126, count: normals.length / 3, type: 'VEC3' },
      { bufferView: 2, componentType: 5125, count: indices.length, type: 'SCALAR' },
    ],
    bufferViews: views,
    buffers: [{ byteLength: bin.length }],
  }

  // GLB chunks are 4-byte aligned: JSON pads with spaces, BIN pads with zeroes
  const pad = (buf, filler) => {
    const rem = buf.length % 4
    return rem === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - rem, filler)])
  }
  const jsonChunk = pad(Buffer.from(JSON.stringify(json), 'utf8'), 0x20)
  const binChunk = pad(bin, 0x00)

  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546c67, 0) // 'glTF'
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8)

  const chunkHeader = (len, type) => {
    const b = Buffer.alloc(8)
    b.writeUInt32LE(len, 0)
    b.writeUInt32LE(type, 4)
    return b
  }

  return Buffer.concat([
    header,
    chunkHeader(jsonChunk.length, 0x4e4f534a), // JSON
    jsonChunk,
    chunkHeader(binChunk.length, 0x004e4942), // BIN
    binChunk,
  ])
}

/* ----------------------------------------------------------------- video -- */

/**
 * ffmpeg-static is GPL, so it stays a devDependency and its binary never ships
 * inside the MIT tarball — only the MP4 it produces, which is not a derivative
 * of the encoder. Missing binary is a warning, not a failure: everything else
 * still regenerates.
 */
async function buildVideo(out) {
  let ffmpeg
  try {
    ffmpeg = (await import('ffmpeg-static')).default
  } catch {
    console.warn('  ! ffmpeg-static not installed — skipping motion.mp4 (npm i -D ffmpeg-static)')
    return false
  }
  const { execFileSync } = await import('node:child_process')
  execFileSync(
    ffmpeg,
    [
      '-y', '-loglevel', 'error',
      '-f', 'lavfi',
      '-i', 'gradients=s=1280x720:c0=0x14241f:c1=0x2f5d4e:c2=0x1b3b4a:n=3:speed=0.05:d=8',
      '-vf', 'format=yuv420p',
      '-c:v', 'libx264', '-crf', '30', '-preset', 'slow',
      '-movflags', '+faststart', '-an', '-t', '8',
      out,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  )
  return true
}

/* ------------------------------------------------------------------ main -- */

const kb = (p) => (statSync(p).size / 1024).toFixed(0) + ' KB'

mkdirSync(join(examples, 'media/devices'), { recursive: true })
mkdirSync(join(examples, 'media/features'), { recursive: true })
mkdirSync(join(examples, 'media/video'), { recursive: true })

console.log('devices')
for (const v of VARIANTS) {
  const out = join(examples, `media/devices/${v.id}.webp`)
  await sharp(Buffer.from(deviceSvg(v.color))).webp({ quality: 88 }).toFile(out)
  console.log(`  ${v.id}.webp  ${kb(out)}`)
}

console.log('features')
for (const f of FEATURES) {
  const out = join(examples, `media/features/${f.id}.webp`)
  await sharp(Buffer.from(featureSvg(f))).webp({ quality: 82 }).toFile(out)
  console.log(`  ${f.id}.webp  ${kb(out)}`)
}

console.log('model')
const glb = join(examples, 'example.glb')
writeFileSync(glb, buildGlb())
console.log(`  example.glb  ${kb(glb)}`)

console.log('video')
const mp4 = join(examples, 'media/video/motion.mp4')
if (await buildVideo(mp4)) console.log(`  motion.mp4  ${kb(mp4)}`)
