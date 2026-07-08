export function parseMentions(body: string, validUsernames: Map<string, string>): string[] {
  const mentioned = new Set<string>();
  const regex = /@([a-zA-Z0-9_-]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(body)) !== null) {
    const username = match[1].toLowerCase();
    const userId = validUsernames.get(username);

    if (userId) {
      mentioned.add(userId);
    }
  }

  return [...mentioned];
}

export function buildMentionReplacements(
  body: string,
  mentionedUserIds: string[],
  userMap: Map<string, { username: string }>,
): string {
  let result = body;
  for (const userId of mentionedUserIds) {
    const user = userMap.get(userId);

    if (user) {
      const regex = new RegExp(`@${user.username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      result = result.replace(regex, `@${user.username}`);
    }
  }

  return result;
}

export function getMentionNotificationRecipientIds(
  mentionedUserIds: string[],
  actorUserId: string,
) {
  return mentionedUserIds.filter((id) => id !== actorUserId);
}
