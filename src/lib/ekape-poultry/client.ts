/**
 * Client for 축산물품질평가원(eKAPE)'s "가금산물 일일거래가격정보"
 * (data.go.kr/15073985) — a separate dataset from src/lib/ekape/client.ts
 * (that one's consumerPriceDaily endpoint never had chicken/egg/dairy, per
 * its own comment; this dedicated poultry dataset is where they actually
 * live). Same provider, same shared data.go.kr key, but a different base
 * path (`/poultry/...` instead of `/grade/consumerPriceDaily`) and its own
 * 활용신청 — confirmed live 2026-11-27, same "unregistered key" error
 * pattern as every other per-dataset application on this project until
 * approved.
 *
 * Coverage: only `/poultry/egg` is wired up here. `/poultry/chickenDomae`
 * (and the other 육계/산란계/토종닭/오리 operations) report a WHOLE
 * dressed-bird ("도체") price, not a per-cut one — there is no 가슴살 vs
 * 다리살 breakdown anywhere in this dataset (checked: the response fields
 * are franchise/mart/agency/avg, all whole-bird). Using that number for
 * our "닭고기(가슴살)"/"닭고기(다리살)" master ingredients would be a
 * materially wrong price (cuts differ enough in real price that this
 * project has avoided looser substitutions before — see kamis/item-map.ts
 * and ekape/item-map.ts's notes on the same principle), so 닭고기 stays
 * unmapped until a cut-level source turns up.
 *
 * Unit gotcha: the API gives no unit on any field (checked the full
 * response spec on data.go.kr — genuinely absent). Resolved by
 * cross-checking a live pull's exact value against eKAPE's own public
 * 축산유통정보 site mirrored by a third party (2026-11-24: 산지 특란
 * 4,967원/대란 4,648원 quoted as a 30-egg farm-gate price — this API's
 * `special`/`big` fields for that same date are 4967/4648 exactly), so
 * every egg-size field here is 원/30개, not 원/10개 or 원/kg.
 */

const EKAPE_POULTRY_EGG_ENDPOINT = "http://data.ekape.or.kr/openapi-data/service/user/grade/poultry/egg";

/** Grams for one "중란"(medium) egg — the size class this client prices by. 중란 is defined as 44~52g; using the midpoint. */
const MEDIUM_EGG_GRAMS = 48;
const EGGS_PER_UNIT = 30;

export interface EkapePoultryEggRow {
  modYmd: string;
  typeName: string;
  verybig: number;
  special: number;
  big: number;
  medium: number;
  small: number;
}

export class EkapePoultryApiError extends Error {}

function requireEnv(): string {
  const value = process.env.EKAPE_SERVICE_KEY;
  if (!value) throw new EkapePoultryApiError("EKAPE_SERVICE_KEY is not set — the poultry price sync cannot run without it.");
  return value;
}

function textOf(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return m ? m[1] : null;
}

function parseItems(xml: string): EkapePoultryEggRow[] {
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  return blocks.map((block) => ({
    modYmd: textOf(block, "modYmd") ?? "",
    typeName: textOf(block, "typeName") ?? "",
    verybig: Number(textOf(block, "verybig") ?? "0"),
    special: Number(textOf(block, "special") ?? "0"),
    big: Number(textOf(block, "big") ?? "0"),
    medium: Number(textOf(block, "medium") ?? "0"),
    small: Number(textOf(block, "small") ?? "0"),
  }));
}

/** Fetches every egg-price row (both 산지/도매) over the last `daysBack` days — one request covers the whole range. */
export async function fetchEggRows(daysBack = 7): Promise<EkapePoultryEggRow[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  const ymd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

  const params = new URLSearchParams({
    serviceKey: requireEnv(),
    startYmd: ymd(start),
    endYmd: ymd(end),
    numOfRows: "50",
    pageNo: "1",
  });

  const res = await fetch(`${EKAPE_POULTRY_EGG_ENDPOINT}?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new EkapePoultryApiError(`eKAPE poultry egg request failed with status ${res.status}`);
  }

  const xml = await res.text();
  const resultCode = textOf(xml, "resultCode");
  if (resultCode !== "00") {
    throw new EkapePoultryApiError(`eKAPE poultry egg returned resultCode ${resultCode} (${textOf(xml, "resultMsg")})`);
  }

  return parseItems(xml);
}

export interface EkapePoultryReferencePrice {
  pricePerKg: number;
  asOf: string;
}

/** Picks the most recent 도매(wholesale) row and converts its 중란(medium) 원/30개 price to 원/kg. */
export function pickEggReferencePrice(rows: EkapePoultryEggRow[]): EkapePoultryReferencePrice | null {
  const wholesale = rows.filter((r) => r.typeName === "도매" && r.medium > 0 && /^\d{8}$/.test(r.modYmd));
  if (wholesale.length === 0) return null;

  const latest = [...wholesale].sort((a, b) => b.modYmd.localeCompare(a.modYmd))[0];
  const kgPerUnit = (EGGS_PER_UNIT * MEDIUM_EGG_GRAMS) / 1000;
  return {
    pricePerKg: Math.round(latest.medium / kgPerUnit),
    asOf: latest.modYmd,
  };
}

/** Fetches and picks in one call — what the sync route actually uses. */
export async function fetchLatestEggPrice(daysBack = 7): Promise<EkapePoultryReferencePrice | null> {
  const rows = await fetchEggRows(daysBack);
  return pickEggReferencePrice(rows);
}
