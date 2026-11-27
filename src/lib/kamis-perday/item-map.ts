/**
 * Maps our `master_ingredients.name` values to this dataset's
 * ctgry_cd(부류코드) + item_cd(품목코드) pair — found live 2026-11-06 by
 * brute-forcing item_cd ranges per category (see client.ts for the
 * category-code pattern: 100=grains, 200=vegetables, 300=specialty crops,
 * 600=seafood; 500=livestock scanned fully and empty).
 */

export interface KamisPerDayItemMapping {
  /** Must match a `name` already seeded into `master_ingredients`. */
  name: string;
  ctgryCd: string;
  itemCd: string;
}

export const KAMIS_PERDAY_ITEM_MAP: KamisPerDayItemMapping[] = [
  { name: "쌀", ctgryCd: "100", itemCd: "111" },
  { name: "마늘", ctgryCd: "200", itemCd: "258" }, // 깐마늘(국산) — the peeled form actually used in cooking, not 피마늘(244, unpeeled bulk)
  { name: "대파", ctgryCd: "200", itemCd: "246" }, // listed as "파" in this dataset
  { name: "생강", ctgryCd: "200", itemCd: "247" },
  { name: "고춧가루", ctgryCd: "200", itemCd: "248" },
  { name: "갈치", ctgryCd: "600", itemCd: "613" },
  { name: "새우", ctgryCd: "600", itemCd: "654" },
  { name: "고등어", ctgryCd: "600", itemCd: "611" },
  { name: "멸치", ctgryCd: "600", itemCd: "638" }, // 마른멸치 — recipes use dried anchovy, not the separate 멸치액젓(651)/수입조기 etc.
  { name: "오징어", ctgryCd: "600", itemCd: "619" }, // 물오징어 (fresh) — not 마른오징어(640, dried)
  { name: "소금", ctgryCd: "600", itemCd: "652" }, // 천일염 — found live 2026-11-27 while re-checking the remaining gaps; this dataset has no refined-salt item, so 천일염 (the standard Korean cooking salt) is the representative pick, same convention as 물오징어/마른멸치 above

  // Confirmed NOT in this dataset: 축산물 (ctgry_cd 500) was scanned fully
  // (500-599, live 2026-11-06) and returned zero rows for every item_cd —
  // no meat, eggs, or dairy here at all; 계란 is now covered by
  // src/lib/ekape-poultry/ instead (가금산물 일일거래가격정보), 닭고기 isn't
  // (no cut-level breakdown anywhere, see that module's comment), and
  // 우유 has no live price API at all (dairy board negotiation, not a
  // published dataset — checked 2026-11-27). 간장/고추장/된장/두부/설탕/
  // 식용유/참기름 are still absent (also checked ctgry_cd 700 live
  // 2026-11-27, nothing there — this dataset tops out at grains/
  // vegetables/specialty crops/fruit/seafood; the only processed-food
  // source found, data.go.kr/15098486, is a 2020-2024 one-time CSV file,
  // not a live API, so it doesn't fit this cron's daily-sync model).
];
