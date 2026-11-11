"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
] as const;

const subscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // The stored theme is only known on the client; render no selection ("") on
  // the server so hydration matches.
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <ToggleGroup
      type="single"
      size="sm"
      aria-label="Tema"
      value={isClient ? (theme ?? "") : ""}
      onValueChange={(value) => value && setTheme(value)}
      className={cn("gap-0.5 rounded-lg border bg-background p-0.5", className)}
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          title={label}
          className="h-8 min-w-8 px-2"
        >
          <Icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
