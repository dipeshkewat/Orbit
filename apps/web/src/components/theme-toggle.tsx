"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@socialsphear/ui";

type Theme = "dark" | "light";

const STORAGE_KEY = "orbit-theme";

/**
 * Applies the theme by toggling data-theme on <html>.
 * Dark is the default (no attribute); light sets data-theme="light".
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme");
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "dark";
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage may be unavailable (private mode) — theme still applies for the session
    }
  };

  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "rounded-[var(--radius-md)] p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
