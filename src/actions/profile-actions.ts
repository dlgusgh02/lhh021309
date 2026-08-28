"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/dal";
import type { ActionResult } from "@/types";

export interface ProfileSettings {
  email: string;
  displayName: string | null;
  storeName: string;
  currency: string;
}

export async function getProfileSettings(): Promise<ActionResult<ProfileSettings>> {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const [{ data: profile }, { data: store }] = await Promise.all([
      supabase.from("profiles").select("display_name, currency").eq("id", user.id).maybeSingle(),
      supabase.from("stores").select("name, currency").eq("user_id", user.id).limit(1).maybeSingle(),
    ]);

    return {
      success: true,
      data: {
        email: user.email ?? "",
        displayName: profile?.display_name ?? null,
        storeName: store?.name ?? "기본 매장",
        currency: store?.currency ?? profile?.currency ?? "KRW",
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "설정 정보를 불러오지 못했습니다." };
  }
}

export async function updateStoreName(formData: FormData): Promise<ActionResult<null>> {
  const name = String(formData.get("storeName") ?? "").trim();
  if (!name) {
    return { success: false, error: "매장 이름을 입력해주세요." };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { error } = await supabase.from("stores").update({ name }).eq("user_id", user.id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "매장 이름 수정에 실패했습니다." };
  }
}

export async function updateDisplayName(formData: FormData): Promise<ActionResult<null>> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (!displayName) {
    return { success: false, error: "이름을 입력해주세요." };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/settings");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "이름 수정에 실패했습니다." };
  }
}
