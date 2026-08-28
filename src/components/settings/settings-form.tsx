"use client";

import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateDisplayName, updateStoreName } from "@/actions/profile-actions";
import type { ProfileSettings } from "@/actions/profile-actions";

export function SettingsForm({ settings }: { settings: ProfileSettings }) {
  const router = useRouter();
  const [isNamePending, startNameTransition] = useTransition();
  const [isStorePending, startStoreTransition] = useTransition();

  function handleNameSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startNameTransition(async () => {
      const result = await updateDisplayName(formData);
      if (result.success) {
        toast.success("이름을 수정했습니다.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleStoreSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startStoreTransition(async () => {
      const result = await updateStoreName(formData);
      if (result.success) {
        toast.success("매장 이름을 수정했습니다.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">계정</CardTitle>
          <CardDescription>{settings.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNameSubmit} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="displayName">이름</Label>
              <Input id="displayName" name="displayName" defaultValue={settings.displayName ?? ""} />
            </div>
            <Button type="submit" disabled={isNamePending}>
              {isNamePending ? "저장 중..." : "저장"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">매장</CardTitle>
          <CardDescription>MVP에서는 매장 1개만 지원합니다. 통화: {settings.currency}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStoreSubmit} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="storeName">매장 이름</Label>
              <Input id="storeName" name="storeName" defaultValue={settings.storeName} />
            </div>
            <Button type="submit" disabled={isStorePending}>
              {isStorePending ? "저장 중..." : "저장"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
