"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck, ExternalLink, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import type { NotificationItem } from "@/features/notifications/queries";
import { cn } from "@/lib/utils";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function NotificationList({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [isMarkingAll, setIsMarkingAll] = React.useState(false);

  async function handleMarkRead(notificationId: string) {
    await markNotificationReadAction(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, readAt: new Date() } : n)),
    );
  }

  async function handleMarkAllRead() {
    setIsMarkingAll(true);
    await markAllNotificationsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date() })));
    setIsMarkingAll(false);
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          nativeButton={false}
          render={<Link href="/" />}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Dashboard
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "You&apos;re all caught up"}
            </p>
          </div>
          {unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
            >
              {isMarkingAll ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCheck className="size-4" aria-hidden="true" />
                  Mark all read
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <Bell className="size-10 text-muted-foreground/50" aria-hidden="true" />
              <p className="mt-4 text-sm font-medium">No notifications</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You&apos;ll see notifications for candidate assignments and comment mentions here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const isUnread = !notification.readAt;
                const linkHref =
                  notification.relatedJobId && notification.relatedCandidateId
                    ? `/jobs/${notification.relatedJobId}/candidates/${notification.relatedCandidateId}`
                    : undefined;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group px-4 py-3 transition-colors hover:bg-accent/30 sm:px-6",
                      isUnread && "bg-primary/5",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm",
                              isUnread && "font-medium",
                            )}
                          >
                            {notification.title}
                          </span>
                          {isUnread ? (
                            <span className="shrink-0 size-1.5 rounded-full bg-primary" aria-hidden="true" />
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.body}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {isUnread ? (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="Mark as read"
                            onClick={() => handleMarkRead(notification.id)}
                          >
                            <CheckCheck className="size-3.5" aria-hidden="true" />
                          </Button>
                        ) : null}
                        {linkHref ? (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label="View candidate"
                            nativeButton={false}
                            render={<Link href={linkHref} />}
                          >
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function NotificationsPage({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const key = initialNotifications
    .map((n) => `${n.id}:${n.readAt ? "1" : "0"}`)
    .join(",");

  return <NotificationList key={key} initialNotifications={initialNotifications} />;
}
