"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { Building2, Save, Globe, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SettingsGeneralPage() {
  const workspace = useAuthStore((state) => {
    const active = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
    return active || state.workspaces[0];
  });
  const [name, setName] = useState(workspace?.name || "");
  const [slug, setSlug] = useState(workspace?.slug || "");
  const [logoUrl, setLogoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Please fill in name and slug");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      // Simulate save
      useAuthStore.setState((state) => ({
        workspaces: state.workspaces.map((w) =>
          w.id === state.activeWorkspaceId ? { ...w, name, slug } : w
        ),
      }));
      setIsSaving(false);
      toast.success("Workspace settings updated successfully!");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage your brand profile, team integrations, and plan details.
        </p>
      </div>

      {/* Tab bar header */}
      <div className="flex gap-1.5 border-b border-[var(--color-border)] pb-3 overflow-x-auto">
        <Link href="/settings" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-[var(--color-surface-hover)] text-[var(--color-text)]">
          General
        </Link>
        <Link href="/settings/accounts" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
          Connected Accounts
        </Link>
        <Link href="/settings/team" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
          Team Members
        </Link>
        <Link href="/settings/billing" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
          Billing & Plans
        </Link>
        <Link href="/settings/developer" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text(--color-text-secondary)">
          Developer API
        </Link>
        <Link href="/settings/rss" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
          RSS Feeds
        </Link>
      </div>

      {/* Content Form */}
      <div className="max-w-xl">
        <form onSubmit={handleSave} className="glass rounded-[var(--radius-lg)] p-6 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            General Brand Profile
          </h3>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Brand Company Name"
              className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Workspace Slug (URL)</label>
            <div className="flex rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-border)]">
              <span className="px-3 bg-[var(--color-surface)] text-xs text-[var(--color-text-muted)] flex items-center select-none border-r border-[var(--color-border)]">
                app.orbit.com/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}
                placeholder="slug"
                className="flex-1 px-4 py-2.5 bg-[var(--color-background)] text-sm text-[var(--color-text)] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Logo URL (Optional)</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://images.com/logo.png"
              className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-1.5 bg-[var(--color-primary)] text-white text-xs font-semibold py-2.5 rounded-[var(--radius-md)] hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving changes..." : "Save Workspace Profile"}
          </button>
        </form>

        {/* Delete Workspace safety warning */}
        <div className="mt-6 p-4 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 flex gap-2.5">
          <AlertTriangle className="h-5 w-5 text-[var(--color-error)] shrink-0 mt-0.5" />
          <div>
            <span className="block text-xs font-bold text-[var(--color-error)]">Delete Workspace</span>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Once deleted, all scheduled content calendars, connected social tokens, and analytics database logs will be permanently erased.
            </p>
            <button
              type="button"
              onClick={() => toast.error("Primary owners cannot delete active workspaces without downgrading plan.")}
              className="mt-2.5 text-xs font-bold text-[var(--color-error)] underline hover:opacity-80"
            >
              Request Deletion...
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
