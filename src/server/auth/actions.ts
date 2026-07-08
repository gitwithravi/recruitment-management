"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { prisma } from "@/db/client";
import { clearSession, createSession } from "@/server/auth/session";
import { verifyPassword } from "@/server/auth/password";
import {
  formatRetryAfter,
  getLoginRateLimitKey,
  loginAttemptLimiter,
} from "@/server/auth/rate-limit";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Enter your username or email and password." };
  }

  const headerStore = await headers();
  const limitKey = getLoginRateLimitKey({
    identifier,
    forwardedFor: headerStore.get("x-forwarded-for"),
    realIp: headerStore.get("x-real-ip"),
  });
  const rateLimit = loginAttemptLimiter.check(limitKey);

  if (!rateLimit.allowed) {
    return { error: formatRetryAfter(rateLimit.retryAfterSeconds) };
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
    },
    select: {
      id: true,
      role: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!user?.isActive) {
    loginAttemptLimiter.recordFailure(limitKey);
    return { error: "Invalid credentials." };
  }

  const passwordMatches = await verifyPassword(user.passwordHash, password);

  if (!passwordMatches) {
    loginAttemptLimiter.recordFailure(limitKey);
    return { error: "Invalid credentials." };
  }

  loginAttemptLimiter.recordSuccess(limitKey);
  await createSession({ id: user.id, role: user.role });
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
