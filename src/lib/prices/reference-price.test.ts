import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizePriceDate, referencePriceUpdate } from "./reference-price";

afterEach(() => vi.useRealTimers());

describe("reference price provenance", () => {
  it.each(["20261102", "2026-11-02"])("normalizes provider date %s", (value) => {
    expect(normalizePriceDate(value)).toBe("2026-11-02");
  });

  it.each(["20260230", "2026-13-01", "2026-1102", "202611-02", "", "평년"])("rejects invalid observation date %s", (value) => {
    expect(() => normalizePriceDate(value)).toThrow();
  });

  it("keeps observation date separate from sync time and clears absent market", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-06T09:00:00Z"));
    expect(referencePriceUpdate({ amount: 12000, unit: "kg", source: "ekape", asOf: "20261102", grade: "1등급" })).toEqual({
      reference_price: 12000,
      reference_unit: "kg",
      price_source: "ekape",
      price_as_of: "2026-11-02",
      price_market: null,
      price_grade: "1등급",
      price_updated_at: "2026-11-06T09:00:00.000Z",
    });
  });

  it.each([0, -1, 1.5, Infinity, NaN])("rejects invalid price %s before a DB write", (amount) => {
    expect(() => referencePriceUpdate({ amount, unit: "kg", source: "kamis-perday", asOf: "20261102" })).toThrow();
  });
});
