import { createHmac, timingSafeEqual } from "node:crypto";

import { base64UrlDecode, base64UrlEncode } from "../../server/auth/encoding.ts";
import { VERIFIED_EMAIL_MAX_AGE_SECONDS } from "./constants.ts";

export type VerifiedEmailPayload = {
  email: string;
  exp: number;
};

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createVerifiedEmailToken(input: {
  email: string;
  secret: string;
  now?: number;
  maxAgeSeconds?: number;
}) {
  const issuedAt = input.now ?? Date.now();
  const payload: VerifiedEmailPayload = {
    email: input.email,
    exp: Math.floor(issuedAt / 1000) + (input.maxAgeSeconds ?? VERIFIED_EMAIL_MAX_AGE_SECONDS),
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload, input.secret)}`;
}

export function verifyVerifiedEmailToken(
  token: string,
  secret: string,
  now = Date.now(),
): VerifiedEmailPayload | null {
  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  const expectedSignature = sign(encodedPayload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as VerifiedEmailPayload;

    if (!payload.email || payload.exp < Math.floor(now / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  }

  return secret;
}
