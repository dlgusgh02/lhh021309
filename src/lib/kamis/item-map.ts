/**
 * Maps our master ingredient catalog to KAMIS (농산물유통정보 Open-API) item codes.
 *
 * KAMIS only prices raw agricultural/livestock/fishery goods — no sauces,
 * seasonings, or packaging — so this list will only ever cover part of a
 * restaurant's ingredients. The rest still gets registered manually.
 *
 * The codes below are PLACEHOLDERS, not verified KAMIS codes. The real
 * 품목코드/품종코드/부류코드 reference is only browsable after registering for
 * API access at https://www.kamis.or.kr (Open-API 이용안내 -> 신청), which
 * hadn't happened yet as of when this file was written. Before running the
 * sync job, replace `itemCode`/`kindCode`/`categoryCode` below with the real
 * values from that reference, one item at a time — a wrong code silently
 * returns no price (or the wrong item's price), so verify each one against
 * a manual KAMIS API call before trusting it.
 */

export interface KamisItemMapping {
  /** Must match a `name` already seeded into `master_ingredients`. */
  name: string;
  itemCode: string;
  kindCode: string;
  categoryCode: string;
  /** `p_countycode` — region to price by. "1101" (서울) is KAMIS's usual default for a national reference price. */
  countyCode: string;
}

export const KAMIS_ITEM_MAP: KamisItemMapping[] = [
  // Example shape only — verify against the real KAMIS code reference before use.
  // { name: "양파", itemCode: "TODO", kindCode: "TODO", categoryCode: "TODO", countyCode: "1101" },
  // { name: "대파", itemCode: "TODO", kindCode: "TODO", categoryCode: "TODO", countyCode: "1101" },
  // { name: "돼지고기(삼겹살)", itemCode: "TODO", kindCode: "TODO", categoryCode: "TODO", countyCode: "1101" },
];
