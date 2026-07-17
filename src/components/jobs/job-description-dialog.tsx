"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type JobDescriptionDialogProps = {
  title: string;
  description: string;
};

export function JobDescriptionDialog({ title, description }: JobDescriptionDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" type="button">
            <FileText className="size-4" aria-hidden="true" />
            View description
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="max-h-[60vh] overflow-y-auto whitespace-pre-line text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </DialogContent>
    </Dialog>
  );
}
