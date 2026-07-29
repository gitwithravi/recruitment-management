"use client";

import * as React from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type JobDescriptionEditorProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  ariaInvalid?: boolean;
};

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      className={cn(active && "bg-muted text-foreground")}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function LinkPopover({ editor }: { editor: Editor }) {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const active = editor.isActive("link");

  const applyLink = () => {
    const trimmed = url.trim();

    if (trimmed === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
    }

    setOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger
        render={
          <ToolbarButton label="Link" active={active} onClick={() => setOpen((value) => !value)}>
            <LinkIcon className="size-3.5" aria-hidden="true" />
          </ToolbarButton>
        }
      />
      <PopoverContent>
        <div className="space-y-2">
          <Input
            autoFocus
            placeholder="https://example.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
              if (event.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          <div className="flex justify-end gap-1.5">
            {active ? (
              <Button type="button" variant="outline" size="sm" onClick={removeLink}>
                Remove
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={applyLink}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-1">
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-3.5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-3.5" aria-hidden="true" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-3.5" aria-hidden="true" />
      </ToolbarButton>
      <LinkPopover editor={editor} />
    </div>
  );
}

export function JobDescriptionEditor({
  id,
  name,
  defaultValue = "",
  placeholder,
  required,
  ariaInvalid,
}: JobDescriptionEditorProps) {
  const [html, setHtml] = React.useState(defaultValue);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
        },
      }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-required": required ? "true" : "false",
        "aria-invalid": ariaInvalid ? "true" : "false",
        class: "min-h-32 max-h-96 overflow-y-auto px-3 py-2 text-sm focus:outline-none",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
    onUpdate: ({ editor: current }) => {
      setHtml(current.getHTML());
    },
  });

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        ariaInvalid && "border-destructive ring-3 ring-destructive/20",
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
