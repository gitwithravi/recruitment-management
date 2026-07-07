"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserFormDialog } from "@/components/admin/users/user-form-dialog";

export function AddUserButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <UserFormDialog
      mode="create"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="lg">
          <UserPlus className="size-4" aria-hidden="true" />
          Add user
        </Button>
      }
    />
  );
}
