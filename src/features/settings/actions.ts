"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/client";
import { writeAuditLog } from "@/server/audit";
import { requireAdmin } from "@/server/auth/session";
import { deleteLogoFile, saveLogoFile } from "@/server/storage";
import { validateLogoFile } from "@/server/upload-validation";
import { APP_SETTINGS_ID } from "@/features/settings/queries";
import { validateAppName } from "@/features/settings/validation";

export type BrandingFieldErrors = {
  appName?: string;
  logo?: string;
};

export type UpdateBrandingState = {
  errors: BrandingFieldErrors;
  generic?: string;
  success?: boolean;
};

export async function updateBrandingAction(
  _previousState: UpdateBrandingState,
  formData: FormData,
): Promise<UpdateBrandingState> {
  const admin = await requireAdmin();

  const nameResult = validateAppName(String(formData.get("appName") ?? ""));
  const logoEntry = formData.get("logo");
  const logo = logoEntry instanceof File && logoEntry.size > 0 ? logoEntry : null;
  const removeLogo = formData.get("removeLogo") === "on";

  const errors: BrandingFieldErrors = {};
  if ("error" in nameResult) errors.appName = nameResult.error;
  const logoError = validateLogoFile(logo);
  if (logoError) errors.logo = logoError;

  if (errors.appName || errors.logo || !("name" in nameResult)) {
    return { errors };
  }

  const existing = await prisma.appSettings.findUnique({ where: { id: APP_SETTINGS_ID } });
  let saved: Awaited<ReturnType<typeof saveLogoFile>> | null = null;

  try {
    if (logo) {
      saved = await saveLogoFile(logo);
    }

    const logoData = saved
      ? { logoFilePath: saved.relativePath, logoMimeType: saved.mimeType }
      : removeLogo
        ? { logoFilePath: null, logoMimeType: null }
        : {};

    await prisma.$transaction(async (tx) => {
      await tx.appSettings.upsert({
        where: { id: APP_SETTINGS_ID },
        create: { id: APP_SETTINGS_ID, appName: nameResult.name, ...logoData },
        update: { appName: nameResult.name, ...logoData },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "settings_updated",
        entityType: "app_settings",
        entityId: APP_SETTINGS_ID,
        metadata: {
          appName: nameResult.name,
          logo: saved ? "replaced" : removeLogo ? "removed" : "unchanged",
        },
      });
    });
  } catch (error) {
    if (saved) await deleteLogoFile(saved.relativePath).catch(() => undefined);
    console.error("updateBrandingAction failed", error);
    return { errors: {}, generic: "Could not save settings. Please try again." };
  }

  if ((saved || removeLogo) && existing?.logoFilePath) {
    await deleteLogoFile(existing.logoFilePath).catch((error) => {
      console.error("failed to delete previous logo", error);
    });
  }

  // The name and logo appear in every layout, so refresh everything.
  revalidatePath("/", "layout");

  return { errors: {}, success: true };
}
