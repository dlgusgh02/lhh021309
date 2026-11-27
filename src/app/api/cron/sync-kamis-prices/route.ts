import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { fetchMarketPriceRows, pickReferencePrice } from "@/lib/kamis/client";
import { KAMIS_ITEM_MAP } from "@/lib/kamis/item-map";
import { referencePriceUpdate } from "@/lib/prices/reference-price";

/**
 * Refreshes `master_ingredients.reference_price`/`reference_unit` for every
 * item in KAMIS_ITEM_MAP from the odcloud wholesale-market-price dataset.
 * Meant to be hit by an external scheduler (e.g. Vercel Cron) once daily,
 * not by users.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (KAMIS_ITEM_MAP.length === 0) {
    return NextResponse.json({ synced: 0, message: "KAMIS_ITEM_MAP is empty — nothing to sync yet." });
  }

  const supabase = createServiceRoleClient();
  let synced = 0;
  const errors: string[] = [];

  for (const mapping of KAMIS_ITEM_MAP) {
    try {
      const rows = await fetchMarketPriceRows(mapping.odcloudName);
      const picked = pickReferencePrice(rows, mapping.unit);

      if (!picked) {
        const unitDesc = mapping.unit ?? "키로(kg 환산)";
        errors.push(`${mapping.name}: no usable (가락/중등급/${unitDesc}) row found for "${mapping.odcloudName}"`);
        continue;
      }

      const { data, error } = await supabase
        .from("master_ingredients")
        .update(referencePriceUpdate({ amount: picked.price, unit: picked.unit, source: "kamis-auction", asOf: picked.asOf, market: "가락", grade: "중" }))
        .eq("name", mapping.name)
        .select("id");

      if (error) errors.push(`${mapping.name}: ${error.message}`);
      else if (data?.length !== 1) errors.push(`${mapping.name}: expected one catalog entry, updated ${data?.length ?? 0}`);
      else synced += 1;
    } catch (err) {
      errors.push(`${mapping.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ synced, errors });
}
