export type CandidateDuplicateField = "email" | "phone";

export function findCandidateDuplicate(input: {
  existing: { email: string; phone: string } | null | undefined;
  email: string;
  phone: string;
}): CandidateDuplicateField | null {
  if (input.existing?.email === input.email) {
    return "email";
  }

  if (input.existing?.phone === input.phone) {
    return "phone";
  }

  return null;
}

export function canManageCandidateAssignment(input: {
  userRole: "admin" | "user";
  userId: string;
  assignedUserId: string | null;
}) {
  return input.userRole === "admin" || input.assignedUserId === input.userId;
}

export function canMoveCandidate(input: {
  userRole: "admin" | "user";
  userId: string;
  assignedUserId: string | null;
}) {
  return canManageCandidateAssignment(input);
}

export function shouldDispatchAssignmentNotification(input: {
  actorUserId: string;
  newAssigneeId: string | null;
}) {
  return Boolean(input.newAssigneeId && input.newAssigneeId !== input.actorUserId);
}
