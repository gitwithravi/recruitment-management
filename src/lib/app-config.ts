export const DEFAULT_APP_NAME = "Recruitment";

export const APP_NAME =
  process.env.APP_NAME?.trim() || process.env.NEXT_PUBLIC_APP_NAME?.trim() || DEFAULT_APP_NAME;

export function formatAppTitle(title: string) {
  return `${title} · ${APP_NAME}`;
}
