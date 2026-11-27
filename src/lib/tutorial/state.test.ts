import { describe, expect, it } from "vitest";
import { resolveStep } from "@/lib/tutorial/state";

describe("resolveStep", () => {
  it("returns null when nothing has been stored yet and not on the dashboard", () => {
    expect(resolveStep(null, 8, "/ingredients")).toBeNull();
  });

  it("starts a first-time visitor on the dashboard at step 0", () => {
    expect(resolveStep(null, 8, "/dashboard")).toBe(0);
  });

  it("returns null once the tutorial is marked done, regardless of page", () => {
    expect(resolveStep("done", 8, "/dashboard")).toBeNull();
  });

  it("returns null for the server snapshot (undefined) so SSR and first hydration match", () => {
    expect(resolveStep(undefined, 8, "/dashboard")).toBeNull();
  });

  it("resumes at the stored step index", () => {
    expect(resolveStep("3", 8, "/recipes")).toBe(3);
  });

  it("rejects an out-of-range stored index (stale after TUTORIAL_STEPS shrinks) and falls back to the dashboard rule", () => {
    expect(resolveStep("99", 8, "/dashboard")).toBe(0);
    expect(resolveStep("99", 8, "/recipes")).toBeNull();
  });

  it("rejects malformed stored values (never written by this app, but localStorage is shared/editable)", () => {
    expect(resolveStep("not-a-number", 8, "/dashboard")).toBe(0);
    expect(resolveStep("-1", 8, "/dashboard")).toBe(0);
    expect(resolveStep("1.5", 8, "/dashboard")).toBe(0);
  });

  it("accepts step 0 itself, not just truthy indices", () => {
    expect(resolveStep("0", 8, "/recipes")).toBe(0);
  });
});
