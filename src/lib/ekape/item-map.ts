/**
 * Maps our `master_ingredients.name` values to eKAPE's judgeKind(축종코드) +
 * itemCd(품목코드) pair — see client.ts for how these were found (no
 * published code table; brute-forced itemCd 1-150 live against the API).
 *
 * Coverage is only beef (judgeKind 4301) and pork (judgeKind 4304) cuts —
 * chicken/egg/dairy aren't in this dataset (checked, see client.ts).
 */

export interface EkapeItemMapping {
  /** Must match a `name` already seeded into `master_ingredients`. */
  name: string;
  judgeKind: string;
  itemCd: string;
}

export const EKAPE_ITEM_MAP: EkapeItemMapping[] = [
  { name: "소고기(등심)", judgeKind: "4301", itemCd: "22" }, // 등심
  { name: "돼지고기(삼겹살)", judgeKind: "4304", itemCd: "27" }, // 삼겹살
  { name: "돼지고기(앞다리살)", judgeKind: "4304", itemCd: "25" }, // 앞다리

  // Confirmed NOT present as of 2026-10-30 (checked live): no judgeKind
  // responded for chicken or eggs in the 4300-4320 range, and this
  // endpoint's response schema has nothing dairy-shaped either. 닭고기
  // (가슴살/다리살), 계란, 우유 need a different dataset entirely (the
  // agency's own "가금산물 일일거래가격정보" dataset, data.go.kr/15073985,
  // not yet investigated).
];
