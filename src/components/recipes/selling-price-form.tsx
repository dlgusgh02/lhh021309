"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/common/currency-input";
import { updateSellingPrice } from "@/actions/recipe-actions";

export function SellingPriceForm({ recipeId, sellingPrice }: { recipeId: string; sellingPrice: number }) {
  const router = useRouter();
  const [value, setValue] = useState(sellingPrice);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const formData = new FormData();
      formData.set("sellingPrice", String(value));
      const result = await updateSellingPrice(recipeId, formData);
      if (result.success) {
        toast.success("판매가격을 업데이트했습니다.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 space-y-1">
        <label className="text-xs text-muted-foreground">판매가격</label>
        <CurrencyInput value={value} onChange={(e) => setValue(e.target.valueAsNumber || 0)} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "저장 중..." : "적용"}
      </Button>
    </form>
  );
}
