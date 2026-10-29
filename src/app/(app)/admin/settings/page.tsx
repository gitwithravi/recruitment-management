import type { Metadata } from "next";

import { BrandingForm } from "@/components/admin/settings/branding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/app-config";
import { requireAdmin } from "@/server/auth/session";
import { getAppSettings, getBranding } from "@/features/settings/queries";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [settings, branding] = await Promise.all([getAppSettings(), getBranding()]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Customize how the app is presented to your team and to candidates.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Branding</CardTitle>
          <CardDescription>App name and logo.</CardDescription>
        </CardHeader>
        <CardContent>
          <BrandingForm
            appName={settings?.appName ?? ""}
            defaultAppName={APP_NAME}
            logoUrl={branding.logoUrl}
          />
        </CardContent>
      </Card>
    </div>
  );
}
