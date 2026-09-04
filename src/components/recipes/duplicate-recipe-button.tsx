"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duplicateRecipe } from "@/actions/recipe-actions";

export function DuplicateRecipeButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await duplicateRecipe(id);
      if (result.success) {
        toast.success("레시피를 복제했습니다.");
        router.push(`/recipes/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button type="button" variant="outline" onClick={handleClick} disabled={isPending}>
      <Copy className="size-4" />
      {isPending ? "복제 중..." : "복제"}
    </Button>
  );
}
