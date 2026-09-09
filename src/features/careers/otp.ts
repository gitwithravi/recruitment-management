import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { OTP_LENGTH } from "./constants.ts";

export function generateOtpCode() {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export function hashOtpCode(input: { code: string; email: string; secret: string }) {
  return createHmac("sha256", input.secret).update(`${input.email}:${input.code}`).digest("hex");
}

export function otpHashesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function normalizeOtpCode(value: string) {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}
