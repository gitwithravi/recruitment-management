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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div
          className="max-h-[70vh] space-y-3 overflow-y-auto text-sm leading-6 text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-5 [&_ol]:list-decimal [&_p]:leading-6 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      </DialogContent>
    </Dialog>
  );
}
