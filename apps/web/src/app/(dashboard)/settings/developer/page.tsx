"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { trpc } from "@/lib/trpc";
import {
  Key,
  Globe,
  Copy,
  Trash2,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const WEBHOOK_EVENTS = [
  "post.published",
  "post.published_all",
  "post.failed",
  "post.scheduled",
  "*",
];

function isUuid(value: string | null): value is string {
  return (
    value !== null &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export default function SettingsDeveloperPage() {
  const activeWorkspaceId = useAuthStore((state) => state.activeWorkspaceId);
  const workspaceId = isUuid(activeWorkspaceId) ? activeWorkspaceId : null;
  const placeholderId = "00000000-0000-0000-0000-000000000000";

  // ── API keys ──────────────────────────────────────────────────
  const keysQuery = trpc.platform.apiKeysList.useQuery(
    { workspaceId: workspaceId ?? placeholderId },
    { enabled: workspaceId !== null },
  );
  const createKeyMutation = trpc.platform.apiKeysCreate.useMutation({
    onSettled: () => void keysQuery.refetch(),
  });
  const revokeKeyMutation = trpc.platform.apiKeysRevoke.useMutation({
    onSettled: () => void keysQuery.refetch(),
  });

  const [keyName, setKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !keyName.trim()) return;
    createKeyMutation.mutate(
      { workspaceId, name: keyName.trim() },
      {
        onSuccess: (result) => {
          setGeneratedKey(result.key);
          setKeyName("");
          toast.success("API key generated — copy it now, it is shown only once.");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleRevokeKey = (keyId: string, name: string) => {
    if (!workspaceId) return;
    revokeKeyMutation.mutate(
      { workspaceId, keyId },
      {
        onSuccess: () => toast.success(`Revoked API key: ${name}`),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  // ── Webhooks ──────────────────────────────────────────────────
  const webhooksQuery = trpc.platform.webhooksList.useQuery(
    { workspaceId: workspaceId ?? placeholderId },
    { enabled: workspaceId !== null },
  );
  const createWebhookMutation = trpc.platform.webhooksCreate.useMutation({
    onSettled: () => void webhooksQuery.refetch(),
  });
  const deleteWebhookMutation = trpc.platform.webhooksDelete.useMutation({
    onSettled: () => void webhooksQuery.refetch(),
  });

  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["post.published"]);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);

  const deliveriesQuery = trpc.platform.webhooksDeliveries.useQuery(
    { workspaceId: workspaceId ?? placeholderId, webhookId: selectedWebhookId ?? placeholderId },
    { enabled: workspaceId !== null && selectedWebhookId !== null },
  );

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !webhookUrl.trim() || selectedEvents.length === 0) return;
    createWebhookMutation.mutate(
      { workspaceId, url: webhookUrl.trim(), events: selectedEvents },
      {
        onSuccess: (result) => {
          setWebhookUrl("");
          setGeneratedKey(result.secret);
          toast.success("Webhook registered — save the signing secret now.");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleDeleteWebhook = (webhookId: string) => {
    if (!workspaceId) return;
    deleteWebhookMutation.mutate(
      { workspaceId, webhookId },
      {
        onSuccess: () => {
          toast.success("Webhook deleted");
          if (selectedWebhookId === webhookId) setSelectedWebhookId(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const toggleEvent = (ev: string) => {
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev],
    );
  };

  const demoMode = workspaceId === null;

  // Extracted from JSX so TypeScript's inline inference stays shallow.
  const apiKeys = keysQuery.data ?? [];
  const webhooks = webhooksQuery.data ?? [];
  const deliveries = selectedWebhookId ? deliveriesQuery.data ?? [] : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Developer API</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          REST API keys and HMAC-signed outbound webhooks — backed by the live platform API.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 border-b border-[var(--color-border)] pb-3 overflow-x-auto">
        {[
          { href: "/settings", label: "General" },
          { href: "/settings/accounts", label: "Connected Accounts" },
          { href: "/settings/team", label: "Team Members" },
          { href: "/settings/billing", label: "Billing & Plans" },
          { href: "/settings/developer", label: "Developer API", active: true },
          { href: "/settings/templates", label: "Templates" },
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
          Demo workspace active — connect a real workspace to manage API keys and webhooks.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* API keys */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Key className="h-4 w-4" />
              Developer API Keys
            </h3>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                  Key Label / Description
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    disabled={demoMode}
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="E.g., staging server connection..."
                    className="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] outline-none rounded placeholder:text-[var(--color-text-muted)] focus:bg-[var(--color-surface-hover)] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={demoMode || createKeyMutation.isPending}
                    className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-semibold rounded hover:opacity-90 active:scale-95 disabled:opacity-50"
                  >
                    {createKeyMutation.isPending ? "Generating..." : "Generate Key"}
                  </button>
                </div>
              </div>
            </form>

            {generatedKey && (
              <div className="p-4 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded space-y-2">
                <span className="block text-xs font-extrabold text-[var(--color-primary-light)] uppercase tracking-wider">
                  ⚠️ Copy this now (shown only once)
                </span>
                <div className="flex rounded overflow-hidden bg-[var(--color-background)] border border-[var(--color-border)] p-2">
                  <code className="text-xs font-mono truncate flex-1 text-[var(--color-text-secondary)]">
                    {generatedKey}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard(generatedKey)}
                    className="pl-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] shrink-0"
                    title="Copy"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setGeneratedKey(null)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="divide-y divide-[var(--color-border)]/40 pt-2">
              {apiKeys.map((key) => (
                <div key={key.id} className="py-3 flex justify-between items-center last:pb-0">
                  <div>
                    <span className="block text-xs font-bold text-[var(--color-text)]">{key.name}</span>
                    <span className="block text-xs font-mono text-[var(--color-text-muted)] mt-0.5">
                      {key.keyPrefix}…
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-xs text-[var(--color-text-muted)] block">
                      Last used:{" "}
                      <span className="font-semibold text-[var(--color-text-secondary)]">
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                      </span>
                    </span>
                    <button
                      onClick={() => handleRevokeKey(key.id, key.name)}
                      disabled={demoMode}
                      className="h-8 w-8 rounded-full hover:bg-[var(--color-error)]/10 text-[var(--color-error)] flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Revoke key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {workspaceId && apiKeys.length === 0 && (
                <p className="py-3 text-xs text-[var(--color-text-muted)]">
                  No API keys yet. Generate one to use the REST API (Pro plan and above).
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Webhooks */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Globe className="h-4 w-4" />
              Outbound Webhooks
            </h3>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                  Endpoint Target URL
                </label>
                <input
                  type="url"
                  required
                  disabled={demoMode}
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.yourbrand.com/orbit-receive"
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] outline-none rounded placeholder:text-[var(--color-text-muted)] focus:bg-[var(--color-surface-hover)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                  Event Subscriptions
                </label>
                <div className="flex gap-2 flex-wrap">
                  {WEBHOOK_EVENTS.map((ev) => {
                    const isSelected = selectedEvents.includes(ev);
                    return (
                      <button
                        key={ev}
                        type="button"
                        onClick={() => toggleEvent(ev)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary-light)]"
                            : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                        }`}
                      >
                        {ev}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={demoMode || createWebhookMutation.isPending}
                className="w-full flex items-center justify-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] text-xs font-semibold py-2.5 rounded shadow-sm hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {createWebhookMutation.isPending ? "Registering..." : "Register Webhook"}
              </button>
            </form>

            <div className="divide-y divide-[var(--color-border)]/40 pt-2">
              {webhooks.map((wh) => (
                <div key={wh.id} className="py-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-[var(--color-text)] truncate">
                        {wh.url}
                      </span>
                      <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">
                        {wh.events.join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs uppercase font-bold tracking-wide px-2 py-0.5 rounded border ${
                          wh.isActive
                            ? "text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20"
                            : "text-[var(--color-text-muted)] bg-[var(--color-surface-hover)] border-[var(--color-border)]"
                        }`}
                      >
                        {wh.isActive ? "Active" : "Inactive"}
                      </span>
                      <button
                        onClick={() => setSelectedWebhookId(selectedWebhookId === wh.id ? null : wh.id)}
                        className="h-8 w-8 rounded-full hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] flex items-center justify-center transition-colors"
                        title="View deliveries"
                      >
                        <Activity className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(wh.id)}
                        disabled={demoMode}
                        className="h-8 w-8 rounded-full hover:bg-[var(--color-error)]/10 text-[var(--color-error)] flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Delete webhook"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {selectedWebhookId === wh.id && (
                    <div className="rounded border border-[var(--color-border)] bg-[var(--color-background)] p-3 space-y-1.5 max-h-56 overflow-y-auto">
                      {deliveries.length === 0 ? (
                        <p className="text-xs text-[var(--color-text-muted)]">No deliveries recorded yet.</p>
                      ) : (
                        deliveries.map((d) => (
                          <div key={d.id} className="flex justify-between items-center text-xs">
                            <span className="font-mono text-[var(--color-text-secondary)]">{d.event}</span>
                            <span className="flex items-center gap-2">
                              <span className="text-[var(--color-text-muted)]">
                                {d.attempts} attempt{d.attempts === 1 ? "" : "s"}
                              </span>
                              <span
                                className={
                                  d.status === "success"
                                    ? "text-[var(--color-success)] font-semibold"
                                    : "text-[var(--color-error)] font-semibold"
                                }
                              >
                                {d.status === "success" ? `✓ ${d.responseCode ?? ""}` : `✗ ${d.responseCode ?? "err"}`}
                              </span>
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
              {workspaceId && webhooks.length === 0 && (
                <p className="py-3 text-xs text-[var(--color-text-muted)]">
                  No webhooks yet. Register an endpoint to receive signed post events.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
