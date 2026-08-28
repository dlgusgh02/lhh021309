"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { signupSchema, type SignupValues } from "@/lib/validations/auth";
import { signup } from "@/actions/auth-actions";

export function SignupForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof signupSchema>) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("displayName", values.displayName);
      formData.set("email", values.email);
      formData.set("password", values.password);

      const result = await signup(formData);
      if (result.success) {
        if (result.data.needsEmailConfirmation) {
          toast.success("가입이 완료되었습니다. 이메일을 확인해 인증을 완료해주세요.");
        }
        // On success without confirmation, the action itself redirects.
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="displayName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>이름</FieldLabel>
              <Input {...field} id={field.name} aria-invalid={fieldState.invalid} placeholder="홍길동" />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>이메일</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
                placeholder="you@example.com"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>비밀번호</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "가입 중..." : "무료로 시작하기"}
        </Button>
      </FieldGroup>
    </form>
  );
}
