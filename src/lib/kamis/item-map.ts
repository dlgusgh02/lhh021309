/**
 * Maps our `master_ingredients.name` values to the exact `품목` string the
 * odcloud wholesale-market-price dataset uses (see client.ts) — matching is
 * by exact string, and the dataset's naming doesn't always line up with
 * ours (e.g. it has no "대파" row, only "실파"/"쪽파", which are different
 * products, so 대파 is intentionally left unmapped rather than faked).
 *
 * This dataset only covers fresh produce (verified live 2026-09-11) — meat,
 * dairy, seafood, grain, and sauces/seasonings will never get a price this
 * way. Entries below are limited to names actually confirmed present in a
 * live query; add more by testing against the API directly before trusting
 * a new name (a typo or a non-existent product name just returns 0 rows
 * silently, not an error).
 */

export interface KamisItemMapping {
  /** Must match a `name` already seeded into `master_ingredients`. */
  name: string;
  /** The exact `품목` value to query the odcloud dataset for. */
  odcloudName: string;
}

export const KAMIS_ITEM_MAP: KamisItemMapping[] = [
  { name: "양파", odcloudName: "양파" },
  { name: "무", odcloudName: "무" },
  { name: "감자", odcloudName: "감자" },
  { name: "당근", odcloudName: "당근" },
  { name: "애호박", odcloudName: "애호박" },
  { name: "청양고추", odcloudName: "청양고추" },
  { name: "상추", odcloudName: "상추" },
  { name: "배추", odcloudName: "배추" },
  { name: "버섯(느타리)", odcloudName: "느타리버섯" },

  // Confirmed NOT present in this dataset as of 2026-09-11 (checked live,
  // not guessed) — leave unmapped rather than substitute a different
  // product: 대파 (only 실파/쪽파 exist, different items), 마늘/깐마늘, 오이,
  // 두부, 돼지고기, 쌀, 계란, 고등어. Any seeded ingredient not listed above
  // simply hasn't been checked yet.
];
