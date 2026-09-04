/**
 * Maps our master ingredient catalog to KAMIS (농산물유통정보 Open-API) item codes.
 *
 * KAMIS only prices raw agricultural/livestock/fishery goods — no sauces,
 * seasonings, or packaging — so this list will only ever cover part of a
 * restaurant's ingredients. The rest still gets registered manually.
 *
 * Most codes below are still PLACEHOLDERS, not verified KAMIS codes. The
 * real 품목코드/품종코드/부류코드 reference is only browsable after registering
 * for API access at https://www.kamis.or.kr (Open-API 이용안내 -> 신청), which
 * hadn't happened yet as of when most of this file was written. Before
 * running the sync job, replace `itemCode`/`kindCode`/`categoryCode` below
 * with the real values from that reference, one item at a time — a wrong
 * code silently returns no price (or the wrong item's price), so verify
 * each one against a manual KAMIS API call before trusting it.
 *
 * One entry (쌀) is cross-verified against the public source of the
 * unofficial `kamispy` client's test fixtures (github.com/spoqa/kamispy,
 * tests/client_test.py) and KAMIS's own PeriodProductList parameter docs
 * embedded in that same repo — not against a live API call, since no key
 * was available. Re-verify it live before trusting it in production too.
 */

export interface KamisItemMapping {
  /** Must match a `name` already seeded into `master_ingredients`. */
  name: string;
  itemCode: string;
  kindCode: string;
  categoryCode: string;
  /**
   * `p_countycode` — region to price by. "1101" (서울) is what this project
   * uses as the national reference price. Full verified list of KAMIS
   * region codes (from the same source as the 쌀 mapping above): 1101 서울,
   * 2100 부산, 2200 대구, 2300 인천, 2401 광주, 2501 대전, 2601 울산,
   * 3111 수원, 3211 춘천, 3311 청주, 3511 전주, 3711 포항, 3911 제주,
   * 3113 의정부, 3613 순천, 3714 안동, 3814 창원, 3145 용인.
   */
  countyCode: string;
}

export const KAMIS_ITEM_MAP: KamisItemMapping[] = [
  // 부류코드 100 (식량작물) / 품목코드 111 (쌀) / 품종코드 01 (일반계) — see file header.
  { name: "쌀", itemCode: "111", kindCode: "01", categoryCode: "100", countyCode: "1101" },

  // The rest are placeholders — verify against the real KAMIS code reference before use.
  // { name: "양파", itemCode: "TODO", kindCode: "TODO", categoryCode: "TODO", countyCode: "1101" },
  // { name: "대파", itemCode: "TODO", kindCode: "TODO", categoryCode: "TODO", countyCode: "1101" },
  // { name: "돼지고기(삼겹살)", itemCode: "TODO", kindCode: "TODO", categoryCode: "TODO", countyCode: "1101" },
];
