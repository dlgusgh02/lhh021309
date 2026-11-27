export interface Rect { top: number; left: number; width: number; height: number }
export type Placement = "top" | "bottom" | "left" | "right";

export function isVisibleRect(rect: Rect, viewport: { width: number; height: number }) {
  return rect.width > 0 && rect.height > 0 && rect.left < viewport.width && rect.top < viewport.height
    && rect.left + rect.width > 0 && rect.top + rect.height > 0;
}

/** Flip when possible; clamp the measured card inside the viewport. */
export function placeCard(rect: Rect | null, preferred: Placement, viewport: { width: number; height: number }, card: { width: number; height: number }) {
  const margin = 16;
  const gap = 14;
  const width = Math.min(card.width, Math.max(0, viewport.width - margin * 2));
  const height = Math.min(card.height, Math.max(0, viewport.height - margin * 2));
  const positions = rect ? {
    right: { left: rect.left + rect.width + gap, top: rect.top },
    left: { left: rect.left - width - gap, top: rect.top },
    bottom: { left: rect.left, top: rect.top + rect.height + gap },
    top: { left: rect.left, top: rect.top - height - gap },
  } : null;
  const fits = (p: { left: number; top: number }) => p.left >= margin && p.top >= margin
    && p.left + width <= viewport.width - margin && p.top + height <= viewport.height - margin;
  const candidates = positions ? [positions[preferred], ...Object.values(positions)] : [];
  const position = viewport.width < 768 || !rect
    ? { left: (viewport.width - width) / 2, top: (viewport.height - height) / 2 }
    : candidates.find(fits) ?? candidates[0];
  return {
    left: Math.max(margin, Math.min(position.left, viewport.width - width - margin)),
    top: Math.max(margin, Math.min(position.top, viewport.height - height - margin)),
  };
}
