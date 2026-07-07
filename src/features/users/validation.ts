import "server-only";

import { prisma } from "@/db/client";

export type UserFieldErrors = {
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  password?: string;
};

export type CreateUserInput = {
  name: string;
  username: string;
  email: string;
  role: "admin" | "user";
  password: string;
};

export type UpdateUserInput = {
  name: string;
  email: string;
  role: "admin" | "user";
};

const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PATTERN = /^(?=.*[a-zA-Z])(?=.*\d).+$/;

export function parseRole(value: string | undefined): "admin" | "user" | undefined {
  if (value === "admin" || value === "user") {
    return value;
  }
  return undefined;
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function validateCreateUser(input: {
  name: string;
  username: string;
  email: string;
  role: string | undefined;
  password: string;
}): Promise<{ errors: UserFieldErrors; input: CreateUserInput | null }> {
  const errors: UserFieldErrors = {};
  const name = input.name.trim();
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);
  const role = parseRole(input.role);
  const password = input.password;

  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length > 80) {
    errors.name = "Name must be 80 characters or fewer.";
  }

  if (!username) {
    errors.username = "Username is required.";
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username = "Use 3-32 lowercase letters, numbers, or underscores.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!role) {
    errors.role = "Select a role.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  } else if (!PASSWORD_PATTERN.test(password)) {
    errors.password = "Password must include letters and numbers.";
  }

  if (errors.username || errors.email) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { username: true, email: true },
    });

    if (existing?.username === username) {
      errors.username = "This username is already taken.";
    }
    if (existing?.email === email) {
      errors.email = "This email is already in use.";
    }
  }

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    input: hasErrors || !role ? null : { name, username, email, role, password },
  };
}

export async function validateUpdateUser(
  targetUserId: string,
  input: { name: string; email: string; role: string | undefined },
): Promise<{ errors: Omit<UserFieldErrors, "password">; input: UpdateUserInput | null }> {
  const errors: Omit<UserFieldErrors, "password"> = {};
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const role = parseRole(input.role);

  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length > 80) {
    errors.name = "Name must be 80 characters or fewer.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!role) {
    errors.role = "Select a role.";
  }

  if (errors.email) {
    return { errors, input: null };
  }

  const conflict = await prisma.user.findFirst({
    where: { email, NOT: { id: targetUserId } },
    select: { id: true },
  });

  if (conflict) {
    errors.email = "This email is already in use.";
  }

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    input: hasErrors || !role ? null : { name, email, role },
  };
}

export function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Password is required.";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!PASSWORD_PATTERN.test(password)) {
    return "Password must include letters and numbers.";
  }
  return undefined;
}
