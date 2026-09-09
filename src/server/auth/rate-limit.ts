const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_LOCKOUT_MS = 15 * 60 * 1000;

type AttemptRecord = {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
};

export class LoginAttemptLimiter {
  private attempts = new Map<string, AttemptRecord>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly lockoutMs: number;

  constructor(
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    windowMs = DEFAULT_WINDOW_MS,
    lockoutMs = DEFAULT_LOCKOUT_MS,
  ) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.lockoutMs = lockoutMs;
  }

  check(key: string, now = Date.now()) {
    const record = this.attempts.get(key);

    if (!record) {
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (record.lockedUntil && record.lockedUntil > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
      };
    }

    if (record.lockedUntil || now - record.firstAttemptAt > this.windowMs) {
      this.attempts.delete(key);
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }

  recordFailure(key: string, now = Date.now()) {
    const checked = this.check(key, now);
    if (!checked.allowed) {
      return checked;
    }

    const current = this.attempts.get(key);
    const record =
      current && now - current.firstAttemptAt <= this.windowMs
        ? current
        : { count: 0, firstAttemptAt: now, lockedUntil: null };

    record.count += 1;

    if (record.count >= this.maxAttempts) {
      record.lockedUntil = now + this.lockoutMs;
    }

    this.attempts.set(key, record);
    return this.check(key, now);
  }

  recordSuccess(key: string) {
    this.attempts.delete(key);
  }
}

export const loginAttemptLimiter = new LoginAttemptLimiter();

export class SlidingWindowLimiter {
  private events = new Map<string, number[]>();
  private readonly maxEvents: number;
  private readonly windowMs: number;

  constructor(maxEvents: number, windowMs: number) {
    this.maxEvents = maxEvents;
    this.windowMs = windowMs;
  }

  consume(key: string, now = Date.now()) {
    const cutoff = now - this.windowMs;
    const timestamps = (this.events.get(key) ?? []).filter((timestamp) => timestamp > cutoff);

    if (timestamps.length >= this.maxEvents) {
      this.events.set(key, timestamps);
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((timestamps[0] + this.windowMs - now) / 1000),
      );
      return { allowed: false, retryAfterSeconds };
    }

    timestamps.push(now);
    this.events.set(key, timestamps);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function getClientIp(input: { forwardedFor?: string | null; realIp?: string | null }) {
  return input.forwardedFor?.split(",")[0]?.trim() || input.realIp || "unknown";
}

export function getLoginRateLimitKey(input: {
  identifier: string;
  forwardedFor?: string | null;
  realIp?: string | null;
}) {
  return `${getClientIp(input)}:${input.identifier}`;
}

export function formatRetryAfter(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
