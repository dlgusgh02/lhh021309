import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { fetchLatestPerDayPrice } from "@/lib/kamis-perday/client";
import { KAMIS_PERDAY_ITEM_MAP } from "@/lib/kamis-perday/item-map";
import { referencePriceUpdate } from "@/lib/prices/reference-price";

export const dynamic = "force-dynamic";

/**
 * Refreshes `master_ingredients.reference_price` (KRW per kg) for every
 * item in KAMIS_PERDAY_ITEM_MAP from the "일별 도,소매 가격정보" dataset
 * (grains/vegetables/specialty-crops/seafood — a different, broader KAMIS
 * dataset from sync-kamis-prices, which only covers 공판장 auction prices
 * for fresh produce). Meant to be hit by an external scheduler once daily.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (KAMIS_PERDAY_ITEM_MAP.length === 0) {
    return NextResponse.json({ synced: 0, message: "KAMIS_PERDAY_ITEM_MAP is empty — nothing to sync yet." });
  }

  const supabase = createServiceRoleClient();
  let synced = 0;
  const errors: string[] = [];
  const prices: { name: string; asOf: string; market: string; grade: string }[] = [];

  for (const mapping of KAMIS_PERDAY_ITEM_MAP) {
    try {
      const picked = await fetchLatestPerDayPrice(mapping.ctgryCd, mapping.itemCd);

      if (!picked) {
        errors.push(`${mapping.name}: no kg-unit row in the last 7 days (ctgry_cd=${mapping.ctgryCd}, item_cd=${mapping.itemCd})`);
        continue;
      }

      const { data, error } = await supabase
        .from("master_ingredients")
        .update(referencePriceUpdate({ amount: picked.pricePerKg, unit: "kg", source: "kamis-perday", asOf: picked.asOf, market: picked.market, grade: picked.grade }))
        .eq("name", mapping.name)
        .eq("reference_unit", "kg")
        .select("id");

      if (error) errors.push(`${mapping.name}: ${error.message}`);
      else if (data?.length !== 1) errors.push(`${mapping.name}: expected exactly one kg catalog entry, updated ${data?.length ?? 0}`);
      else {
        synced += 1;
        prices.push({ name: mapping.name, asOf: picked.asOf, market: picked.market, grade: picked.grade });
      }
    } catch (err) {
      errors.push(`${mapping.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ synced, errors, prices });
}
