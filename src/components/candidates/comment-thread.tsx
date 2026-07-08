"use client";

import * as React from "react";
import {
  FileText,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  createCommentAction,
  updateCommentAction,
  deleteCommentAction,
  uploadAttachmentAction,
} from "@/features/comments/actions";
import type { CommentItem, MentionableUser } from "@/features/comments/queries";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatFileSize(bytes: string) {
  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function renderBodyWithMentions(body: string) {
  const parts = body.split(/(@[a-zA-Z0-9_-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@") && part.length > 1) {
      return (
        <span key={i} className="font-medium text-primary">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function useMentionAutocomplete(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  mentionableUsers: MentionableUser[],
) {
  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 });

  const filtered = React.useMemo(() => {
    if (!query) return mentionableUsers;
    const lower = query.toLowerCase();
    return mentionableUsers.filter(
      (u) =>
        u.username.toLowerCase().startsWith(lower) ||
        u.name.toLowerCase().includes(lower),
    );
  }, [query, mentionableUsers]);

  function handleInput() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_.-]*)$/);

    if (atMatch) {
      const newQuery = atMatch[1];
      if (newQuery !== query) {
        setSelectedIndex(0);
        setQuery(newQuery);
      }
      setIsOpen(true);

      const textBeforeAt = textBeforeCursor.slice(0, atMatch.index);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const style = window.getComputedStyle(textarea);
        ctx.font = `${style.fontSize} ${style.fontFamily}`;
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const rect = textarea.getBoundingClientRect();
        const lineHeight = parseFloat(style.lineHeight) || parseInt(style.fontSize, 10) * 1.2;
        const lines = textBeforeAt.split("\n");
        const currentLineIndex = lines.length - 1;
        const currentLineText = lines[currentLineIndex] || "";

        ctx.font = `${style.fontSize} ${style.fontFamily}`;
        const currentLineWidth = ctx.measureText(currentLineText).width;

        setMenuPosition({
          top: rect.top + currentLineIndex * lineHeight + lineHeight + 4,
          left: rect.left + paddingLeft + currentLineWidth,
        });
      }
    } else {
      setIsOpen(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!isOpen || filtered.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter" && filtered[selectedIndex]) {
      event.preventDefault();
      insertMention(filtered[selectedIndex].username);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  }

  function insertMention(username: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.slice(0, cursorPos);
    const textAfterCursor = textarea.value.slice(cursorPos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_.-]*)$/);

    if (atMatch) {
      const beforeMention = textBeforeCursor.slice(0, atMatch.index);
      const newValue = `${beforeMention}@${username} ${textAfterCursor}`;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      nativeInputValueSetter?.call(textarea, newValue);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      const newCursorPos = beforeMention.length + username.length + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
      setIsOpen(false);
    }
  }

  return {
    isOpen: isOpen && filtered.length > 0,
    filtered,
    selectedIndex,
    menuPosition,
    handleInput,
    handleKeyDown,
    insertMention,
  };
}

function MentionMenu({
  users,
  selectedIndex,
  position,
  onSelect,
}: {
  users: MentionableUser[];
  selectedIndex: number;
  position: { top: number; left: number };
  onSelect: (username: string) => void;
}) {
  return (
    <div
      className="fixed z-50 max-h-44 w-52 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
      style={{ top: position.top, left: position.left }}
    >
      {users.map((user, index) => (
        <button
          key={user.id}
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
            index === selectedIndex
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50",
          )}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(user.username);
          }}
        >
          <span className="shrink-0 text-xs font-medium">@{user.username}</span>
          <span className="truncate text-xs text-muted-foreground">{user.name}</span>
        </button>
      ))}
    </div>
  );
}

function CommentComposer({
  jobId,
  candidateId,
  mentionableUsers,
  isAdmin,
  initialBody,
  commentId,
  onCancel,
  onSaved,
}: {
  jobId: string;
  candidateId: string;
  mentionableUsers: MentionableUser[];
  isAdmin: boolean;
  initialBody?: string;
  commentId?: string;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = React.useState(initialBody ?? "");
  const [isAdminOnly, setIsAdminOnly] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);

  const mention = useMentionAutocomplete(textareaRef, mentionableUsers);

  React.useEffect(() => {
    if (textareaRef.current && !initialBody) {
      textareaRef.current.focus();
    }
  }, [initialBody]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const formData = new FormData();
      formData.set("body", body);
      formData.set("visibility", isAdminOnly ? "admin" : "job");

      let commentError: string | undefined;
      let savedCommentId: string | undefined;

      if (commentId) {
        const result = await updateCommentAction(commentId, { error: undefined }, formData);
        commentError = result.error;
        savedCommentId = commentId;
      } else {
        const result = await createCommentAction(jobId, candidateId, { error: undefined }, formData);
        commentError = result.error;
        savedCommentId = result.commentId;
      }

      if (commentError) {
        setError(commentError);
        setIsPending(false);
        return;
      }

      if (file && savedCommentId) {
        const attachForm = new FormData();
        attachForm.set("file", file);
        const attachResult = await uploadAttachmentAction(savedCommentId, { error: undefined }, attachForm);
        if (attachResult.error) {
          setError(attachResult.error);
          setIsPending(false);
          return;
        }
      }

      setBody("");
      setFile(null);
      setIsAdminOnly(false);
      onSaved?.();
    } catch {
      setError("Could not save the comment. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onInput={mention.handleInput}
          onKeyDown={mention.handleKeyDown}
          rows={3}
          maxLength={10000}
          placeholder={initialBody ? "Edit your comment..." : "Write a comment... Use @username to mention someone."}
          disabled={isPending}
          className="flex min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {mention.isOpen ? (
          <MentionMenu
            users={mention.filtered}
            selectedIndex={mention.selectedIndex}
            position={mention.menuPosition}
            onSelect={mention.insertMention}
          />
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {isAdmin ? (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch
              checked={isAdminOnly}
              onCheckedChange={setIsAdminOnly}
              disabled={isPending}
            />
            Admin only
          </label>
        ) : null}

        {!commentId ? (
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <Paperclip className="size-4" aria-hidden="true" />
                {file ? file.name : "Attach"}
              </span>
              <input
                type="file"
                className="hidden"
                disabled={isPending}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {file ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setFile(null)}
                disabled={isPending}
              >
                <X className="size-3" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={isPending || (!body.trim() && !file)}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saving...
              </>
            ) : initialBody ? (
              "Save"
            ) : (
              "Comment"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

function CommentActions({
  comment,
  currentUserId,
  isAdmin,
  onEdit,
  onDeleted,
}: {
  comment: CommentItem;
  currentUserId: string;
  isAdmin: boolean;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  const canDelete = comment.author.id === currentUserId || isAdmin;
  const canAttach = comment.author.id === currentUserId;

  async function handleDelete() {
    const result = await deleteCommentAction(comment.id);
    if (!result.error) {
      onDeleted();
    }
  }

  async function handleAttach(formData: FormData) {
    const result = await uploadAttachmentAction(comment.id, { error: undefined }, formData);
    if (!result.error) {
      onDeleted();
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Comment actions"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </Button>
      {isOpen ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-20 min-w-32 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
            {comment.author.id === currentUserId ? (
              <button
                type="button"
                className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm hover:bg-accent"
                onClick={() => {
                  setIsOpen(false);
                  onEdit();
                }}
              >
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </button>
            ) : null}
            {canAttach ? (
              <label className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-sm hover:bg-accent">
                <Paperclip className="size-4" aria-hidden="true" />
                Add file
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const formData = new FormData();
                      formData.set("file", file);
                      handleAttach(formData);
                      setIsOpen(false);
                    }
                  }}
                />
              </label>
            ) : null}
            {canDelete ? (
              <>
                <div className="-mx-1 my-1 h-px bg-border" />
                <button
                  type="button"
                  className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setIsOpen(false);
                    handleDelete();
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function CommentEntry({
  comment,
  jobId,
  candidateId,
  currentUserId,
  isAdmin,
  mentionableUsers,
  onUpdated,
}: {
  comment: CommentItem;
  jobId: string;
  candidateId: string;
  currentUserId: string;
  isAdmin: boolean;
  mentionableUsers: MentionableUser[];
  onUpdated: () => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);

  if (comment.deletedAt) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        Comment deleted
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="rounded-lg border bg-muted/20 px-4 py-3">
        <CommentComposer
          jobId={jobId}
          candidateId={candidateId}
          mentionableUsers={mentionableUsers}
          isAdmin={isAdmin}
          initialBody={comment.body}
          commentId={comment.id}
          onCancel={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false);
            onUpdated();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group rounded-lg border px-4 py-3",
        comment.visibility === "admin" ? "border-amber-500/30 bg-amber-500/5" : "",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="mt-0.5 size-7 shrink-0">
          <AvatarFallback className="text-[10px]">{initials(comment.author.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(comment.createdAt)}
            </span>
            {comment.updatedAt !== comment.createdAt ? (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground italic">edited</span>
              </>
            ) : null}
            {comment.visibility === "admin" ? (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                Admin only
              </Badge>
            ) : null}
          </div>
          <p className="whitespace-pre-line text-sm leading-6">
            {renderBodyWithMentions(comment.body)}
          </p>
          {comment.attachments.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {comment.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={`/jobs/${jobId}/comments/${comment.id}/attachments/${attachment.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1 text-xs hover:bg-muted/50"
                >
                  <FileText className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="max-w-40 truncate">{attachment.fileName}</span>
                  <span className="text-muted-foreground">
                    {formatFileSize(attachment.fileSize)}
                  </span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <CommentActions
          comment={comment}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onEdit={() => setIsEditing(true)}
          onDeleted={onUpdated}
        />
      </div>
    </div>
  );
}

type CommentThreadProps = {
  jobId: string;
  candidateId: string;
  initialComments: CommentItem[];
  mentionableUsers: MentionableUser[];
  currentUserId: string;
  isAdmin: boolean;
};

export function CommentThread({
  jobId,
  candidateId,
  initialComments,
  mentionableUsers,
  currentUserId,
  isAdmin,
}: CommentThreadProps) {
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <div className="space-y-4">
      <CommentComposer
        key={`composer-${refreshKey}`}
        jobId={jobId}
        candidateId={candidateId}
        mentionableUsers={mentionableUsers}
        isAdmin={isAdmin}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />
      {initialComments.length > 0 ? (
        <div className="space-y-3">
          {initialComments.map((comment) => (
            <CommentEntry
              key={comment.id}
              comment={comment}
              jobId={jobId}
              candidateId={candidateId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              mentionableUsers={mentionableUsers}
              onUpdated={() => setRefreshKey((k) => k + 1)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
