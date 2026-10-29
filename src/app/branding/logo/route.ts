import { getAppSettings } from "@/features/settings/queries";
import { readLogoFile } from "@/server/storage";

// Public: the logo is shown on the login and careers pages.
export async function GET() {
  const settings = await getAppSettings();

  if (!settings?.logoFilePath || !settings.logoMimeType) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readLogoFile(settings.logoFilePath);

    return new Response(file, {
      headers: {
        "Content-Type": settings.logoMimeType,
        "X-Content-Type-Options": "nosniff",
        // URLs carry a version query that changes on every update.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("logo read failed", error);
    return new Response("Not found", { status: 404 });
  }
}
