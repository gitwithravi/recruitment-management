export const ATTACHMENT_MAX_SIZE_BYTES = 25 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "text/csv",
  "text/plain",
]);

export function validateAttachmentFile(
  file: Pick<File, "size" | "type"> | null,
  options: { required: boolean },
) {
  if (!file || file.size === 0) {
    return options.required ? "Select a file to upload." : undefined;
  }

  if (file.size > ATTACHMENT_MAX_SIZE_BYTES) {
    return "File must be 25 MB or smaller.";
  }

  if (file.type && !ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    return "Upload a PDF, Word, Excel, image, CSV, or text file.";
  }

  return undefined;
}

export const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024;

// SVG is deliberately excluded: it can carry scripts and the logo is served from our own origin.
export const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function validateLogoFile(file: Pick<File, "size" | "type"> | null) {
  if (!file || file.size === 0) {
    return undefined;
  }

  if (file.size > LOGO_MAX_SIZE_BYTES) {
    return "Logo must be 2 MB or smaller.";
  }

  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    return "Upload a PNG, JPEG, or WebP image.";
  }

  return undefined;
}
