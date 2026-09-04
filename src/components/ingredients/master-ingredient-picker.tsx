"use client";

import { useState, useTransition } from "react";
import { PackageSearch, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMasterIngredients } from "@/actions/master-ingredient-actions";
import { formatKRW } from "@/lib/utils/currency";
import type { MasterIngredient } from "@/types";

export function MasterIngredientPicker({ onSelect }: { onSelect: (item: MasterIngredient) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MasterIngredient[] | null>(null);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && items === null) {
      startTransition(async () => {
        const result = await getMasterIngredients();
        setItems(result.success ? result.data : []);
      });
    }
  }

  const filtered = (items ?? []).filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <PackageSearch className="size-4" />
        공용 재료에서 가져오기
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>공용 재료 목록</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="재료명 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {isPending && <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>}
          {!isPending && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {items === null ? "" : "일치하는 재료가 없습니다."}
            </p>
          )}
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <span>{item.name}</span>
              <span className="text-muted-foreground">
                {item.referencePrice !== null
                  ? `${formatKRW(item.referencePrice)}/${item.referenceUnit}`
                  : "가격 미확인"}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
