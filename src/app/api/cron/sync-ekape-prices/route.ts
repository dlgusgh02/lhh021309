import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { fetchLatestConsumerPrice } from "@/lib/ekape/client";
import { EKAPE_ITEM_MAP } from "@/lib/ekape/item-map";

export const dynamic = "force-dynamic";

/**
 * Refreshes `master_ingredients.reference_price` (KRW per kg) for every item
 * in EKAPE_ITEM_MAP from eKAPE's daily livestock consumer price API. Meant
 * to be hit by an external scheduler once daily, not by users.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (EKAPE_ITEM_MAP.length === 0) {
    return NextResponse.json({ synced: 0, message: "EKAPE_ITEM_MAP is empty — nothing to sync yet." });
  }

  const supabase = createServiceRoleClient();
  let synced = 0;
  const errors: string[] = [];

  for (const mapping of EKAPE_ITEM_MAP) {
    try {
      const picked = await fetchLatestConsumerPrice(mapping.judgeKind, mapping.itemCd);

      if (!picked) {
        errors.push(`${mapping.name}: no real (non-평년) row in the last 7 days (judgeKind=${mapping.judgeKind}, itemCd=${mapping.itemCd})`);
        continue;
      }

      const { error } = await supabase
        .from("master_ingredients")
        .update({ reference_price: picked.pricePerKg, price_updated_at: new Date().toISOString() })
        .eq("name", mapping.name);

      if (error) errors.push(`${mapping.name}: ${error.message}`);
      else synced += 1;
    } catch (err) {
      errors.push(`${mapping.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ synced, errors });
}
