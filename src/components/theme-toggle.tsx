"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Toggle theme">
            <Sun className="size-4 scale-100 rotate-0 transition-all dark:-scale-0 dark:-rotate-90 dark:hidden" />
            <Moon className="hidden size-4 scale-0 rotate-90 transition-all dark:block dark:scale-100 dark:rotate-0" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-36">
        {themes.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onClick={() => setTheme(item.value)}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </span>
            {theme === item.value ? (
              <Check className="size-4 text-muted-foreground" aria-hidden="true" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
