export function isSmtpReady(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
) {
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS?.trim();
  const from = env.SMTP_FROM?.trim() || user;

  return Boolean(host && user && pass && from);
}
