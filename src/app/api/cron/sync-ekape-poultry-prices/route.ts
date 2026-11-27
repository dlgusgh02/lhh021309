import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { fetchLatestEggPrice } from "@/lib/ekape-poultry/client";
import { referencePriceUpdate } from "@/lib/prices/reference-price";

export const dynamic = "force-dynamic";

/** Only 계란 so far — see src/lib/ekape-poultry/client.ts for why 닭고기 isn't included. */
const EGG_INGREDIENT_NAME = "계란";

/**
 * Refreshes `master_ingredients.reference_price` (KRW per kg) for 계란 from
 * eKAPE's "가금산물 일일거래가격정보" dataset. Meant to be hit by an
 * external scheduler once daily, not by users.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  let synced = 0;
  const errors: string[] = [];

  try {
    const picked = await fetchLatestEggPrice();

    if (!picked) {
      errors.push(`${EGG_INGREDIENT_NAME}: no 도매 row in the last 7 days`);
    } else {
      const { data, error } = await supabase
        .from("master_ingredients")
        .update(referencePriceUpdate({ amount: picked.pricePerKg, unit: "kg", source: "ekape-poultry", asOf: picked.asOf }))
        .eq("name", EGG_INGREDIENT_NAME)
        .eq("reference_unit", "kg")
        .select("id");

      if (error) errors.push(`${EGG_INGREDIENT_NAME}: ${error.message}`);
      else if (data?.length !== 1) errors.push(`${EGG_INGREDIENT_NAME}: expected one kg catalog entry, updated ${data?.length ?? 0}`);
      else synced += 1;
    }
  } catch (err) {
    errors.push(`${EGG_INGREDIENT_NAME}: ${err instanceof Error ? err.message : String(err)}`);
  }

  return NextResponse.json({ synced, errors });
}
