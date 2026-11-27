import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPerDayRows, pickReferencePrice, type KamisPerDayRow } from "@/lib/kamis-perday/client";

function row(overrides: Partial<KamisPerDayRow> = {}): KamisPerDayRow {
  return {
    exmn_ymd: "20261102",
    ctgry_cd: "600",
    ctgry_nm: "수산물",
    item_cd: "613",
    item_nm: "갈치",
    grd_nm: "中",
    mrkt_nm: "가락도매",
    unit: "kg",
    unit_sz: "1",
    exmn_dd_prc: "24500",
    ...overrides,
  };
}

describe("pickReferencePrice", () => {
  it("recognizes 中 when competing with other markets", () => {
    expect(pickReferencePrice([row({ mrkt_nm: "경동", exmn_dd_prc: "999" }), row()])?.market).toBe("가락도매");
  });

  it("uses a newer observation before an older preferred market", () => {
    expect(pickReferencePrice([row({ exmn_ymd: "20261101", grd_nm: "중품" }), row({ mrkt_nm: "경동" })])?.asOf).toBe("20261102");
  });

  it("rejects infinite numbers", () => {
    expect(pickReferencePrice([row({ exmn_dd_prc: "Infinity" }), row({ unit_sz: "Infinity" })])).toBeNull();
  });
  it("returns null for an empty row list", () => {
    expect(pickReferencePrice([])).toBeNull();
  });

  it("converts price by unit_sz to a per-kg price", () => {
    const result = pickReferencePrice([row({ unit_sz: "10", exmn_dd_prc: "61600" })]);
    expect(result).toEqual({ pricePerKg: 6160, grade: "中", market: "가락도매", asOf: "20261102" });
  });

  it("excludes non-kg units (마리/손/g) entirely rather than mixing in inconsistent conversions", () => {
    const result = pickReferencePrice([
      row({ unit: "마리", unit_sz: "1", exmn_dd_prc: "999999" }),
      row({ unit: "kg", unit_sz: "1", exmn_dd_prc: "24500" }),
    ]);
    expect(result?.pricePerKg).toBe(24500);
  });

  it("prefers a 가락 market row with a middle grade over other markets/grades", () => {
    const result = pickReferencePrice([
      row({ mrkt_nm: "경동", grd_nm: "상품", exmn_dd_prc: "99999", unit_sz: "1" }),
      row({ mrkt_nm: "가락도매", grd_nm: "중품", exmn_dd_prc: "14100", unit_sz: "1" }),
    ]);
    expect(result).toEqual({ pricePerKg: 14100, grade: "중품", market: "가락도매", asOf: "20261102" });
  });

  it("matches '중' as a substring so 중, 중품, 중멸 all count as the middle grade", () => {
    const result = pickReferencePrice([row({ mrkt_nm: "가락도매", grd_nm: "중멸", exmn_dd_prc: "14300", unit_sz: "2" })]);
    expect(result?.pricePerKg).toBe(7150);
  });

  it("falls back to any kg row when no 가락+middle-grade row exists (e.g. 쌀's wholesale anchor is 양곡도매)", () => {
    const result = pickReferencePrice([row({ mrkt_nm: "양곡도매", grd_nm: "중품", item_nm: "쌀", exmn_dd_prc: "53500", unit_sz: "20" })]);
    expect(result).toEqual({ pricePerKg: 2675, grade: "중품", market: "양곡도매", asOf: "20261102" });
  });

  it("picks the most recent date among equally-preferred rows", () => {
    const result = pickReferencePrice([
      row({ exmn_ymd: "20261101", exmn_dd_prc: "20000", unit_sz: "1" }),
      row({ exmn_ymd: "20261102", exmn_dd_prc: "24500", unit_sz: "1" }),
    ]);
    expect(result?.asOf).toBe("20261102");
  });

  it("excludes a zero price or zero unit_sz row", () => {
    const result = pickReferencePrice([
      row({ exmn_dd_prc: "0", unit_sz: "1" }),
      row({ exmn_dd_prc: "24500", unit_sz: "0" }),
    ]);
    expect(result).toBeNull();
  });
});

describe("fetchPerDayRows", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("fetches every page and preserves encoded filters", async () => {
    vi.stubEnv("KAMIS_ODCLOUD_KEY", "test-key");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ response: { header: { resultCode: "0" }, body: { totalCount: 2, items: { item: row() } } } }))
      .mockResolvedValueOnce(Response.json({ response: { header: { resultCode: "0" }, body: { totalCount: 2, items: { item: [row()] } } } }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchPerDayRows("600", "613")).toHaveLength(2);
    const url = new URL(fetchMock.mock.calls[1][0]);
    expect(url.searchParams.get("pageNo")).toBe("2");
    expect(url.searchParams.get("cond[item_cd::EQ]")).toBe("613");
  });

  it("reports gateway errors", async () => {
    vi.stubEnv("KAMIS_ODCLOUD_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ response: { header: { resultCode: "30", resultMsg: "denied" } } })));
    await expect(fetchPerDayRows("600", "613")).rejects.toThrow("resultCode 30");
  });
});
