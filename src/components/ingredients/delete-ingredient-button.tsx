"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { deleteIngredient } from "@/actions/ingredient-actions";

export function DeleteIngredientButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="icon" aria-label={`${name} 삭제`}>
          <Trash2 className="size-4" />
        </Button>
      }
      title={`"${name}" 식재료를 삭제할까요?`}
      description="이 작업은 되돌릴 수 없습니다. 이 식재료를 사용 중인 레시피가 있으면 삭제할 수 없습니다."
      confirmLabel="삭제"
      onSuccessMessage="식재료를 삭제했습니다."
      onConfirm={async () => {
        const result = await deleteIngredient(id);
        router.refresh();
        return result;
      }}
    />
  );
}
