import { useEffect, useState } from "react";
import { getFullUrl } from "../../../services/api";

/**
 * Renders a small SVG thumbnail preview of an excalidraw file on a file card.
 * Fetches JSON from URL, exports to SVG via @excalidraw/excalidraw, renders inline.
 * Used by FileCardPreview for excalidraw file cards.
 */
export function ExcalidrawCardPreview({ url }: { url: string }) {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    const fullUrl = getFullUrl(url) ?? url;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(fullUrl);
        if (!res.ok || cancelled) return;
        const data = await res.text();
        if (cancelled) return;

        const parsed = JSON.parse(data);
        const elements = parsed.elements || parsed;
        if (!Array.isArray(elements)) return;

        // Lazy-load exportToSvg (shares the same module cache as ExcalidrawPreview)
        const { exportToSvg } = await import("@excalidraw/excalidraw");
        if (cancelled) return;

        const svg = await exportToSvg({
          elements,
          appState: {
            ...(parsed.appState || {}),
            exportWithDarkMode: false,
          },
        });

        const svgString = new XMLSerializer().serializeToString(svg);
        if (!cancelled) setSvgContent(svgString);
      } catch {
        // Silent fail — card will just show the fallback cover
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!svgContent) return null;

  return (
    <div className="h-full w-full overflow-hidden bg-white dark:bg-stone-900">
      <div
        className="h-full w-full [&>svg]:h-full [&>svg]:w-full [&>svg]:object-contain"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}
