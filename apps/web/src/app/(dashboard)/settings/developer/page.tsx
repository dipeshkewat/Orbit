"use client";

import { useState } from "react";
import {
  Code,
  Plus,
  Trash2,
  Copy,
  Eye,
  Key,
  Globe,
  CheckCircle,
  HelpCircle,
  FileCode,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  createdAt: string;
  isActive: boolean;
}

const INITIAL_KEYS: ApiKey[] = [
  { id: "key-1", name: "Zapier connection", prefix: "sk_live_8f6d2f3c", createdAt: "2026-07-01", lastUsedAt: "2 hours ago" },
  { id: "key-2", name: "Marketing script", prefix: "sk_live_1d2e3f4a", createdAt: "2026-07-15", lastUsedAt: "Never" }
];

const INITIAL_WEBHOOKS: Webhook[] = [
  { id: "wh-1", url: "https://api.acme.com/webhooks/social", events: ["post.published", "post.failed"], createdAt: "2026-07-05", isActive: true }
];

export default function SettingsDeveloperPage() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [keyName, setKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const [webhooks, setWebhooks] = useState<Webhook[]>(INITIAL_WEBHOOKS);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["post.published"]);

  // API Key creation
  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const fullKeyToken = `sk_live_${Math.random().toString(36).substr(2, 9)}${Math.random().toString(36).substr(2, 9)}`;
    const newKey: ApiKey = {
      id: "key-" + Math.random().toString(36).substr(2, 9),
      name: keyName,
      prefix: fullKeyToken.substr(0, 16),
      createdAt: new Date().toISOString().split("T")[0],
      lastUsedAt: "Never"
    };

    setKeys((prev) => [...prev, newKey]);
    setGeneratedKey(fullKeyToken);
    setKeyName("");
    toast.success("API key generated successfully!");
  };

  const handleDeleteKey = (id: string, name: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success(`Revoked API key: ${name}`);
  };

  // Webhook creation
  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;

    const newWebhook: Webhook = {
      id: "wh-" + Math.random().toString(36).substr(2, 9),
      url: webhookUrl,
      events: selectedEvents,
      createdAt: new Date().toISOString().split("T")[0],
      isActive: true
    };

    setWebhooks((prev) => [...prev, newWebhook]);
    setWebhookUrl("");
    toast.success("Webhook endpoint registered!");
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast.success("Webhook deleted");
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const toggleEvent = (ev: string) => {
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Developer API</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Configure REST authorization credentials and outbound HMAC-signed webhooks.
        </p>
      </div>

      {/* Tab bar header */}
      <div className="flex gap-1.5 border-b border-[var(--color-border)] pb-3 overflow-x-auto">
        <Link href="/settings" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
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
        <Link href="/settings/developer" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-[var(--color-surface-hover)] text-[var(--color-text)]">
          Developer API
        </Link>
      </div>

      {/* Split API Keys vs Webhooks */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Left Side: Keys panel (span 6) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Create Key Box */}
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Key className="h-4 w-4" />
              Developer API Keys
            </h3>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Key Label / Description</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="E.g., staging server connection..."
                    className="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] outline-none rounded placeholder:text-[var(--color-text-muted)] focus:bg-[var(--color-surface-hover)] transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-semibold rounded hover:opacity-90 active:scale-95"
                  >
                    Generate Key
                  </button>
                </div>
              </div>
            </form>

            {/* If key was generated, show once */}
            {generatedKey && (
              <div className="p-4 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded space-y-2">
                <span className="block text-xs font-extrabold text-[var(--color-primary-light)] uppercase tracking-wider">
                  ⚠️ Copy this Key (Shown only once)
                </span>
                <div className="flex rounded overflow-hidden bg-[var(--color-background)] border border-[var(--color-border)] p-2">
                  <code className="text-xs font-mono truncate flex-1 text-[var(--color-text-secondary)]">{generatedKey}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard(generatedKey)}
                    className="pl-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] shrink-0"
                    title="Copy token"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* List key cards */}
            <div className="divide-y divide-[var(--color-border)]/40 pt-2">
              {keys.map((key) => (
                <div key={key.id} className="py-3 flex justify-between items-center last:pb-0">
                  <div>
                    <span className="block text-xs font-bold text-[var(--color-text)]">{key.name}</span>
                    <span className="block text-xs font-mono text-[var(--color-text-muted)] mt-0.5">{key.prefix}...</span>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <span className="text-xs text-[var(--color-text-muted)] block">
                      Last used: <span className="font-semibold text-[var(--color-text-secondary)]">{key.lastUsedAt}</span>
                    </span>
                    <button
                      onClick={() => handleDeleteKey(key.id, key.name)}
                      className="h-8 w-8 rounded-full hover:bg-[var(--color-error)]/10 text-[var(--color-error)] flex items-center justify-center transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Webhooks panel (span 6) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Globe className="h-4 w-4" />
              Outbound Webhooks
            </h3>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Endpoint Target URL</label>
                <input
                  type="url"
                  required
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.yourbrand.com/orbit-receive"
                  className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] outline-none rounded placeholder:text-[var(--color-text-muted)] focus:bg-[var(--color-surface-hover)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Event Subscriptions</label>
                <div className="flex gap-2 flex-wrap">
                  {["post.scheduled", "post.published", "post.failed", "member.invited"].map((ev) => {
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
                className="w-full flex items-center justify-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] text-xs font-semibold py-2.5 rounded shadow-sm hover:opacity-90 active:scale-95"
              >
                Register Webhook
              </button>
            </form>

            {/* List webhooks */}
            <div className="divide-y divide-[var(--color-border)]/40 pt-2">
              {webhooks.map((wh) => (
                <div key={wh.id} className="py-3.5 flex justify-between items-center last:pb-0">
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-[var(--color-text)] truncate">{wh.url}</span>
                    <span className="block text-xs text-[var(--color-text-muted)] mt-0.5 capitalize">
                      {wh.events.join(", ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs uppercase font-bold tracking-wide text-[var(--color-success)] bg-[var(--color-success)]/10 px-2 py-0.5 rounded border border-[var(--color-success)]/20">
                      Active
                    </span>
                    <button
                      onClick={() => handleDeleteWebhook(wh.id)}
                      className="h-8 w-8 rounded-full hover:bg-[var(--color-error)]/10 text-[var(--color-error)] flex items-center justify-center transition-colors"
                      title="Delete webhook"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
