export const SESSION_COOKIE_NAME = "recruitment_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type SessionPayload = {
  sub: string;
  role: "admin" | "user";
  exp: number;
};
