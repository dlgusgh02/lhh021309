import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  service: vi.fn(), auctionRows: vi.fn(), auctionPick: vi.fn(), ekape: vi.fn(), perday: vi.fn(), poultry: vi.fn(),
}));
vi.mock("@/lib/supabase/service-role", () => ({ createServiceRoleClient: mocks.service }));
vi.mock("@/lib/kamis/client", () => ({ fetchMarketPriceRows: mocks.auctionRows, pickReferencePrice: mocks.auctionPick }));
vi.mock("@/lib/ekape/client", () => ({ fetchLatestConsumerPrice: mocks.ekape }));
vi.mock("@/lib/kamis-perday/client", () => ({ fetchLatestPerDayPrice: mocks.perday }));
vi.mock("@/lib/ekape-poultry/client", () => ({ fetchLatestEggPrice: mocks.poultry }));
vi.mock("@/lib/kamis/item-map", () => ({ KAMIS_ITEM_MAP: [{ name: "양파", odcloudName: "양파" }] }));
vi.mock("@/lib/ekape/item-map", () => ({ EKAPE_ITEM_MAP: [{ name: "소고기(등심)", judgeKind: "4301", itemCd: "22" }] }));
vi.mock("@/lib/kamis-perday/item-map", () => ({ KAMIS_PERDAY_ITEM_MAP: [{ name: "쌀", ctgryCd: "100", itemCd: "111" }] }));

import { GET as auction } from "@/app/api/cron/sync-kamis-prices/route";
import { GET as ekape } from "@/app/api/cron/sync-ekape-prices/route";
import { GET as perday } from "@/app/api/cron/sync-kamis-perday-prices/route";
import { GET as poultry } from "@/app/api/cron/sync-ekape-poultry-prices/route";
import { makeSupabaseWithQueue } from "@/lib/test-utils/supabase-mock";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CRON_SECRET", "test-secret");
  mocks.auctionRows.mockResolvedValue([]);
  mocks.auctionPick.mockReturnValue({ price: 1000, unit: "kg", asOf: "2026-11-02" });
  mocks.ekape.mockResolvedValue({ pricePerKg: 1000, asOf: "20261102", grade: "1등급" });
  mocks.perday.mockResolvedValue({ pricePerKg: 1000, asOf: "20261102", grade: "중품", market: "양곡도매" });
  mocks.poultry.mockResolvedValue({ pricePerKg: 1000, asOf: "20261102" });
});
afterEach(() => vi.unstubAllEnvs());

const request = (authorized = true) => new NextRequest("http://localhost/api/cron/test", {
  headers: authorized ? { authorization: "Bearer test-secret" } : {},
});

describe.each([
  { source: "kamis-auction", handler: auction, market: "가락", grade: "중" },
  { source: "ekape", handler: ekape, market: null, grade: "1등급" },
  { source: "kamis-perday", handler: perday, market: "양곡도매", grade: "중품" },
  { source: "ekape-poultry", handler: poultry, market: null, grade: null },
])("$source sync", ({ source, handler, market, grade }) => {
  it("rejects unauthorized calls before accessing providers or DB", async () => {
    expect((await handler(request(false))).status).toBe(401);
    expect(mocks.service).not.toHaveBeenCalled();
    expect(mocks.auctionRows).not.toHaveBeenCalled();
    expect(mocks.ekape).not.toHaveBeenCalled();
    expect(mocks.perday).not.toHaveBeenCalled();
    expect(mocks.poultry).not.toHaveBeenCalled();
  });

  it("stores price and provenance in one update", async () => {
    const db = makeSupabaseWithQueue([{ data: [{ id: "master-1" }], error: null }]);
    mocks.service.mockReturnValue(db);
    expect(await (await handler(request())).json()).toMatchObject({ synced: 1, errors: [] });
    expect(db.from.mock.results[0].value.update).toHaveBeenCalledWith(expect.objectContaining({
      reference_price: 1000, reference_unit: "kg", price_source: source,
      price_as_of: "2026-11-02", price_market: market, price_grade: grade,
    }));
  });

  it("does not count a missing catalog row as a successful sync", async () => {
    mocks.service.mockReturnValue(makeSupabaseWithQueue([{ data: [], error: null }]));
    const result = await (await handler(request())).json();
    expect(result.synced).toBe(0);
    expect(result.errors).toHaveLength(1);
  });

  it("reports a schema/write failure without claiming success", async () => {
    mocks.service.mockReturnValue(makeSupabaseWithQueue([{ data: null, error: { message: "column price_source does not exist" } }]));
    const result = await (await handler(request())).json();
    expect(result.synced).toBe(0);
    expect(result.errors[0]).toContain("column price_source does not exist");
  });
});
