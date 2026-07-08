import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage");
const RESUME_ROOT = path.join(STORAGE_ROOT, "resumes");
const RESUME_RELATIVE_ROOT = path.join("storage", "resumes");
const ATTACHMENT_ROOT = path.join(STORAGE_ROOT, "attachments");
const ATTACHMENT_RELATIVE_ROOT = path.join("storage", "attachments");

function safeFileName(fileName: string) {
  const parsed = path.parse(fileName);
  const base = parsed.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const ext = parsed.ext
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "")
    .slice(0, 12);

  return `${base || "resume"}${ext || ".bin"}`;
}

export async function saveResumeFile(input: { jobId: string; candidateId: string; file: File }) {
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const directory = path.join(RESUME_ROOT, input.jobId, input.candidateId);
  const fileName = `${Date.now()}-${safeFileName(input.file.name)}`;
  const absolutePath = path.join(directory, fileName);

  await mkdir(directory, { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    absolutePath,
    relativePath: path.relative(process.cwd(), absolutePath),
    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    size: bytes.length,
  };
}

export async function readStoredFile(relativePath: string) {
  const normalized = path.normalize(relativePath);

  if (!normalized.startsWith(`${RESUME_RELATIVE_ROOT}${path.sep}`)) {
    throw new Error("Invalid storage path.");
  }

  const absolutePath = path.join(RESUME_ROOT, path.relative(RESUME_RELATIVE_ROOT, normalized));
  return readFile(absolutePath);
}

export async function deleteStoredFile(relativePath: string | null | undefined) {
  if (!relativePath) return;

  const normalized = path.normalize(relativePath);

  if (
    !normalized.startsWith(`${RESUME_RELATIVE_ROOT}${path.sep}`) &&
    !normalized.startsWith(`${ATTACHMENT_RELATIVE_ROOT}${path.sep}`)
  ) {
    return;
  }

  const root = normalized.startsWith(`${RESUME_RELATIVE_ROOT}${path.sep}`)
    ? RESUME_ROOT
    : ATTACHMENT_ROOT;
  const relativeRoot = normalized.startsWith(`${RESUME_RELATIVE_ROOT}${path.sep}`)
    ? RESUME_RELATIVE_ROOT
    : ATTACHMENT_RELATIVE_ROOT;

  const absolutePath = path.join(root, path.relative(relativeRoot, normalized));
  await rm(absolutePath, { force: true });
}

export async function saveAttachmentFile(input: {
  jobId: string;
  commentId: string;
  file: File;
}) {
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const directory = path.join(ATTACHMENT_ROOT, input.jobId, input.commentId);
  const fileName = `${Date.now()}-${safeFileName(input.file.name)}`;
  const absolutePath = path.join(directory, fileName);

  await mkdir(directory, { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    absolutePath,
    relativePath: path.relative(process.cwd(), absolutePath),
    fileName: input.file.name,
    mimeType: input.file.type || "application/octet-stream",
    size: bytes.length,
  };
}

export async function readAttachmentFile(relativePath: string) {
  const normalized = path.normalize(relativePath);

  if (!normalized.startsWith(`${ATTACHMENT_RELATIVE_ROOT}${path.sep}`)) {
    throw new Error("Invalid attachment path.");
  }

  const absolutePath = path.join(
    ATTACHMENT_ROOT,
    path.relative(ATTACHMENT_RELATIVE_ROOT, normalized),
  );
  return readFile(absolutePath);
}
