import { once } from 'node:events'
import fs from 'node:fs'
import fsP from 'node:fs/promises'
import path from 'node:path'
import esbuild from 'esbuild'

const outdir = 'dist'
const pubdir = 'public'
const entryPoint = 'src/main.tsx'

const define = {
  global: 'globalThis',
  'process.env': '{}',
  'window.top': 'window'
}

if (process.argv[2] === 'serve') {
  await serve()
} else {
  await build()
}

async function build() {
  const start = performance.now()
  await fsP.rm(path.join(outdir), { recursive: true, force: true })
  await esbuild.build({
    entryPoints: [entryPoint],
    outdir,
    bundle: true,
    minify: true,
    define
  })
  await fsP.cp(pubdir, outdir, { recursive: true })
  console.log(`Wrote build to ${outdir} in ${Math.ceil(performance.now() - start)}ms`)
}

async function serve() {
  const host = 'localhost'
  const port = 5173

  const copyPubdir = () =>
    fs.cp(pubdir, outdir, { recursive: true, force: true }, e => e && console.error(`Error copying ${pubdir}`, e))
  const pubdirWatcher = fs.watch(pubdir, { persistent: true, recursive: true }, copyPubdir)
  copyPubdir()

  const context = await esbuild.context({
    entryPoints: [entryPoint],
    outdir,
    bundle: true,
    sourcemap: 'inline',
    define
  })
  await context.serve({ fallback: 'index.html', servedir: outdir, host, port })
  console.log(`Dev server listening on http://${host}:${port}`)

  await once(pubdirWatcher, 'close')
}
