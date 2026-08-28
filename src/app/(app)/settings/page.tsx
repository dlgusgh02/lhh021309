import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { getProfileSettings } from "@/actions/profile-actions";

export const metadata: Metadata = { title: "설정" };

export default async function SettingsPage() {
  const result = await getProfileSettings();

  return (
    <div>
      <PageHeader title="설정" description="계정 및 매장 정보를 관리합니다." />
      {result.success ? (
        <SettingsForm settings={result.data} />
      ) : (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
    </div>
  );
}
