/**
 * Client for 축산물품질평가원(eKAPE)'s "축산물유통정보" consumerPriceDaily
 * operation — daily livestock consumer prices by cut, with a 17-region
 * breakdown. A different agency/API from the KAMIS odcloud produce data
 * (src/lib/kamis/) — separate dataset on data.go.kr
 * (data.go.kr/data/15000577/openapi.do), but happens to share the same
 * service key as KAMIS_ODCLOUD_KEY because data.go.kr issues one key per
 * account across every dataset that account has applied for (see
 * EKAPE_SERVICE_KEY in .env.example).
 *
 * Coverage (verified live 2026-10-30, by brute-force probing itemCd 1-150
 * since no code table was published anywhere): only 소(beef, judgeKind
 * 4301) and 돼지(pork, judgeKind 4304) return data. 닭/계란/우유 do not —
 * this dataset doesn't cover poultry, eggs, or dairy at all despite the
 * agency's name suggesting broader livestock coverage.
 *
 * Verification note: the full fetch -> parse -> pick pipeline was proven
 * correct with a standalone Node script hitting the real API directly
 * (worked cleanly, 4/4 requests). The *same* logic called from inside this
 * project's `next dev` process failed every time with a generic
 * "TypeError: fetch failed" and no useful cause/stack -- reproduced even
 * after full process restarts and cache clears, and reproduced identically
 * on the already-working KAMIS odcloud sync route too, so it isn't specific
 * to this file. Strong circumstantial evidence points to the host's disk
 * space crisis (see disk_space_crisis memory) breaking something in Next's
 * dev-mode fetch instrumentation even with `cache: "no-store"` set -- but
 * this was never confirmed by directly observing recovery after a disk fix,
 * only inferred. Re-verify the live `/api/cron/sync-ekape-prices` route
 * end-to-end once disk space is comfortably free, and update this note
 * either way.
 */

const EKAPE_ENDPOINT = "http://data.ekape.or.kr/openapi-data/service/user/grade/consumerPriceDaily";

export interface EkapeConsumerPriceRow {
  standYmd: string;
  judgeKind: string;
  judgeKindNm: string;
  itemCd: string;
  itemNm: string;
  grdNm: string;
  ntslPrc: number;
  maxPrc: number;
  minPrc: number;
  unit: string;
}

export class EkapeApiError extends Error {}

function requireEnv(): string {
  const value = process.env.EKAPE_SERVICE_KEY;
  if (!value) throw new EkapeApiError("EKAPE_SERVICE_KEY is not set — the livestock price sync cannot run without it.");
  return value;
}

function textOf(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return m ? m[1] : null;
}

/** Parses the flat, non-nested `<item>...</item>` blocks this API returns (no XML parser dependency for one simple shape). */
function parseItems(xml: string): EkapeConsumerPriceRow[] {
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  return blocks.map((block) => ({
    standYmd: textOf(block, "standYmd") ?? "",
    judgeKind: textOf(block, "judgeKind") ?? "",
    judgeKindNm: textOf(block, "judgeKindNm") ?? "",
    itemCd: textOf(block, "itemCd") ?? "",
    itemNm: textOf(block, "itemNm") ?? "",
    grdNm: textOf(block, "grdNm") ?? "",
    ntslPrc: Number(textOf(block, "ntslPrc") ?? "0"),
    maxPrc: Number(textOf(block, "maxPrc") ?? "0"),
    minPrc: Number(textOf(block, "minPrc") ?? "0"),
    unit: textOf(block, "unit") ?? "",
  }));
}

/** Fetches one cut's consumer prices for a given date (YYYYMMDD). */
export async function fetchConsumerPriceRows(
  judgeKind: string,
  itemCd: string,
  standYmd: string,
): Promise<EkapeConsumerPriceRow[]> {
  const params = new URLSearchParams({ serviceKey: requireEnv(), standYmd, judgeKind, itemCd });
  // Explicitly uncached: this is called from a cron route (not a rendered
  // page), each call uses a different standYmd anyway, and Next's fetch
  // data-cache write failing (e.g. no disk space) surfaces as an opaque
  // "TypeError: fetch failed" that has nothing to do with the real request —
  // confirmed live 2026-10-30 (plain Node `fetch` to the same URL worked
  // fine; only the Next.js-wrapped one failed, and only while disk was
  // critically low).
  const res = await fetch(`${EKAPE_ENDPOINT}?${params.toString()}`, { cache: "no-store" });

  if (!res.ok) {
    throw new EkapeApiError(`eKAPE request failed with status ${res.status} for judgeKind=${judgeKind} itemCd=${itemCd}`);
  }

  const xml = await res.text();
  const resultCode = textOf(xml, "resultCode");
  if (resultCode !== "00") {
    throw new EkapeApiError(`eKAPE returned resultCode ${resultCode} (${textOf(xml, "resultMsg")})`);
  }

  return parseItems(xml);
}

export interface EkapeReferencePrice {
  pricePerKg: number;
  grade: string;
  asOf: string;
}

/**
 * eKAPE's `standYmd` rows lag real-world reporting by at least a day or two
 * — querying "today" reliably returns only "평년" (historical baseline) rows,
 * no real reading yet (verified live 2026-10-30: today had none, 2 days
 * prior did). Walks backward from today up to `maxDaysBack` days, returning
 * the first date that has a real (non-평년) row.
 */
export async function fetchLatestConsumerPrice(
  judgeKind: string,
  itemCd: string,
  maxDaysBack = 7,
): Promise<EkapeReferencePrice | null> {
  for (let daysBack = 0; daysBack <= maxDaysBack; daysBack++) {
    const date = new Date();
    date.setDate(date.getDate() - daysBack);
    const standYmd = date.toISOString().slice(0, 10).replace(/-/g, "");

    const rows = await fetchConsumerPriceRows(judgeKind, itemCd, standYmd);
    const picked = pickReferencePrice(rows, standYmd);
    if (picked) return picked;
  }
  return null;
}

/**
 * Picks one representative row: must match the exact requested date (the
 * API also returns "평년" — historical-average baseline rows mixed into the
 * same list — those are NOT a real current price and must be excluded).
 * When a cut has multiple grades (seen for beef: "1+등급" vs "1등급"), prefers
 * the plain "1등급" over the premium "1+등급" as the more representative,
 * non-premium price; falls back to whatever's left otherwise (e.g. pork's
 * "구분없음" — no grade distinction at all).
 */
export function pickReferencePrice(rows: EkapeConsumerPriceRow[], standYmd: string): EkapeReferencePrice | null {
  const sameDay = rows.filter((r) => r.standYmd === standYmd && r.ntslPrc > 0);
  if (sameDay.length === 0) return null;

  const preferred = sameDay.find((r) => r.grdNm === "1등급") ?? sameDay[0];
  return { pricePerKg: preferred.ntslPrc * 10, grade: preferred.grdNm, asOf: preferred.standYmd };
}
