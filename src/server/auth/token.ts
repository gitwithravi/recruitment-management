import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { base64UrlDecode, base64UrlEncode } from "@/server/auth/encoding";
import type { SessionPayload } from "@/server/auth/constants";

const header = {
  alg: "HS256",
  typ: "JWT",
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

export function createSessionToken(payload: SessionPayload) {
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  return `${signingInput}.${sign(signingInput)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(signingInput);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const decodedHeader = JSON.parse(base64UrlDecode(encodedHeader)) as typeof header;

    if (decodedHeader.alg !== header.alg || decodedHeader.typ !== header.typ) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;

    if (!payload.sub || !payload.role || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
