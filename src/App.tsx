import { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";
import { MarkersPlugin, type MarkerConfig } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/markers-plugin/index.css";
import "./App.css";

type PanoramaId = "main" | "mountains" | "palms";

const panoramas: Record<
  PanoramaId,
  { url: string; caption: string; next: PanoramaId; linkLabel: string }
> = {
  main: {
    url: "https://4nxohqbwyj.ufs.sh/f/YyQSRjcD452uLIiQnAawm07qKBDXMcsAaGYuJChOPZW134iH",
    caption: "Zdjęcie główne",
    next: "palms",
    linkLabel: "Przejdź do pokoju",
  },
  mountains: {
    url: `${import.meta.env.BASE_URL}moutains360.jpg`,
    caption: "Góry",
    next: "main",
    linkLabel: "Wróć do zdjęcia głównego",
  },
  palms: {
    url: "https://4nxohqbwyj.ufs.sh/f/YyQSRjcD452uBC3KUSQRoxpAWaTrizneghMDwIVfOkKEsGj9",
    caption: "Palmy",
    next: "mountains",
    linkLabel: "Przejdź do gór",
  },
};

function getPanoramaMarker(id: PanoramaId): MarkerConfig {
  const panorama = panoramas[id];
  return {
    id: `${id}-to-${panorama.next}`,
    html: `<span aria-hidden="true">➜</span><span>${panorama.linkLabel}</span>`,
    className: "walk-hotspot",
    position: { yaw: "0deg", pitch: "-10deg" },
  };
}

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const currentPanoramaRef = useRef<PanoramaId>("main");
  const switchingRef = useRef(false);
  const [currentPanorama, setCurrentPanorama] = useState<PanoramaId>("main");
  const [viewerReady, setViewerReady] = useState(false);
  const [switching, setSwitching] = useState(false);

  async function switchPanorama(target: PanoramaId) {
    const viewer = viewerRef.current;
    if (!viewer || switchingRef.current || target === currentPanoramaRef.current) {
      return;
    }

    switchingRef.current = true;
    setSwitching(true);
    const { url, caption } = panoramas[target];

    try {
      const changed = await viewer.setPanorama(
        url,
        {
          caption,
          transition: { effect: "fade", speed: 1000 },
        },
      );
      if (changed) {
        currentPanoramaRef.current = target;
        setCurrentPanorama(target);
        viewer
          .getPlugin<MarkersPlugin>(MarkersPlugin)
          .setMarkers([getPanoramaMarker(target)]);
      }
    } catch (error) {
      viewer.showError(
        `Nie udało się wczytać panoramy ${caption}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      switchingRef.current = false;
      setSwitching(false);
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Avoid starting an image request during StrictMode's setup/cleanup probe.
    const frame = requestAnimationFrame(() => {
      viewerRef.current = new Viewer({
        container,
        panorama: panoramas.main.url,
        caption: panoramas.main.caption,
        navbar: ["zoom", "move", "fullscreen"],
        plugins: [
          [
            MarkersPlugin,
            {
              markers: [getPanoramaMarker("main")],
            },
          ],
        ],
      });
      const markers = viewerRef.current.getPlugin<MarkersPlugin>(MarkersPlugin);
      markers.addEventListener("select-marker", () => {
        void switchPanorama(panoramas[currentPanoramaRef.current].next);
      });
      setViewerReady(true);
    });

    return () => {
      cancelAnimationFrame(frame);
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, []);

  return (
    <main className="tour">
      <div ref={containerRef} className="panorama" />
      <button
        className="panorama-switch"
        type="button"
        onClick={() =>
          void switchPanorama(
            panoramas[currentPanorama].next,
          )
        }
        disabled={!viewerReady || switching}
      >
        {switching
          ? "Wczytywanie…"
          : panoramas[currentPanorama].linkLabel}
      </button>
    </main>
  );
}

export default App;
