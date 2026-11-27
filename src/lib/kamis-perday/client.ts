/**
 * Client for "한국농수산식품유통공사_일별 도,소매 가격정보 조회" (data.go.kr
 * dataset 15156057) — a different, broader KAMIS price dataset from the
 * "공판장 가격" one in src/lib/kamis/ (which only covers fresh produce sold
 * at wholesale auction markets). This one uses KAMIS's own native
 * ctgry_cd(부류코드)/item_cd(품목코드) scheme and spans grains(100),
 * vegetables(200), specialty crops(300), fruit(400), and seafood(600) —
 * confirmed live 2026-11-06 by brute-forcing item_cd ranges per category
 * (no published code table found). Livestock(ctgry_cd 500) was scanned
 * 500-599 fully and returned nothing — eggs/dairy/meat are NOT in this
 * dataset either (consistent with src/lib/ekape/ covering only beef/pork,
 * and nothing covering chicken/eggs/milk yet). See item-map.ts for the
 * confirmed item_cd mappings.
 *
 * Requires `KAMIS_ODCLOUD_KEY` — the same account-wide data.go.kr key
 * already used by src/lib/kamis/client.ts (each dataset still needs its
 * own 활용신청, but once approved they all share one literal key value).
 *
 * Endpoint gotcha: the "Base URL" shown in most descriptions of this
 * dataset is `https://apis.data.go.kr/B552845/perDay` — that's incomplete.
 * The actual resource path has a trailing `/price` segment; without it the
 * gateway returns `NO_OPENAPI_SERVICE_ERROR` / "해당 오픈API 서비스가 없거나
 * 폐기됨", which looks exactly like an unapplied-API error and wasted real
 * time chasing the wrong cause before a search turned up `.../perDay/price`
 * explicitly.
 */

const KAMIS_PERDAY_ENDPOINT = "https://apis.data.go.kr/B552845/perDay/price";

export interface KamisPerDayRow {
  exmn_ymd: string;
  ctgry_cd: string;
  ctgry_nm: string;
  item_cd: string;
  item_nm: string;
  grd_nm: string;
  mrkt_nm: string;
  unit: string;
  unit_sz: string;
  exmn_dd_prc: string;
}

export class KamisPerDayApiError extends Error {}

function requireEnv(): string {
  const value = process.env.KAMIS_ODCLOUD_KEY;
  if (!value) throw new KamisPerDayApiError("KAMIS_ODCLOUD_KEY is not set — the price sync cannot run without it.");
  return value;
}

/** YYYYMMDD for N days ago. */
function ymd(daysAgo: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(date).replace(/-/g, "");
}

/**
 * Fetches every row for one (ctgry_cd, item_cd) pair over the last
 * `daysBack` days (one request covers the whole range — unlike eKAPE's
 * dataset, this API takes a date range directly instead of needing one
 * call per day).
 */
export async function fetchPerDayRows(ctgryCd: string, itemCd: string, daysBack = 7): Promise<KamisPerDayRow[]> {
  if (!Number.isInteger(daysBack) || daysBack < 0 || daysBack > 31) {
    throw new KamisPerDayApiError("daysBack must be an integer between 0 and 31.");
  }
  const params = new URLSearchParams({
    serviceKey: requireEnv(),
    pageNo: "1",
    numOfRows: "1000",
  });
  const condPrefix = `cond%5B`;
  const query =
    `${params.toString()}` +
    `&${condPrefix}exmn_ymd%3A%3AGTE%5D=${ymd(daysBack)}` +
    `&${condPrefix}exmn_ymd%3A%3ALTE%5D=${ymd(0)}` +
    `&${condPrefix}ctgry_cd%3A%3AEQ%5D=${encodeURIComponent(ctgryCd)}` +
    `&${condPrefix}item_cd%3A%3AEQ%5D=${encodeURIComponent(itemCd)}`;

  const rows: KamisPerDayRow[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const pageQuery = new URLSearchParams(query);
    pageQuery.set("pageNo", String(page));
    const res = await fetch(`${KAMIS_PERDAY_ENDPOINT}?${pageQuery}`, { cache: "no-store", signal: AbortSignal.timeout(15000) });

    if (!res.ok) {
      throw new KamisPerDayApiError(`perDay request failed with status ${res.status} for ctgry_cd=${ctgryCd} item_cd=${itemCd}`);
    }

    const data = await res.json();
    const resultCode = data?.response?.header?.resultCode;
    if (String(resultCode) !== "0") {
      throw new KamisPerDayApiError(`perDay returned resultCode ${resultCode} (${data?.response?.header?.resultMsg})`);
    }

    const item = data?.response?.body?.items?.item ?? [];
    const pageRows: KamisPerDayRow[] = Array.isArray(item) ? item : [item];
    rows.push(...pageRows);
    const total = Number(data?.response?.body?.totalCount);
    if (pageRows.length === 0 || (Number.isFinite(total) && total >= 0 && rows.length >= total) || (!Number.isFinite(total) && pageRows.length < 1000)) return rows;
  }
  throw new KamisPerDayApiError("perDay pagination exceeded 100 pages.");
}

export interface KamisPerDayReferencePrice {
  pricePerKg: number;
  grade: string;
  market: string;
  asOf: string;
}

/**
 * Picks one representative, weight-based (unit === "kg") row and converts
 * it to a per-kg price via `unit_sz` (e.g. a 20kg sack's price / 20).
 * Non-weight units (마리/손/속/g 등) are intentionally excluded rather than
 * mixed in with inconsistent conversions.
 *
 * Uses the latest observation date first, then prefers a 가락 market row
 * with a middle grade (중 or 中). The exact
 * label varies by commodity — 중, 중품, 중멸 all contain 중 — so matched by
 * substring to match the existing convention in src/lib/kamis/client.ts
 * and src/lib/ekape/client.ts. Falls back to any kg-unit row (most recent
 * date) when no 가락+중 row exists — observed live for 쌀 (no 가락 market
 * at all; this dataset's grain wholesale anchor is "양곡도매" instead) and
 * for items with only one grade reported (e.g. 고춧가루's 가락 row only
 * shows up some days).
 */
export function pickReferencePrice(rows: KamisPerDayRow[]): KamisPerDayReferencePrice | null {
  const kgRows = rows.filter((r) => r.unit === "kg" && /^\d{8}$/.test(r.exmn_ymd) && Number.isFinite(Number(r.exmn_dd_prc)) && Number(r.exmn_dd_prc) > 0 && Number.isFinite(Number(r.unit_sz)) && Number(r.unit_sz) > 0);
  if (kgRows.length === 0) return null;

  const latestDate = kgRows.reduce((latest, r) => r.exmn_ymd > latest ? r.exmn_ymd : latest, "");
  const latestRows = kgRows.filter((r) => r.exmn_ymd === latestDate);
  const preferred = latestRows.filter((r) => r.mrkt_nm.startsWith("가락") && /중|中/.test(r.grd_nm));
  const pool = preferred.length > 0 ? preferred : latestRows;

  const top = [...pool].sort((a, b) => b.exmn_ymd.localeCompare(a.exmn_ymd))[0];
  return {
    pricePerKg: Math.round(Number(top.exmn_dd_prc) / Number(top.unit_sz)),
    grade: top.grd_nm,
    market: top.mrkt_nm,
    asOf: top.exmn_ymd,
  };
}

/** Fetches and picks in one call — what the sync route actually uses. */
export async function fetchLatestPerDayPrice(
  ctgryCd: string,
  itemCd: string,
  daysBack = 7,
): Promise<KamisPerDayReferencePrice | null> {
  const rows = await fetchPerDayRows(ctgryCd, itemCd, daysBack);
  return pickReferencePrice(rows);
}
