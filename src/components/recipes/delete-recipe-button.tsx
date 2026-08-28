"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { deleteRecipe } from "@/actions/recipe-actions";

export function DeleteRecipeButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
          삭제
        </Button>
      }
      title={`"${name}" 레시피를 삭제할까요?`}
      description="이 작업은 되돌릴 수 없습니다. 레시피에 추가된 재료와 추가 비용 정보도 함께 삭제됩니다."
      confirmLabel="삭제"
      onSuccessMessage="레시피를 삭제했습니다."
      onConfirm={async () => {
        const result = await deleteRecipe(id);
        if (result.success) {
          router.push("/recipes");
          router.refresh();
        }
        return result;
      }}
    />
  );
}
