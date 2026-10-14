export const DEFAULT_APP_NAME = "Recruitment";

export const APP_NAME =
  process.env.APP_NAME?.trim() || process.env.NEXT_PUBLIC_APP_NAME?.trim() || DEFAULT_APP_NAME;

export function formatAppTitle(title: string) {
  return `${title} · ${APP_NAME}`;
}

/** Public base URL, e.g. https://jobs.example.com. Used for absolute links in structured data. */
export const APP_URL = process.env.APP_URL?.trim().replace(/\/+$/, "") || null;

/** Optional privacy policy link shown next to the consent checkbox on the apply form. */
export const PRIVACY_POLICY_URL = process.env.PRIVACY_POLICY_URL?.trim() || null;
