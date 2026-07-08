import assert from "node:assert/strict";
import test from "node:test";

import { toCsv, sanitizeFilename } from "../src/server/csv.ts";
import { validateAttachmentFile } from "../src/server/upload-validation.ts";
import {
  canManageCandidateAssignment,
  canMoveCandidate,
  findCandidateDuplicate,
  shouldDispatchAssignmentNotification,
} from "../src/features/candidates/rules.ts";
import {
  parseMentions,
  buildMentionReplacements,
  getMentionNotificationRecipientIds,
} from "../src/features/comments/mentions.ts";
import { assertStageDeleteAllowed } from "../src/features/jobs/rules.ts";
import { canViewOfferDetails } from "../src/features/offers/rules.ts";

test("duplicate candidate logic detects email before phone", () => {
  assert.equal(
    findCandidateDuplicate({
      existing: { email: "one@example.com", phone: "1111111" },
      email: "one@example.com",
      phone: "2222222",
    }),
    "email",
  );

  assert.equal(
    findCandidateDuplicate({
      existing: { email: "one@example.com", phone: "1111111" },
      email: "two@example.com",
      phone: "1111111",
    }),
    "phone",
  );

  assert.equal(
    findCandidateDuplicate({
      existing: null,
      email: "two@example.com",
      phone: "2222222",
    }),
    null,
  );
});

test("stage delete guard rejects stages with candidates", () => {
  assert.doesNotThrow(() => assertStageDeleteAllowed(0));
  assert.throws(
    () => assertStageDeleteAllowed(1),
    /Stage cannot be deleted while candidates exist in it/,
  );
});

test("assignment and move permissions allow admins and current assignees only", () => {
  assert.equal(
    canManageCandidateAssignment({
      userRole: "admin",
      userId: "admin-1",
      assignedUserId: null,
    }),
    true,
  );
  assert.equal(
    canManageCandidateAssignment({
      userRole: "user",
      userId: "user-1",
      assignedUserId: "user-1",
    }),
    true,
  );
  assert.equal(
    canManageCandidateAssignment({
      userRole: "user",
      userId: "user-2",
      assignedUserId: "user-1",
    }),
    false,
  );
  assert.equal(
    canMoveCandidate({
      userRole: "user",
      userId: "user-2",
      assignedUserId: null,
    }),
    false,
  );
});

test("assignment notifications skip self-assignment and unassignment", () => {
  assert.equal(
    shouldDispatchAssignmentNotification({ actorUserId: "user-1", newAssigneeId: "user-2" }),
    true,
  );
  assert.equal(
    shouldDispatchAssignmentNotification({ actorUserId: "user-1", newAssigneeId: "user-1" }),
    false,
  );
  assert.equal(
    shouldDispatchAssignmentNotification({ actorUserId: "user-1", newAssigneeId: null }),
    false,
  );
});

test("mention parsing is case-insensitive, unique, and valid-user scoped", () => {
  const validUsernames = new Map([
    ["alice", "user-1"],
    ["bob_smith", "user-2"],
  ]);

  assert.deepEqual(
    parseMentions("@Alice please check with @bob_smith and @unknown and @ALICE", validUsernames),
    ["user-1", "user-2"],
  );
});

test("mention replacement normalizes matched usernames", () => {
  const userMap = new Map([
    ["user-1", { username: "Alice" }],
    ["user-2", { username: "bob_smith" }],
  ]);

  assert.equal(
    buildMentionReplacements("@alice and @BOB_SMITH are assigned", ["user-1", "user-2"], userMap),
    "@Alice and @bob_smith are assigned",
  );
});

test("mention notification recipients skip the actor", () => {
  assert.deepEqual(getMentionNotificationRecipientIds(["user-1", "user-2"], "user-1"), ["user-2"]);
});

test("offer visibility is admin-only", () => {
  assert.equal(canViewOfferDetails("admin"), true);
  assert.equal(canViewOfferDetails("user"), false);
});

test("CSV serializer escapes quotes, commas, and newlines", () => {
  assert.equal(
    toCsv([
      ["Name", "Notes"],
      ["Alice", "Good, strong fit"],
      ["Bob", 'Said "yes"\nNeeds follow-up'],
    ]),
    'Name,Notes\r\nAlice,"Good, strong fit"\r\nBob,"Said ""yes""\nNeeds follow-up"',
  );
});

test("CSV filename sanitizer removes unsafe characters", () => {
  assert.equal(
    sanitizeFilename("Senior Engineer / Platform: India"),
    "Senior_Engineer_Platform_India",
  );
});

test("attachment validation enforces required, size, and MIME rules", () => {
  assert.equal(validateAttachmentFile(null, { required: true }), "Select a file to upload.");
  assert.equal(
    validateAttachmentFile({ size: 26 * 1024 * 1024, type: "application/pdf" }, { required: true }),
    "File must be 25 MB or smaller.",
  );
  assert.equal(
    validateAttachmentFile({ size: 1024, type: "application/x-msdownload" }, { required: true }),
    "Upload a PDF, Word, Excel, image, CSV, or text file.",
  );
  assert.equal(
    validateAttachmentFile({ size: 1024, type: "application/pdf" }, { required: true }),
    undefined,
  );
});
