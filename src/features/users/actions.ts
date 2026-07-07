"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/client";
import { writeAuditLog } from "@/server/audit";
import { hashPassword } from "@/server/auth/password";
import { requireAdmin } from "@/server/auth/session";
import { isSelf, listUsersForAdmin } from "@/features/users/queries";
import {
  validateCreateUser,
  validatePassword,
  validateUpdateUser,
  type UserFieldErrors,
} from "@/features/users/validation";

export type CreateUserState = {
  errors: UserFieldErrors;
  generic?: string;
};

export type UpdateUserState = {
  errors: Omit<UserFieldErrors, "password">;
  generic?: string;
};

export type ResetPasswordState = {
  error?: string;
};

export type ToggleActiveState = {
  error?: string;
};

const EMPTY_CREATE_ERRORS: UserFieldErrors = {};
const EMPTY_UPDATE_ERRORS: Omit<UserFieldErrors, "password"> = {};

export async function createUserAction(
  _previousState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const admin = await requireAdmin();

  const { errors, input } = await validateCreateUser({
    name: String(formData.get("name") ?? ""),
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!input) {
    return { errors };
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          username: input.username,
          email: input.email,
          role: input.role,
          passwordHash: await hashPassword(input.password),
        },
        select: { id: true, username: true, email: true, role: true, name: true },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "user_created",
        entityType: "user",
        entityId: user.id,
        metadata: {
          username: user.username,
          email: user.email,
          role: user.role,
          name: user.name,
        },
      });

      return user;
    });

    revalidatePath("/admin/users");
    void created;
    return { errors: EMPTY_CREATE_ERRORS };
  } catch (error) {
    console.error("createUserAction failed", error);
    return {
      errors: EMPTY_CREATE_ERRORS,
      generic: "Could not create the user. Please try again.",
    };
  }
}

export async function updateUserAction(
  userId: string,
  _previousState: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> {
  const admin = await requireAdmin();

  const { errors, input } = await validateUpdateUser(userId, {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
  });

  if (!input) {
    return { errors };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const before = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true },
      });

      if (!before) {
        throw new Error("USER_NOT_FOUND");
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
        },
        select: { id: true, name: true, email: true, role: true },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "user_updated",
        entityType: "user",
        entityId: updated.id,
        metadata: {
          name: updated.name,
          email: updated.email,
          role: updated.role,
        },
      });
    });

    revalidatePath("/admin/users");
    return { errors: EMPTY_UPDATE_ERRORS };
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return {
        errors: EMPTY_UPDATE_ERRORS,
        generic: "This user no longer exists.",
      };
    }
    console.error("updateUserAction failed", error);
    return {
      errors: EMPTY_UPDATE_ERRORS,
      generic: "Could not update the user. Please try again.",
    };
  }
}

export async function resetUserPasswordAction(
  userId: string,
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const admin = await requireAdmin();

  const password = String(formData.get("password") ?? "");
  const error = validatePassword(password);

  if (error) {
    return { error };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
      });

      if (!existing) {
        throw new Error("USER_NOT_FOUND");
      }

      await tx.user.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(password) },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: "user_updated",
        entityType: "user",
        entityId: existing.id,
        metadata: { resetPassword: true, username: existing.username },
      });
    });

    revalidatePath("/admin/users");
    return {};
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return { error: "This user no longer exists." };
    }
    console.error("resetUserPasswordAction failed", error);
    return { error: "Could not reset the password. Please try again." };
  }
}

export async function toggleUserActiveAction(userId: string): Promise<ToggleActiveState> {
  const admin = await requireAdmin();

  if (isSelf(admin, userId)) {
    return { error: "You cannot deactivate your own account." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true, username: true, name: true },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      const nextActive = !user.isActive;

      await tx.user.update({
        where: { id: userId },
        data: { isActive: nextActive },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        action: nextActive ? "user_updated" : "user_deactivated",
        entityType: "user",
        entityId: user.id,
        metadata: {
          username: user.username,
          name: user.name,
          previousActive: user.isActive,
          nextActive,
        },
      });
    });

    revalidatePath("/admin/users");
    return {};
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return { error: "This user no longer exists." };
    }
    console.error("toggleUserActiveAction failed", error);
    return { error: "Could not update this user. Please try again." };
  }
}

export async function refreshUsersAction() {
  await requireAdmin();
  revalidatePath("/admin/users");
  return await listUsersForAdmin();
}
