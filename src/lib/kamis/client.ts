/**
 * Client for "한국농수산식품유통공사_공판장 가격 관련 정보" — the wholesale
 * auction market price dataset, accessed through data.go.kr's odcloud.kr
 * gateway (NOT KAMIS's own kamis.or.kr API — that requires a separate,
 * different application; this project only has an approved key for this
 * odcloud dataset). Requires `KAMIS_ODCLOUD_KEY` ("일반 인증키" from the
 * data.go.kr application page for this dataset).
 *
 * Coverage note (verified live 2026-09-11): this dataset only covers fresh
 * produce sold through auction wholesale markets (가락시장 등) — no meat,
 * dairy, seafood, grain, or sauces/seasonings. Matching is by exact string
 * in the `품목` field, which doesn't always match our ingredient names 1:1
 * (e.g. no "대파" row exists — only "실파"/"쪽파", which are different
 * products, so they're intentionally NOT auto-substituted). See
 * item-map.ts for which of our seeded ingredients have a verified match.
 *
 * Operational gotcha: data.go.kr republishes this dataset periodically
 * under a new UDDI path rather than keeping one permanently-live endpoint
 * (this one's Swagger doc labels it "as of 2026-07-31"). If requests start
 * returning zero rows for everything, check the dataset's page on
 * data.go.kr for a fresher UDDI and update ODCLOUD_ENDPOINT below.
 */

const ODCLOUD_ENDPOINT =
  "https://api.odcloud.kr/api/15134477/v1/uddi:7b8bc4f6-8555-4ea7-9d52-dbd2a2d7d817";

export interface OdcloudMarketPriceRow {
  일자: string;
  시장명: string;
  품목: string;
  단위: string;
  등급: string;
  평균가격: number;
  전일평균가격: number;
  전년가격: number;
}

interface OdcloudResponse {
  page: number;
  perPage: number;
  totalCount: number;
  currentCount: number;
  matchCount: number;
  data: OdcloudMarketPriceRow[];
}

export class KamisApiError extends Error {}

function requireEnv(): string {
  const value = process.env.KAMIS_ODCLOUD_KEY;
  if (!value) throw new KamisApiError("KAMIS_ODCLOUD_KEY is not set — the price sync cannot run without it.");
  return value;
}

/**
 * Fetches every row for one exact 품목 (item) name, most recent first isn't
 * guaranteed by the API so callers should sort — see pickReferencePricePerKg.
 */
export async function fetchMarketPriceRows(itemName: string, perPage = 500): Promise<OdcloudMarketPriceRow[]> {
  // `cond[품목::EQ]` must be sent as a literal `key=value` pair with EACH side
  // percent-encoded separately — encoding the whole "key=value" string as one
  // unit (e.g. via a single encodeURIComponent call) also escapes the `=`
  // and the server silently fails to parse the filter.
  const condKey = encodeURIComponent("cond[품목::EQ]");
  const condValue = encodeURIComponent(itemName);
  const params = new URLSearchParams({ page: "1", perPage: String(perPage), returnType: "JSON" });

  const res = await fetch(`${ODCLOUD_ENDPOINT}?${params.toString()}&${condKey}=${condValue}`, {
    headers: { Authorization: `Infuser ${requireEnv()}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new KamisApiError(`odcloud request failed with status ${res.status} for item "${itemName}"`);
  }

  const data = (await res.json()) as OdcloudResponse;
  return data.data ?? [];
}

/** "10키로망대" -> 10, "1키로" -> 1. Returns null for non-weight units (e.g. "50개") we can't convert to a per-kg price. */
export function parseKiloUnit(unit: string): number | null {
  const match = unit.match(/^(\d+)\s*키로/);
  return match ? Number(match[1]) : null;
}

export interface ReferencePrice {
  price: number;
  /** The unit the price is FOR — either "kg" (converted) or the exact 단위 string matched (e.g. "50개", "100속"). */
  unit: string;
  asOf: string;
}

/**
 * Picks one representative row to use as the reference price: 가락 market
 * (the largest, most liquid auction market), 중 grade (the typical/middle
 * grade, not premium or reject), a positive price, and the most recent 일자
 * among what's left.
 *
 * Not every item is sold by weight (깻잎 comes in "100속" bundles, 오이 in
 * "50개" counts, not "키로") — pass `unit` to match that exact 단위 string
 * as-is (price is NOT converted, it's per that literal unit). Omit it to
 * require a weight-based (키로) unit and get a price normalized per kg.
 */
export function pickReferencePrice(rows: OdcloudMarketPriceRow[], unit?: string): ReferencePrice | null {
  const base = rows.filter((r) => r.시장명 === "가락" && r.등급 === "중" && r.평균가격 > 0);

  if (unit) {
    const top = base.filter((r) => r.단위 === unit).sort((a, b) => b.일자.localeCompare(a.일자))[0];
    return top ? { price: top.평균가격, unit, asOf: top.일자 } : null;
  }

  const top = base
    .map((r) => ({ row: r, kg: parseKiloUnit(r.단위) }))
    .filter((c): c is { row: OdcloudMarketPriceRow; kg: number } => c.kg !== null)
    .sort((a, b) => b.row.일자.localeCompare(a.row.일자))[0];

  return top ? { price: Math.round(top.row.평균가격 / top.kg), unit: "kg", asOf: top.row.일자 } : null;
}
