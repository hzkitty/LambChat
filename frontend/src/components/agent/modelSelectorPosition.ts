interface TriggerRect {
  top: number;
  bottom: number;
  left: number;
}

interface DropdownStyleOptions {
  triggerRect: TriggerRect;
  viewportWidth: number;
  viewportHeight: number;
  dropdownWidth?: number;
  gap?: number;
  viewportPadding?: number;
}

interface DropdownStyle {
  top: number;
  left: number;
  maxHeight: number;
}

export function getModelSelectorDropdownStyle({
  triggerRect,
  viewportWidth,
  viewportHeight,
  dropdownWidth = 288,
  gap = 8,
  viewportPadding = 8,
}: DropdownStyleOptions): DropdownStyle {
  const top = triggerRect.bottom + gap;
  const maxHeight = Math.max(0, viewportHeight - top - viewportPadding);
  const maxLeft = viewportWidth - dropdownWidth - viewportPadding;
  const left = Math.max(
    viewportPadding,
    Math.min(triggerRect.left, Math.max(viewportPadding, maxLeft)),
  );

  return { top, left, maxHeight };
}
