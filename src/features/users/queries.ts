import "server-only";

import { prisma } from "@/db/client";
import type { CurrentUser } from "@/server/auth/session";

export type AdminUserListItem = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: Date;
};

export type AdminUserDetail = AdminUserListItem;

function toAdminUser(user: {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: Date;
}): AdminUserListItem {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export async function listUsersForAdmin(): Promise<AdminUserListItem[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return users.map(toAdminUser);
}

export async function getUserForAdmin(userId: string): Promise<AdminUserDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user ? toAdminUser(user) : null;
}

export function isSelf(user: CurrentUser, targetId: string) {
  return user.id === targetId;
}
