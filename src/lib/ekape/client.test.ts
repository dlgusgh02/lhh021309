import { describe, expect, it } from "vitest";
import { pickReferencePrice, type EkapeConsumerPriceRow } from "@/lib/ekape/client";

function row(overrides: Partial<EkapeConsumerPriceRow> = {}): EkapeConsumerPriceRow {
  return {
    standYmd: "20261028",
    judgeKind: "4301",
    judgeKindNm: "소",
    itemCd: "22",
    itemNm: "등심",
    grdNm: "1등급",
    ntslPrc: 1000,
    maxPrc: 1200,
    minPrc: 800,
    unit: "원/100g",
    ...overrides,
  };
}

describe("pickReferencePrice", () => {
  it("returns null for an empty row list", () => {
    expect(pickReferencePrice([], "20261028")).toBeNull();
  });

  it("converts 원/100g to 원/kg (x10)", () => {
    const result = pickReferencePrice([row({ ntslPrc: 2885 })], "20261028");
    expect(result).toEqual({ pricePerKg: 28850, grade: "1등급", asOf: "20261028" });
  });

  it("excludes '평년' (historical baseline) rows even if otherwise matching", () => {
    const result = pickReferencePrice(
      [row({ standYmd: "평년", ntslPrc: 999999 }), row({ standYmd: "20261028", ntslPrc: 1000 })],
      "20261028",
    );
    expect(result?.pricePerKg).toBe(10000);
  });

  it("excludes rows for a different date than requested", () => {
    const result = pickReferencePrice([row({ standYmd: "20260101" })], "20261028");
    expect(result).toBeNull();
  });

  it("prefers 1등급 over 1+등급 when a cut has multiple beef grades", () => {
    const result = pickReferencePrice(
      [row({ grdNm: "1+등급", ntslPrc: 1398 }), row({ grdNm: "1등급", ntslPrc: 1175 })],
      "20261028",
    );
    expect(result).toEqual({ pricePerKg: 11750, grade: "1등급", asOf: "20261028" });
  });

  it("falls back to whatever grade is present when there's no 1등급 (e.g. pork's 구분없음)", () => {
    const result = pickReferencePrice([row({ grdNm: "구분없음", ntslPrc: 2885 })], "20261028");
    expect(result?.grade).toBe("구분없음");
  });

  it("excludes a zero/negative price row", () => {
    const result = pickReferencePrice(
      [row({ standYmd: "20261028", ntslPrc: 0 }), row({ standYmd: "20261028", ntslPrc: 1000, grdNm: "다른등급" })],
      "20261028",
    );
    expect(result?.pricePerKg).toBe(10000);
  });
});
