import type { CanvasElementData } from "@/lib/canvas/schema";
import { CanvasElementView } from "./CanvasElementView";

// A fixed-height, fluid-width box holding freely-placed elements —
// used both appended below the structured page (canvasMode "layer")
// and as the entire page body (canvasMode "replace"). See
// ThemeConfig.canvasMode in lib/theme/schema.ts.
export function CanvasLayer({ elements, heightPx }: { elements: CanvasElementData[]; heightPx: number }) {
  return (
    <div style={{ position: "relative", width: "100%", height: heightPx }}>
      {elements.map((element) => (
        <CanvasElementView element={element} key={element.id} />
      ))}
    </div>
  );
}
