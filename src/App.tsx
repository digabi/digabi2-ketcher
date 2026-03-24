import { useEffect, useRef } from 'react'
import { Editor, ButtonsConfig } from 'ketcher-react'
import { StandaloneStructServiceProvider } from 'ketcher-standalone'
import type { Ketcher } from 'ketcher-core'
import { webdavGet, webdavPut, webdavPropfind, webdavCreate } from './webdav'
import { getExporter } from './formats'
import 'ketcher-react/dist/index.css'

const structServiceProvider = new StandaloneStructServiceProvider()

function getFilename(): string | null {
  return new URLSearchParams(location.search).get('filename')
}

async function saveToWebDAV(ketcher: Ketcher, filename: string) {
  const exporter = getExporter(filename, ketcher)
  const content = await exporter()
  await webdavPut(filename, content)
}

export default function App() {
  const filename = getFilename()
  const ketcherRef = useRef<Ketcher | null>(null)
  // Ketcher's Editor calls onInit twice; guard to prevent duplicate setup and event handler registration
  const initializedRef = useRef(false)

  const onInit = (ketcher: Ketcher) => {
    ketcherRef.current = ketcher
    if (initializedRef.current || !filename) return
    initializedRef.current = true

    void (async () => {
      const status = await webdavPropfind(filename)
      if (status === 207) {
        const content = await webdavGet(filename)
        if (content) await ketcher.setMolecule(content)
      } else if (status === 404) {
        await webdavCreate(filename)
      }
    })()

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ketcher.eventBus.on('CUSTOM_BUTTON_PRESSED', (id: string) => {
      if (id === 'webdav-save') void saveToWebDAV(ketcher, filename)
    })
  }

  useEffect(() => {
    if (!filename) return

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        e.stopPropagation()
        if (ketcherRef.current) void saveToWebDAV(ketcherRef.current, filename)
      }
    }
    document.addEventListener('keydown', onKeyDown, { capture: true })

    const timer = setInterval(() => {
      if (ketcherRef.current) void saveToWebDAV(ketcherRef.current, filename)
    }, 10_000)

    return () => {
      document.removeEventListener('keydown', onKeyDown, { capture: true })
      clearInterval(timer)
      initializedRef.current = false
    }
  }, [filename])

  return (
    <Editor
      staticResourcesUrl=""
      structServiceProvider={structServiceProvider}
      onInit={onInit}
      disableMacromoleculesEditor
      errorHandler={(msg: string) => console.error('[Ketcher]', msg)}
      buttons={
        {
          save: { hidden: true },
          open: { hidden: true },
          'template-lib': { hidden: true },
          'functional-groups': { hidden: true }
        } as ButtonsConfig
      }
      customButtons={
        filename
          ? [
              {
                id: 'webdav-save',
                imageLink: '/save-icon.svg',
                title: 'Save'
              }
            ]
          : []
      }
    />
  )
}
