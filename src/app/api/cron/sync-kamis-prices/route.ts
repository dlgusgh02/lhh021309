import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { fetchDailyPricesByCategory, parseKamisPrice } from "@/lib/kamis/client";
import { KAMIS_ITEM_MAP } from "@/lib/kamis/item-map";

/**
 * Refreshes `master_ingredients.reference_price` from KAMIS for every item
 * in KAMIS_ITEM_MAP (currently empty — see that file). Meant to be hit by an
 * external scheduler (e.g. Vercel Cron) once daily, not by users.
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
  const categoryCodes = [...new Set(KAMIS_ITEM_MAP.map((m) => m.categoryCode))];

  let synced = 0;
  const errors: string[] = [];

  for (const categoryCode of categoryCodes) {
    try {
      const items = await fetchDailyPricesByCategory(categoryCode);
      const mappingsInCategory = KAMIS_ITEM_MAP.filter((m) => m.categoryCode === categoryCode);

      for (const mapping of mappingsInCategory) {
        const match = items.find((i) => i.item_code === mapping.itemCode && i.kind_code === mapping.kindCode);
        if (!match) {
          errors.push(`${mapping.name}: no matching KAMIS row for item ${mapping.itemCode}/${mapping.kindCode}`);
          continue;
        }

        const price = parseKamisPrice(match.price);
        if (price === null) {
          errors.push(`${mapping.name}: unparseable price "${match.price}"`);
          continue;
        }

        const { error } = await supabase
          .from("master_ingredients")
          .update({ reference_price: price, price_updated_at: new Date().toISOString() })
          .eq("name", mapping.name);

        if (error) errors.push(`${mapping.name}: ${error.message}`);
        else synced += 1;
      }
    } catch (err) {
      errors.push(`category ${categoryCode}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ synced, errors });
}
