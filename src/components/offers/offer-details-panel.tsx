"use client";

import * as React from "react";
import { Calendar, DollarSign, Loader2, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { upsertOfferAction } from "@/features/offers/actions";
import type { OfferDetail } from "@/features/offers/queries";

const STATUS_OPTIONS = [
  { value: "not_offered", label: "Not Offered" },
  { value: "offered", label: "Offered" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "joined", label: "Joined" },
] as const;

function formatDate(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function OfferDetailsPanel({
  candidateId,
  initialOffer,
}: {
  candidateId: string;
  initialOffer: OfferDetail | null;
}) {
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await upsertOfferAction(candidateId, { error: undefined }, formData);
      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("Could not save offer details. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="offer-ctc">Offered CTC</Label>
          <div className="relative">
            <DollarSign className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="offer-ctc"
              name="offeredCtc"
              type="text"
              inputMode="decimal"
              defaultValue={initialOffer?.offeredCtc ?? ""}
              placeholder="0.00"
              disabled={isPending}
              className="h-9 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="offer-status">Offer Status</Label>
          <div className="relative">
            <Tag className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <select
              id="offer-status"
              name="offerStatus"
              defaultValue={initialOffer?.offerStatus ?? "not_offered"}
              disabled={isPending}
              className="h-9 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="offer-date">Offer Date</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="offer-date"
              name="offerDate"
              type="date"
              defaultValue={formatDate(initialOffer?.offerDate ?? null)}
              disabled={isPending}
              className="h-9 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="joining-date">Joining Date</Label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="joining-date"
              name="joiningDate"
              type="date"
              defaultValue={formatDate(initialOffer?.joiningDate ?? null)}
              disabled={isPending}
              className="h-9 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Saving...
          </>
        ) : (
          "Save offer details"
        )}
      </Button>
    </form>
  );
}
