"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/common/currency-input";
import { formatKRW } from "@/lib/utils/currency";
import { EXTRA_COST_TYPES } from "@/types";
import { addExtraCost, removeExtraCost } from "@/actions/recipe-actions";
import type { ExtraCost } from "@/types";

export function ExtraCostEditor({ recipeId, extraCosts }: { recipeId: string; extraCosts: ExtraCost[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [costType, setCostType] = useState("packaging");

  function handleAdd() {
    if (!name.trim() || amount === "") {
      toast.error("항목명과 금액을 입력해주세요.");
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("amount", String(amount));
      formData.set("costType", costType);

      const result = await addExtraCost(recipeId, formData);
      if (result.success) {
        setName("");
        setAmount("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const result = await removeExtraCost(recipeId, id);
      if (result.success) router.refresh();
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {extraCosts.length === 0 && <li className="text-sm text-muted-foreground">추가 비용이 없습니다.</li>}
        {extraCosts.map((ec) => (
          <li key={ec.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span>{ec.name}</span>
            <div className="flex items-center gap-3">
              <span className="font-medium">{formatKRW(ec.amount)}</span>
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => handleRemove(ec.id)}
                aria-label={`${ec.name} 삭제`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">항목명</label>
          <Input placeholder="포장 용기" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="w-full space-y-1 sm:w-36">
          <label className="text-xs text-muted-foreground">유형</label>
          <Select value={costType} onValueChange={(v) => setCostType(v ?? "etc")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXTRA_COST_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full space-y-1 sm:w-32">
          <label className="text-xs text-muted-foreground">금액</label>
          <CurrencyInput value={amount} onChange={(e) => setAmount(e.target.valueAsNumber || "")} />
        </div>
        <Button type="button" onClick={handleAdd} disabled={isPending}>
          <Plus className="size-4" />
          추가
        </Button>
      </div>
    </div>
  );
}
