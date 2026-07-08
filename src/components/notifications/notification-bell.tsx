"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/features/notifications/actions";
import type { NotificationItem } from "@/features/notifications/queries";
import { cn } from "@/lib/utils";

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function BellDropdown({
  notifications: serverNotifications,
  unreadCount: serverUnreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState(serverNotifications);
  const [unreadCount, setUnreadCount] = React.useState(serverUnreadCount);

  async function handleMarkRead(notificationId: string) {
    await markNotificationReadAction(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date() } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })));
    setUnreadCount(0);
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="size-4" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-popover text-popover-foreground shadow-md">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="size-3.5" aria-hidden="true" />
                  Mark all read
                </Button>
              ) : null}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((notification) => {
                  const isUnread = !notification.readAt;
                  return (
                    <Link
                      key={notification.id}
                      href={
                        notification.relatedJobId && notification.relatedCandidateId
                          ? `/jobs/${notification.relatedJobId}/candidates/${notification.relatedCandidateId}`
                          : "/notifications"
                      }
                      onClick={() => {
                        if (isUnread) {
                          handleMarkRead(notification.id);
                        }
                        setIsOpen(false);
                      }}
                      className={cn(
                        "block border-b px-4 py-3 text-sm transition-colors hover:bg-accent/50",
                        isUnread && "bg-primary/5",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-snug", isUnread && "font-medium")}>
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-snug text-muted-foreground line-clamp-2">
                        {notification.body}
                      </p>
                    </Link>
                  );
                })
              )}
            </div>
            <div className="border-t px-4 py-2">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-xs text-muted-foreground hover:text-foreground"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationItem[];
  initialUnreadCount: number;
}) {
  return (
    <BellDropdown
      key={`${initialNotifications.length}-${initialUnreadCount}-${initialNotifications.map((n) => n.id + (n.readAt ? "1" : "0")).join(",")}`}
      notifications={initialNotifications}
      unreadCount={initialUnreadCount}
    />
  );
}
