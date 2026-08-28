import Link from "next/link";
import type { Metadata } from "next";
import { ChefHat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "비밀번호 재설정" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 p-4">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <ChefHat className="size-5 text-primary" />
        FoodCost Lab
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>비밀번호 재설정</CardTitle>
          <CardDescription>가입한 이메일 주소를 입력하면 재설정 링크를 보내드려요.</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary underline underline-offset-4">
              로그인으로 돌아가기
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
