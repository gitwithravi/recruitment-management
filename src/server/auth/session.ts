import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/db/client";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type SessionPayload,
} from "@/server/auth/constants";
import { createSessionToken, verifySessionToken } from "@/server/auth/token";

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "user";
};

export async function createSession(user: Pick<CurrentUser, "id" | "role">) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload: SessionPayload = {
    sub: user.id,
    role: user.role,
    exp: expiresAt,
  };
  const token = createSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionPayload();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user?.isActive) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "admin") {
    redirect("/");
  }

  return user;
}

export async function requireJobAccess(jobId: string) {
  const user = await requireUser();

  if (user.role === "admin") {
    return user;
  }

  const membership = await prisma.jobUser.findUnique({
    where: {
      jobId_userId: {
        jobId,
        userId: user.id,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    redirect("/");
  }

  return user;
}
