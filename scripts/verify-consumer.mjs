/**
 * Consumer verification — packs the package and builds it the way a recipient would.
 *
 * Type-checks, unit tests and a server render all passed once while a real consumer build
 * was broken: the 3D chunk imported three.js statically, so an app without those packages
 * could not resolve the module graph. Only building a throwaway app caught it, so that
 * build is now a check you can run.
 *
 * Two scenarios, both must pass:
 *   1. 2D only — install the package with no three.js at all and build. Guards the promise
 *      that 3D is optional.
 *   2. With 3D — install three and the fiber/drei peers, import the ./model entry, pass
 *      modelRenderer, and build.
 *
 * Usage: npm run verify:consumer
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const packageRoot = resolve(import.meta.dirname, '..')
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'pipe' })

const BASE_PEERS = ['react', 'react-dom', 'framer-motion']
const THREE_PEERS = ['three', '@react-three/fiber', '@react-three/drei']

const APP_2D = `import { createRoot } from 'react-dom/client'
import { ProductViewer } from '@tolgainam/product-viewer'
import data from '@tolgainam/product-viewer/examples/example-product.json'

createRoot(document.getElementById('root')).render(<ProductViewer data={data} />)
`

const APP_3D = `import { createRoot } from 'react-dom/client'
import { ProductViewer } from '@tolgainam/product-viewer'
import { ModelViewer } from '@tolgainam/product-viewer/model'
import data from '@tolgainam/product-viewer/examples/example-product.json'

createRoot(document.getElementById('root')).render(
  <ProductViewer data={data} modelRenderer={ModelViewer} />
)
`

const INDEX_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>consumer</title></head>
<body><div id="root"></div><script type="module" src="/main.jsx"></script></body></html>
`

function buildScenario({ name, tarball, extraPeers, app, expectThreeChunk }) {
  const dir = mkdtempSync(join(tmpdir(), 'pv-consumer-'))
  try {
    run('npm', ['init', '-y'], dir)
    run('npm', ['install', tarball, ...BASE_PEERS, ...extraPeers, '--legacy-peer-deps', '--no-audit', '--no-fund'], dir)

    // Prove the scenario's premise: 2D installs really have no three.js on disk
    const installedThree = readdirSync(join(dir, 'node_modules')).includes('three')
    if (!extraPeers.length && installedThree) throw new Error('three.js present in a 2D-only install')

    writeFileSync(join(dir, 'index.html'), INDEX_HTML)
    writeFileSync(join(dir, 'main.jsx'), app)
    const output = run('npx', ['--yes', 'vite@5', 'build', '--logLevel', 'warn'], dir)

    const chunks = readdirSync(join(dir, 'dist', 'assets'))
    const hasModelChunk = chunks.some((f) => f.includes('ModelScene'))
    if (expectThreeChunk && !hasModelChunk) throw new Error('expected a separate 3D chunk, found none')
    if (!expectThreeChunk && hasModelChunk) throw new Error('2D build pulled in the 3D chunk')

    console.log(`  PASS  ${name}${output.trim() ? `\n${output.trim().split('\n').map((l) => `        ${l}`).join('\n')}` : ''}`)
    return true
  } catch (error) {
    const detail = error.stderr || error.stdout || error.message
    console.error(`  FAIL  ${name}\n${String(detail).trim().split('\n').slice(-12).map((l) => `        ${l}`).join('\n')}`)
    return false
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

console.log('Packing…')
const tarballName = run('npm', ['pack'], packageRoot).trim().split('\n').pop()
const tarball = join(packageRoot, tarballName)
console.log(`Packed ${tarballName}\n`)

const results = [
  buildScenario({
    name: '2D only (no three.js installed) — build must succeed',
    tarball,
    extraPeers: [],
    app: APP_2D,
    expectThreeChunk: false,
  }),
  buildScenario({
    name: 'with 3D (./model entry + modelRenderer) — build must succeed and split the scene',
    tarball,
    extraPeers: THREE_PEERS,
    app: APP_3D,
    expectThreeChunk: true,
  }),
]

if (results.every(Boolean)) {
  console.log('\nConsumer verification passed.')
} else {
  console.error('\nConsumer verification FAILED.')
  process.exit(1)
}
