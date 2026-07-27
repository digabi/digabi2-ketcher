import { useEffect, useRef, useState, type RefObject } from 'react'
import { Editor, ButtonsConfig } from 'ketcher-react'
import { StandaloneStructServiceProvider } from 'ketcher-standalone'
import type { Ketcher } from 'ketcher-core'
import { webdavGet, webdavPut, webdavPropfind, webdavCreate } from './webdav'
import { getExporter } from './formats'
import 'ketcher-react/dist/index.css'

const structServiceProvider = new StandaloneStructServiceProvider()
const AUTOSAVE_DEBOUNCE_MS = 1_000

type KetcherChangeEvent = {
  operation?: string
}

type KetcherChangeSubscription = {
  handler: (event?: KetcherChangeEvent) => void
}

type KetcherEditorChangeApi = {
  subscribe: (eventName: 'change', handler: (event?: KetcherChangeEvent) => void) => unknown
  unsubscribe: (eventName: 'change', subscriber: KetcherChangeSubscription) => void
}

function getFilename(): string | null {
  return new URLSearchParams(location.search).get('filename')
}

async function saveToWebDAV(ketcher: Ketcher, filename: string) {
  const exporter = getExporter(filename, ketcher)
  const content = await exporter()
  await webdavPut(filename, content)
}

function clearAutosaveTimeout(autosaveTimeoutRef: RefObject<number | null>) {
  if (autosaveTimeoutRef.current !== null) {
    clearTimeout(autosaveTimeoutRef.current)
    autosaveTimeoutRef.current = null
  }
}

function getKetcherEditorChangeApi(ketcher: Ketcher): KetcherEditorChangeApi {
  return ketcher.editor
}

function unsubscribeFromChanges(ketcher: Ketcher, changeSubscription: KetcherChangeSubscription | null) {
  if (changeSubscription) {
    getKetcherEditorChangeApi(ketcher).unsubscribe('change', changeSubscription)
  }
}

function triggerSave(autosaveTimeoutRef: RefObject<number | null>, ketcher: Ketcher, filename: string) {
  clearAutosaveTimeout(autosaveTimeoutRef)
  void saveToWebDAV(ketcher, filename)
}

function scheduleAutosave(autosaveTimeoutRef: RefObject<number | null>, ketcher: Ketcher, filename: string) {
  clearAutosaveTimeout(autosaveTimeoutRef)
  autosaveTimeoutRef.current = window.setTimeout(() => {
    autosaveTimeoutRef.current = null
    void saveToWebDAV(ketcher, filename)
  }, AUTOSAVE_DEBOUNCE_MS)
}

function subscribeToChanges(
  ketcher: Ketcher,
  onChange: (event?: KetcherChangeEvent) => void
): KetcherChangeSubscription {
  return getKetcherEditorChangeApi(ketcher).subscribe('change', onChange) as KetcherChangeSubscription
}

export default function App() {
  const filename = getFilename()
  const [ketcher, setKetcher] = useState<Ketcher | null>(null)
  const autosaveTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!ketcher || !filename) return

    let cancelled = false
    let changeSubscription: KetcherChangeSubscription | null = null

    const onCustomButtonPressed = (id: string) => {
      if (id === 'webdav-save') triggerSave(autosaveTimeoutRef, ketcher, filename)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        e.stopPropagation()
        triggerSave(autosaveTimeoutRef, ketcher, filename)
      }
    }

    ketcher.eventBus.on('CUSTOM_BUTTON_PRESSED', onCustomButtonPressed)
    document.addEventListener('keydown', onKeyDown, { capture: true })

    void (async () => {
      const status = await webdavPropfind(filename)
      if (cancelled) return

      if (status === 207) {
        const content = await webdavGet(filename)
        if (cancelled) return

        if (content) await ketcher.setMolecule(content)
      } else if (status === 404) {
        await webdavCreate(filename)
      }

      if (cancelled) return

      changeSubscription = subscribeToChanges(ketcher, (event?: KetcherChangeEvent) => {
        if (event?.operation === 'Load canvas') return
        scheduleAutosave(autosaveTimeoutRef, ketcher, filename)
      })
    })()

    return () => {
      cancelled = true
      ketcher.eventBus.off('CUSTOM_BUTTON_PRESSED', onCustomButtonPressed)
      document.removeEventListener('keydown', onKeyDown, { capture: true })
      clearAutosaveTimeout(autosaveTimeoutRef)
      unsubscribeFromChanges(ketcher, changeSubscription)
    }
  }, [filename, ketcher])

  return (
    <Editor
      staticResourcesUrl=""
      structServiceProvider={structServiceProvider}
      onInit={setKetcher}
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
