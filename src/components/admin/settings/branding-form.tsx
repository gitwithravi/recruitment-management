"use client";

import * as React from "react";
import { useActionState } from "react";
import { BriefcaseBusiness, CheckCircle2, Loader2, Save } from "lucide-react";

import { AppLogo } from "@/components/branding/app-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBrandingAction, type UpdateBrandingState } from "@/features/settings/actions";
import { APP_NAME_MAX_LENGTH } from "@/features/settings/validation";

const initialState: UpdateBrandingState = { errors: {} };

export function BrandingForm({
  appName,
  defaultAppName,
  logoUrl,
}: {
  /** The saved custom name, or empty when the default is in use. */
  appName: string;
  defaultAppName: string;
  logoUrl: string | null;
}) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    async (previousState: UpdateBrandingState, formData: FormData) => {
      const result = await updateBrandingAction(previousState, formData);
      // The form resets on submit, so drop the local preview once the logo is saved.
      if (result.success) setPreview(null);
      return result;
    },
    initialState,
  );

  React.useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const shownLogo = preview ?? logoUrl;

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="appName">App name</Label>
        <Input
          id="appName"
          name="appName"
          defaultValue={appName}
          placeholder={defaultAppName}
          maxLength={APP_NAME_MAX_LENGTH}
          aria-invalid={Boolean(state.errors.appName)}
          aria-describedby="appName-hint"
        />
        {state.errors.appName ? (
          <p className="text-xs text-destructive">{state.errors.appName}</p>
        ) : (
          <p id="appName-hint" className="text-xs text-muted-foreground">
            Shown in the header, login page, careers pages, browser tabs, and emails. Leave empty to
            use &ldquo;{defaultAppName}&rdquo;.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">Logo</Label>
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border bg-muted/30 p-2">
            <AppLogo
              logoUrl={shownLogo}
              className="size-full"
              fallback={
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BriefcaseBusiness className="size-5" aria-hidden="true" />
                </span>
              }
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-invalid={Boolean(state.errors.logo)}
              onChange={(event) => {
                const file = event.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
            {logoUrl ? (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" name="removeLogo" className="size-4 accent-primary" />
                Remove current logo
              </label>
            ) : null}
          </div>
        </div>
        {state.errors.logo ? (
          <p className="text-xs text-destructive">{state.errors.logo}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            PNG, JPEG, or WebP up to 2 MB. A square image works best.
          </p>
        )}
      </div>

      {state.generic ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.generic}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-4" aria-hidden="true" />
              Save changes
            </>
          )}
        </Button>
        {!pending && state.success ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}
