/**
 * Thin client for the KAMIS (농산물유통정보) Open-API "일별 부류별 도소매가격"
 * endpoint. Requires `KAMIS_CERT_KEY` / `KAMIS_CERT_ID` — issued by KAMIS
 * after signing up and applying for API access at kamis.or.kr (see
 * item-map.ts for the full context / current status).
 *
 * NOTE: field names below (`condition`, `item_name`, `price`, ...) are
 * documented by KAMIS but have not been verified against a live response in
 * this codebase yet — no API key was available while this was written.
 * Re-check the shape against a real response before relying on it in prod.
 */

const KAMIS_BASE_URL = "https://www.kamis.or.kr/service/price/xml.do";

export interface KamisDailyPriceItem {
  item_name: string;
  item_code: string;
  kind_name: string;
  kind_code: string;
  unit: string;
  /** KRW. KAMIS returns this as a comma-formatted string, e.g. "1,200". */
  price: string;
  county_name: string;
  category_code: string;
}

interface KamisDailyPriceResponse {
  condition: unknown;
  price: KamisDailyPriceItem[] | { error_code: string; error_message?: string };
}

export class KamisApiError extends Error {}

function requireEnv(name: "KAMIS_CERT_KEY" | "KAMIS_CERT_ID"): string {
  const value = process.env[name];
  if (!value) throw new KamisApiError(`${name} is not set — KAMIS sync cannot run without it.`);
  return value;
}

/**
 * Fetches one category's daily retail/wholesale prices for a given date.
 * @param categoryCode KAMIS `p_item_category_code` (부류코드), e.g. "200" for 채소류.
 * @param regday Date as YYYY-MM-DD; defaults to today.
 */
export async function fetchDailyPricesByCategory(
  categoryCode: string,
  regday: string = new Date().toISOString().slice(0, 10),
): Promise<KamisDailyPriceItem[]> {
  const params = new URLSearchParams({
    action: "dailyPriceByCategoryList",
    p_product_cls_code: "01", // 01 = 소매(retail); 02 = 도매(wholesale) — verified against KAMIS's PeriodProductList param docs
    p_item_category_code: categoryCode,
    p_country_code: "1101", // 서울 — used as the national reference price
    p_regday: regday,
    p_convert_kg_yn: "N",
    p_cert_key: requireEnv("KAMIS_CERT_KEY"),
    p_cert_id: requireEnv("KAMIS_CERT_ID"),
    p_returntype: "json",
  });

  const res = await fetch(`${KAMIS_BASE_URL}?${params.toString()}`, {
    // KAMIS data changes daily at most; avoid re-fetching on every request.
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new KamisApiError(`KAMIS API request failed with status ${res.status}`);
  }

  const data = (await res.json()) as KamisDailyPriceResponse;

  if (!Array.isArray(data.price)) {
    throw new KamisApiError(
      `KAMIS API returned an error for category ${categoryCode}: ${JSON.stringify(data.price)}`,
    );
  }

  return data.price;
}

/** "1,200" -> 1200. Returns null if the value can't be parsed as a price. */
export function parseKamisPrice(raw: string): number | null {
  const parsed = Number(raw.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
