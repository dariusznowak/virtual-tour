import { useEffect, useRef } from 'react'
import { Viewer } from '@photo-sphere-viewer/core'
import '@photo-sphere-viewer/core/index.css'
import './App.css'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let viewer: Viewer | undefined

    // Avoid starting an image request during StrictMode's setup/cleanup probe.
    const frame = requestAnimationFrame(() => {
      viewer = new Viewer({
        container,
        panorama: `${import.meta.env.BASE_URL}moutains360.jpg`,
        navbar: ['zoom', 'move', 'fullscreen'],
      })
    })

    return () => {
      cancelAnimationFrame(frame)
      viewer?.destroy()
    }
  }, [])

  return <div ref={containerRef} className="panorama" />
}

export default App
