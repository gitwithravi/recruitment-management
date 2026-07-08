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
