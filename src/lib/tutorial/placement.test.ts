import { describe, expect, it } from "vitest";
import { isVisibleRect, placeCard } from "@/lib/tutorial/placement";

const viewport = { width: 1280, height: 800 };

describe("isVisibleRect", () => {
  it("is visible when fully inside the viewport", () => {
    expect(isVisibleRect({ top: 100, left: 100, width: 50, height: 50 }, viewport)).toBe(true);
  });

  it("is not visible with zero width or height (display: none target, e.g. the mobile-only nav button on desktop)", () => {
    expect(isVisibleRect({ top: 100, left: 100, width: 0, height: 50 }, viewport)).toBe(false);
    expect(isVisibleRect({ top: 100, left: 100, width: 50, height: 0 }, viewport)).toBe(false);
  });

  it("is not visible when entirely past the right/bottom edge", () => {
    expect(isVisibleRect({ top: 100, left: 2000, width: 50, height: 50 }, viewport)).toBe(false);
    expect(isVisibleRect({ top: 2000, left: 100, width: 50, height: 50 }, viewport)).toBe(false);
  });

  it("is not visible when entirely past the left/top edge (scrolled out of view)", () => {
    expect(isVisibleRect({ top: 100, left: -200, width: 50, height: 50 }, viewport)).toBe(false);
    expect(isVisibleRect({ top: -200, left: 100, width: 50, height: 50 }, viewport)).toBe(false);
  });

  it("is visible when only partially on screen", () => {
    expect(isVisibleRect({ top: -10, left: -10, width: 50, height: 50 }, viewport)).toBe(true);
  });
});

describe("placeCard", () => {
  const card = { width: 300, height: 150 };

  it("centers the card when there is no target rect (centered intro/outro steps)", () => {
    const result = placeCard(null, "bottom", viewport, card);
    expect(result).toEqual({ left: (viewport.width - card.width) / 2, top: (viewport.height - card.height) / 2 });
  });

  it("always centers on narrow (mobile) viewports, even with a target rect", () => {
    const rect = { top: 100, left: 20, width: 40, height: 40 };
    const result = placeCard(rect, "right", { width: 375, height: 700 }, card);
    expect(result.left).toBe((375 - Math.min(card.width, 375 - 32)) / 2);
  });

  it("places the card to the preferred side when it fits", () => {
    const rect = { top: 300, left: 300, width: 100, height: 40 };
    const result = placeCard(rect, "right", viewport, card);
    expect(result).toEqual({ left: 300 + 100 + 14, top: 300 });
  });

  it("flips to the opposite side when the preferred side would overflow the viewport", () => {
    // Target hugs the right edge — "right" placement would push the card off-screen, so it must flip to "left".
    const rect = { top: 300, left: viewport.width - 60, width: 40, height: 40 };
    const result = placeCard(rect, "right", viewport, card);
    expect(result.left).toBe(viewport.width - 60 - card.width - 14);
  });

  it("clamps the final position inside the viewport even when no placement fits cleanly", () => {
    // Target in the corner — every side overflows somewhere; the result must still stay fully on-screen.
    const rect = { top: 10, left: 10, width: 20, height: 20 };
    const result = placeCard(rect, "top", viewport, card);
    expect(result.top).toBeGreaterThanOrEqual(16);
    expect(result.left).toBeGreaterThanOrEqual(16);
    expect(result.left + card.width).toBeLessThanOrEqual(viewport.width - 16 + 1);
  });

  it("shrinks the card to fit a viewport smaller than the card itself", () => {
    const result = placeCard(null, "bottom", { width: 200, height: 150 }, card);
    // width - margin*2 = 200 - 32 = 168
    expect(result.left).toBe((200 - 168) / 2);
  });
});
