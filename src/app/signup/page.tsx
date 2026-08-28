import Link from "next/link";
import type { Metadata } from "next";
import { ChefHat } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "회원가입" };

export default function SignupPage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 p-4">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <ChefHat className="size-5 text-primary" />
        FoodCost Lab
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>가입 즉시 기본 매장이 생성되어 바로 식재료를 등록할 수 있어요.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary underline underline-offset-4">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
