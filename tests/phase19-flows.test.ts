import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_JOB_STAGES } from "../src/features/jobs/constants.ts";
import {
  findCandidateDuplicate,
  canMoveCandidate,
  shouldDispatchAssignmentNotification,
} from "../src/features/candidates/rules.ts";
import {
  getMentionNotificationRecipientIds,
  parseMentions,
} from "../src/features/comments/mentions.ts";
import { canViewOfferDetails } from "../src/features/offers/rules.ts";
import {
  LoginAttemptLimiter,
  formatRetryAfter,
  getLoginRateLimitKey,
} from "../src/server/auth/rate-limit.ts";

test("job creation flow has the required default stages in order", () => {
  assert.deepEqual(
    [...DEFAULT_JOB_STAGES],
    [
      "Backlog",
      "Contacted",
      "Interview Scheduled",
      "Interview Feedback Received",
      "Recommendation Sent",
      "Offered",
      "Accepted/Rejected",
      "Joined",
    ],
  );
});

test("candidate create flow rejects duplicates inside the same job", () => {
  const duplicate = findCandidateDuplicate({
    existing: { email: "candidate@example.com", phone: "+91 99999 99999" },
    email: "candidate@example.com",
    phone: "+91 88888 88888",
  });

  assert.equal(duplicate, "email");
});

test("move flow permits only admins or assigned users before history is written", () => {
  assert.equal(
    canMoveCandidate({ userRole: "admin", userId: "admin", assignedUserId: "user-1" }),
    true,
  );
  assert.equal(
    canMoveCandidate({ userRole: "user", userId: "user-1", assignedUserId: "user-1" }),
    true,
  );
  assert.equal(
    canMoveCandidate({ userRole: "user", userId: "user-2", assignedUserId: "user-1" }),
    false,
  );
});

test("assign flow notifies the new assignee when the actor assigns someone else", () => {
  assert.equal(
    shouldDispatchAssignmentNotification({ actorUserId: "user-1", newAssigneeId: "user-2" }),
    true,
  );
});

test("comment mention flow notifies valid mentioned users except the actor", () => {
  const validUsernames = new Map([
    ["alice", "user-1"],
    ["ravi", "user-2"],
  ]);
  const mentioned = parseMentions("Looping in @alice and @ravi", validUsernames);

  assert.deepEqual(getMentionNotificationRecipientIds(mentioned, "user-1"), ["user-2"]);
});

test("offer flow keeps offer details admin-only", () => {
  assert.equal(canViewOfferDetails("admin"), true);
  assert.equal(canViewOfferDetails("user"), false);
});

test("login flow rate-limits repeated failures and resets on success", () => {
  const limiter = new LoginAttemptLimiter(2, 60_000, 120_000);
  const key = getLoginRateLimitKey({
    identifier: "admin",
    forwardedFor: "203.0.113.5, 10.0.0.1",
  });

  assert.equal(key, "203.0.113.5:admin");
  assert.equal(limiter.check(key, 1_000).allowed, true);
  assert.equal(limiter.recordFailure(key, 1_000).allowed, true);

  const blocked = limiter.recordFailure(key, 2_000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 120);
  assert.equal(
    formatRetryAfter(blocked.retryAfterSeconds),
    "Too many failed attempts. Try again in 2 minutes.",
  );

  limiter.recordSuccess(key);
  assert.equal(limiter.check(key, 3_000).allowed, true);
});
