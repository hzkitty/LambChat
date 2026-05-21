import { createActiveRevealPreviewState } from "./revealPreviewState";
import { setActiveRevealPreviewState } from "./activeRevealPreviewStore";
import type { RevealPreviewRequest } from "./revealPreviewData";
import type { RevealPreviewOpenSource } from "./revealPreviewState";

export function openRevealPreview(
  preview: RevealPreviewRequest,
  source: RevealPreviewOpenSource,
  onOpenPreview?: (
    preview: RevealPreviewRequest,
    source?: RevealPreviewOpenSource,
  ) => boolean,
): boolean {
  if (onOpenPreview) {
    return onOpenPreview(preview, source);
  }

  if (source === "auto") {
    return false;
  }

  setActiveRevealPreviewState(createActiveRevealPreviewState(preview, source));
  return true;
}
