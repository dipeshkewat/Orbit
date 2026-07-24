"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  PenSquare,
  Calendar,
  BarChart3,
  Inbox,
  Sparkles,
  Brain,
  Settings,
  Users,
  ArrowRight,
  Plus,
  FileText,
  Clock,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@socialsphear/ui";
import { useCalendarStore } from "@/lib/store";

interface CommandItem {
  id: string;
  label: string;
  group: "Pages" | "Actions" | "Posts";
  icon: React.ElementType;
  action: () => void;
  keywords?: string;
}

export function CommandPalette() {
  const router = useRouter();
  const posts = useCalendarStore((s) => s.posts);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router],
  );

  // Build items list
  const pageItems: CommandItem[] = [
    { id: "dashboard", label: "Dashboard", group: "Pages", icon: LayoutDashboard, action: () => navigate("/dashboard"), keywords: "home overview" },
    { id: "composer", label: "Composer", group: "Pages", icon: PenSquare, action: () => navigate("/composer"), keywords: "write create post" },
    { id: "calendar", label: "Calendar", group: "Pages", icon: Calendar, action: () => navigate("/calendar"), keywords: "schedule plan" },
    { id: "analytics", label: "Analytics", group: "Pages", icon: BarChart3, action: () => navigate("/analytics"), keywords: "stats metrics reports" },
    { id: "inbox", label: "Inbox", group: "Pages", icon: Inbox, action: () => navigate("/inbox"), keywords: "messages replies comments" },
    { id: "ai-studio", label: "AI Studio", group: "Pages", icon: Sparkles, action: () => navigate("/ai-studio"), keywords: "generate ai caption" },
    { id: "content-planner", label: "Content Planner", group: "Pages", icon: Brain, action: () => navigate("/content-planner"), keywords: "ideas board campaign" },
    { id: "competitors", label: "Competitors", group: "Pages", icon: Users, action: () => navigate("/competitors"), keywords: "benchmark compare" },
    { id: "settings", label: "Settings", group: "Pages", icon: Settings, action: () => navigate("/settings"), keywords: "preferences profile accounts billing team" },
  ];

  const actionItems: CommandItem[] = [
    { id: "new-post", label: "New Post", group: "Actions", icon: Plus, action: () => navigate("/composer"), keywords: "create compose write" },
  ];

  const postItems: CommandItem[] = posts.slice(0, 8).map((p) => ({
    id: `post-${p.id}`,
    label: p.content.length > 60 ? p.content.slice(0, 60) + "…" : p.content,
    group: "Posts" as const,
    icon: p.status === "scheduled" ? Clock : FileText,
    action: () => navigate("/calendar"),
    keywords: p.content.toLowerCase(),
  }));

  const allItems = [...pageItems, ...actionItems, ...postItems];

  // Filter by query (fuzzy-ish: split words, each must match)
  const filtered = query.trim()
    ? allItems.filter((item) => {
        const q = query.toLowerCase();
        const searchable = `${item.label} ${item.keywords || ""}`.toLowerCase();
        return q.split(/\s+/).every((word) => searchable.includes(word));
      })
    : allItems;

  // Group filtered items
  const groups = (["Pages", "Actions", "Posts"] as const).reduce(
    (acc, group) => {
      const items = filtered.filter((i) => i.group === group);
      if (items.length > 0) acc.push({ group, items });
      return acc;
    },
    [] as { group: string; items: CommandItem[] }[],
  );

  const flatFiltered = groups.flatMap((g) => g.items);

  // Keyboard nav
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && flatFiltered[activeIndex]) {
      e.preventDefault();
      flatFiltered[activeIndex].action();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <Search className="h-5 w-5 text-[var(--color-text-muted)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, posts, or actions…"
            className="flex-1 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-background)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
          {groups.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              No results for "{query}"
            </div>
          ) : (
            groups.map(({ group, items }) => (
              <div key={group}>
                <div className="px-2 pt-2 pb-1 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  {group}
                </div>
                {items.map((item) => {
                  const idx = flatFiltered.indexOf(item);
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => item.action()}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-[var(--color-primary)]/10 text-[var(--color-text)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {isActive && <CornerDownLeft className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-1 py-0.5 text-[10px]">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-background)] px-1 py-0.5 text-[10px]">↵</kbd>
            Select
          </span>
        </div>
      </div>
    </div>
  );
}

/** Trigger button for the header — shows "Search… ⌘K" */
export function CommandPaletteTrigger({ className }: { className?: string }) {
  const handleClick = () => {
    // Dispatch the same keyboard event the palette listens for
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
    );
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)]",
        className,
      )}
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search…</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-medium">
        ⌘K
      </kbd>
    </button>
  );
}
