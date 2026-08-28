import Link from "next/link";
import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <ChefHat className="size-10 text-muted-foreground" />
      <div>
        <h1 className="text-lg font-semibold">페이지를 찾을 수 없습니다</h1>
        <p className="mt-1 text-sm text-muted-foreground">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      </div>
      <Button render={<Link href="/" />} nativeButton={false}>
        홈으로 돌아가기
      </Button>
    </div>
  );
}
