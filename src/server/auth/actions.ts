"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/db/client";
import { clearSession, createSession } from "@/server/auth/session";
import { verifyPassword } from "@/server/auth/password";

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
    return { error: "Invalid credentials." };
  }

  const passwordMatches = await verifyPassword(user.passwordHash, password);

  if (!passwordMatches) {
    return { error: "Invalid credentials." };
  }

  await createSession({ id: user.id, role: user.role });
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
