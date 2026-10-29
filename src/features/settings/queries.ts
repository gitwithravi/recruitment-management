import "server-only";

import { cache } from "react";

import { prisma } from "@/db/client";
import { APP_NAME } from "@/lib/app-config";

export const APP_SETTINGS_ID = "default";

export type Branding = {
  appName: string;
  /** Versioned URL of the uploaded logo, or null when none is set. */
  logoUrl: string | null;
};

export const getAppSettings = cache(async () => {
  try {
    return await prisma.appSettings.findUnique({ where: { id: APP_SETTINGS_ID } });
  } catch (error) {
    // Fall back to defaults when the database is unreachable (e.g. during a build)
    // rather than failing every page that shows the app name.
    console.error("getAppSettings failed", error);
    return null;
  }
});

export const getBranding = cache(async (): Promise<Branding> => {
  const settings = await getAppSettings();

  return {
    appName: settings?.appName || APP_NAME,
    logoUrl: settings?.logoFilePath
      ? `/branding/logo?v=${settings.updatedAt.getTime().toString(36)}`
      : null,
  };
});

export async function getAppName() {
  return (await getBranding()).appName;
}
