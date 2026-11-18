"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/lib/hooks";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "snips.theme";

function readTheme(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(next: ThemeMode) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  if (next === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    return;
  }
}

export function ThemeToggle() {
  const mounted = useMounted();
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());
  const shown = mounted ? theme : "dark";

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="fixed right-4 bottom-4 z-[60] rounded-full border-border/70 bg-card/90 shadow-lg backdrop-blur"
      onClick={toggleTheme}
      aria-label={shown === "dark" ? "switch to light mode" : "switch to dark mode"}
      title={shown === "dark" ? "switch to light mode" : "switch to dark mode"}
    >
      {shown === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
