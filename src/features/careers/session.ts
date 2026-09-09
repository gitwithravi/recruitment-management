import "server-only";

import { cookies } from "next/headers";

import {
  VERIFIED_EMAIL_COOKIE_NAME,
  VERIFIED_EMAIL_MAX_AGE_SECONDS,
} from "@/features/careers/constants";
import {
  createVerifiedEmailToken,
  getAuthSecret,
  verifyVerifiedEmailToken,
} from "@/features/careers/verified-email";

export async function getVerifiedApplyEmail() {
  const cookieStore = await cookies();
  const token = cookieStore.get(VERIFIED_EMAIL_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyVerifiedEmailToken(token, getAuthSecret());
  return payload?.email ?? null;
}

export async function setVerifiedApplyEmailCookie(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    VERIFIED_EMAIL_COOKIE_NAME,
    createVerifiedEmailToken({ email, secret: getAuthSecret() }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: VERIFIED_EMAIL_MAX_AGE_SECONDS,
    },
  );
}

export async function clearVerifiedApplyEmailCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(VERIFIED_EMAIL_COOKIE_NAME);
}
