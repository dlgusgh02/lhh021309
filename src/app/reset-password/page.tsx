import Link from "next/link";
import type { Metadata } from "next";
import { ChefHat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "새 비밀번호 설정" };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 p-4">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <ChefHat className="size-5 text-primary" />
        FoodCost Lab
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>새 비밀번호 설정</CardTitle>
          <CardDescription>이메일로 받은 링크를 통해 접속하셨다면, 새 비밀번호를 입력해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
