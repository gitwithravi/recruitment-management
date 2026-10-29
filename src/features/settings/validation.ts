export const APP_NAME_MAX_LENGTH = 60;

export function normalizeAppName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** Empty means "use the default name", so only an over-long value is an error. */
export function validateAppName(value: string) {
  const name = normalizeAppName(value);

  if (name.length > APP_NAME_MAX_LENGTH) {
    return { error: `App name must be ${APP_NAME_MAX_LENGTH} characters or fewer.` };
  }

  return { name: name || null };
}
