import { useEffect, useRef, useState } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import '@photo-sphere-viewer/core/index.css'
import './App.css'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const [showPalms, setShowPalms] = useState(false)
  const [viewerReady, setViewerReady] = useState(false)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Avoid starting an image request during StrictMode's setup/cleanup probe.
    const frame = requestAnimationFrame(() => {
      viewerRef.current = new Viewer({
        container,
        panorama: `${import.meta.env.BASE_URL}moutains360.jpg`,
        navbar: ['zoom', 'move', 'fullscreen'],
      })
      setViewerReady(true)
    })

    return () => {
      cancelAnimationFrame(frame)
      viewerRef.current?.destroy()
      viewerRef.current = null
    }
  }, [])

  async function switchPanorama() {
    const viewer = viewerRef.current
    if (!viewer || switching) return

    const nextShowPalms = !showPalms
    const panorama = nextShowPalms ? 'palms360.jpg' : 'moutains360.jpg'
    const caption = nextShowPalms ? 'Palmy' : 'Góry'

    setSwitching(true)
    try {
      const changed = await viewer.setPanorama(
        `${import.meta.env.BASE_URL}${panorama}`,
        {
          caption,
          transition: { effect: 'fade', speed: 1000 },
        },
      )
      if (changed) setShowPalms(nextShowPalms)
    } catch (error) {
      viewer.showError(
        `Nie udało się wczytać panoramy ${caption}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    } finally {
      setSwitching(false)
    }
  }

  return (
    <main className="tour">
      <div ref={containerRef} className="panorama" />
      <button
        className="panorama-switch"
        type="button"
        onClick={() => void switchPanorama()}
        disabled={!viewerReady || switching}
      >
        {switching
          ? 'Wczytywanie…'
          : showPalms
            ? 'Przejdź do gór'
            : 'Przejdź do palm'}
      </button>
    </main>
  )
}

export default App
