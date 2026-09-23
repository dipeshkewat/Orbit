"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { trpc } from "@/lib/trpc";
import { LayoutTemplate, Plus, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const CATEGORIES = ["all", "announcement", "promo", "engagement", "educational", "general"];

function isUuid(value: string | null): value is string {
  return (
    value !== null &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export default function SettingsTemplatesPage() {
  const activeWorkspaceId = useAuthStore((state) => state.activeWorkspaceId);
  const workspaceId = isUuid(activeWorkspaceId) ? activeWorkspaceId : null;
  const placeholderId = "00000000-0000-0000-0000-000000000000";

  const trpcUtils = trpc.useUtils();
  const templatesQuery = trpc.platform.templatesList.useQuery(
    { workspaceId: workspaceId ?? placeholderId },
    { enabled: workspaceId !== null },
  );
  const createTemplateMutation = trpc.platform.templatesCreate.useMutation();
  const deleteTemplateMutation = trpc.platform.templatesDelete.useMutation();
  const useTemplateMutation = trpc.platform.templatesUse.useMutation();

  const [category, setCategory] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "general",
    content: "",
  });

  const templates = (templatesQuery.data ?? []).filter(
    (t) => category === "all" || t.category === category,
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !form.name.trim() || !form.content.trim()) return;
    createTemplateMutation.mutate(
      {
        workspaceId,
        name: form.name.trim(),
        category: form.category,
        content: form.content,
      },
      {
        onSuccess: () => {
          toast.success("Template created");
          setForm({ name: "", category: "general", content: "" });
          setShowCreate(false);
          void trpcUtils.platform.templatesList.invalidate();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleDelete = (templateId: string) => {
    if (!workspaceId) return;
    deleteTemplateMutation.mutate(
      { workspaceId, templateId },
      {
        onSuccess: () => {
          toast.success("Template deleted");
          void trpcUtils.platform.templatesList.invalidate();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleCopy = async (templateId: string, content: string) => {
    if (workspaceId) {
      useTemplateMutation.mutate({ workspaceId, templateId });
    }
    await navigator.clipboard.writeText(content);
    setCopiedId(templateId);
    toast.success("Template copied — paste it into the composer");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const demoMode = workspaceId === null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Templates</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Reusable post scaffolds — workspace templates plus Orbit&apos;s global library.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 border-b border-[var(--color-border)] pb-3 overflow-x-auto">
        {[
          { href: "/settings", label: "General" },
          { href: "/settings/accounts", label: "Connected Accounts" },
          { href: "/settings/team", label: "Team Members" },
          { href: "/settings/billing", label: "Billing & Plans" },
          { href: "/settings/developer", label: "Developer API" },
          { href: "/settings/templates", label: "Templates", active: true },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider ${
              tab.active
                ? "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {demoMode && (
        <div className="p-4 rounded border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-xs text-[var(--color-text-secondary)]">
          Demo workspace active — connect a real workspace to manage templates.
        </div>
      )}

      {/* Category filter + create */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                category === c
                  ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary-light)]"
                  : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-muted)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          disabled={demoMode}
          className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-semibold rounded hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          New Template
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Template Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="E.g., Weekly tips thread"
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] outline-none rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] outline-none rounded"
              >
                {CATEGORIES.filter((c) => c !== "all").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Content (supports {"{{placeholders}}"})
            </label>
            <textarea
              required
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write the template. Use {{placeholders}} for fields to fill in later."
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text)] outline-none rounded"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-xs font-semibold rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTemplateMutation.isPending}
              className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-semibold rounded hover:opacity-90 disabled:opacity-50"
            >
              {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
            </button>
          </div>
        </form>
      )}

      {/* Template grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((t) => (
          <div
            key={t.id}
            className="glass rounded-[var(--radius-lg)] p-4 flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <LayoutTemplate className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
                  <span className="text-xs font-bold text-[var(--color-text)] truncate">
                    {t.name}
                  </span>
                </div>
                <span className="shrink-0 text-xs uppercase font-bold tracking-wide text-[var(--color-text-muted)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded">
                  {t.category}
                </span>
              </div>
              {t.description && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">{t.description}</p>
              )}
              <pre className="mt-2 text-xs font-mono text-[var(--color-text-muted)] whitespace-pre-wrap line-clamp-4 max-h-24 overflow-hidden">
                {t.content}
              </pre>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/40">
              <span className="text-xs text-[var(--color-text-muted)]">
                Used {t.usageCount}× {!t.workspaceId && "· global"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCopy(t.id, t.content)}
                  className="h-8 w-8 rounded-full hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] flex items-center justify-center transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedId === t.id ? (
                    <Check className="h-4 w-4 text-[var(--color-success)]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                {t.workspaceId === workspaceId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    disabled={demoMode}
                    className="h-8 w-8 rounded-full hover:bg-[var(--color-error)]/10 text-[var(--color-error)] flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {workspaceId && templates.length === 0 && !templatesQuery.isLoading && (
        <div className="glass rounded-[var(--radius-lg)] p-8 text-center">
          <LayoutTemplate className="h-8 w-8 mx-auto text-[var(--color-text-muted)]" />
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            No templates in this category yet.
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Run <code className="font-mono">pnpm db:seed:templates</code> to load Orbit&apos;s
            global library, or create your own.
          </p>
        </div>
      )}
    </div>
  );
}
