"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@socialsphear/ui";

type Theme = "dark" | "light";

const STORAGE_KEY = "orbit-theme";
const CHANGE_EVENT = "orbit-theme-change";

/** Read the current theme from the DOM (set pre-paint by the boot script). */
function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/** Server render + first paint default is dark. */
function getServerSnapshot(): Theme {
  return "dark";
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Apply a theme: toggle the attribute, persist, and notify subscribers. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme");
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage may be unavailable (private mode) — theme still applies for the session
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    theme,
    setTheme: applyTheme,
    toggle: () => applyTheme(theme === "dark" ? "light" : "dark"),
  };
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
