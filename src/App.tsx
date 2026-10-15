import { useEffect, useRef } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";
import { MarkersPlugin, type MarkerConfig } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/markers-plugin/index.css";
import "./App.css";

type PanoramaId = "mountains" | "palms";

const panoramaFiles: Record<PanoramaId, string> = {
  mountains: "moutains360.jpg",
  palms: "palms360.jpg",
};

const mountainMarker: MarkerConfig = {
  id: "mountains-to-palms",
  html: '<span aria-hidden="true">➜</span><span>Przejdź do palm</span>',
  className: "walk-hotspot",
  position: { yaw: "0deg", pitch: "-10deg" },
};

const palmsMarker: MarkerConfig = {
  id: "palms-to-mountains",
  html: '<span aria-hidden="true">➜</span><span>Wróć w góry</span>',
  className: "walk-hotspot",
  position: { yaw: "0deg", pitch: "-10deg" },
};

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const currentPanoramaRef = useRef<PanoramaId>("mountains");
  const switchingRef = useRef(false);

  async function switchPanorama(target: PanoramaId) {
    const viewer = viewerRef.current;
    if (!viewer || switchingRef.current || target === currentPanoramaRef.current) {
      return;
    }

    switchingRef.current = true;
    const caption = target === "palms" ? "Palmy" : "Góry";

    try {
      const changed = await viewer.setPanorama(
        `${import.meta.env.BASE_URL}${panoramaFiles[target]}`,
        {
          caption,
          transition: { effect: "fade", speed: 1000 },
        },
      );
      if (changed) {
        currentPanoramaRef.current = target;
        viewer
          .getPlugin<MarkersPlugin>(MarkersPlugin)
          .setMarkers([target === "palms" ? palmsMarker : mountainMarker]);
      }
    } catch (error) {
      viewer.showError(
        `Nie udało się wczytać panoramy ${caption}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      switchingRef.current = false;
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Avoid starting an image request during StrictMode's setup/cleanup probe.
    const frame = requestAnimationFrame(() => {
      viewerRef.current = new Viewer({
        container,
        panorama: `${import.meta.env.BASE_URL}${panoramaFiles.mountains}`,
        navbar: ["zoom", "move", "fullscreen"],
        plugins: [
          [
            MarkersPlugin,
            {
              markers: [mountainMarker],
            },
          ],
        ],
      });
      const markers = viewerRef.current.getPlugin<MarkersPlugin>(MarkersPlugin);
      markers.addEventListener("select-marker", (event) => {
        void switchPanorama(event.marker.id === "mountains-to-palms" ? "palms" : "mountains");
      });
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
    </main>
  );
}

export default App;
