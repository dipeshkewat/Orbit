"use client";

import { useState } from "react";
import { useSocialAccountStore, useAuthStore } from "@/lib/store";
import {
  Link2,
  Trash2,
  Plus,
  Lock,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { getPlatformIcon } from "@/components/social-icons";
import { toast } from "sonner";
import Link from "next/link";

export default function SettingsAccountsPage() {
  const accounts = useSocialAccountStore((state) => state.accounts);
  const connectAccount = useSocialAccountStore((state) => state.connectAccount);
  const disconnectAccount = useSocialAccountStore((state) => state.disconnectAccount);
  const user = useAuthStore((state) => state.user);

  const [isLoadingPlatform, setIsLoadingPlatform] = useState<string | null>(null);



  const handleConnectPlatform = (platform: string) => {
    if (platform === "facebook" || platform === "instagram") {
      setIsLoadingPlatform(platform);
      const appId = process.env.NEXT_PUBLIC_META_APP_ID || "1600609308298106";
      const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/settings/accounts` : "http://localhost:3000/settings/accounts";
      const scopes = "pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,business_management";
      const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code`;
      
      toast.info(`Redirecting to Meta OAuth for ${platform}...`);
      window.location.href = oauthUrl;
      return;
    }

    if (platform === "linkedin") {
      setIsLoadingPlatform(platform);
      const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || "77iiqia3pf4gn8";
      const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/settings/accounts` : "http://localhost:3000/settings/accounts";
      const scopes = "openid profile w_member_social email";
      const oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=orbit_linkedin_state`;

      toast.info("Redirecting to LinkedIn OAuth...");
      window.location.href = oauthUrl;
      return;
    }

    // Fallback simulated connect for other channels pending credentials
    setIsLoadingPlatform(platform);
    setTimeout(() => {
      const handleName = `@${user?.name.toLowerCase().replace(/\s+/g, "") || "user"}_brand`;
      connectAccount(platform, handleName);
      setIsLoadingPlatform(null);
      toast.success(`Successfully connected ${platform} account: ${handleName}`);
    }, 600);
  };

  const handleDisconnect = (id: string, name: string) => {
    disconnectAccount(id);
    toast.success(`Disconnected: ${name}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Connected Accounts</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage your connected social media channels and authorize posting tokens.
        </p>
      </div>

      {/* Tab bar header */}
      <div className="flex gap-1.5 border-b border-[var(--color-border)] pb-3 overflow-x-auto">
        <Link href="/settings" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
          General
        </Link>
        <Link href="/settings/accounts" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-[var(--color-surface-hover)] text-[var(--color-text)]">
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
      </div>

      {/* Main content split grid */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Left pane: Connected list (span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Link2 className="h-4 w-4" />
              Connected Profiles & Pages ({accounts.length})
            </h3>

            <div className="divide-y divide-[var(--color-border)]/40">
              {accounts.map((acc) => (
                <div key={acc.id} className="py-3.5 flex justify-between items-center first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img src={acc.avatarUrl} alt="avatar" className="h-10 w-10 rounded-full object-cover border border-[var(--color-border)]" />
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                        {getPlatformIcon(acc.platform)}
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[var(--color-text)]">{acc.displayName}</span>
                      <span className="block text-xs text-[var(--color-text-muted)]">{acc.username}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase font-bold tracking-wider text-[var(--color-success)] bg-[var(--color-success)]/10 px-2 py-0.5 rounded border border-[var(--color-success)]/20">
                      Token healthy
                    </span>
                    <button
                      onClick={() => handleDisconnect(acc.id, acc.displayName)}
                      className="h-8 w-8 rounded-full hover:bg-[var(--color-error)]/10 text-[var(--color-error)] flex items-center justify-center transition-colors"
                      title="Disconnect account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <p className="py-8 text-center text-xs text-[var(--color-text-muted)]">No connected channels yet. Connect one below.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Link new accounts list (span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Plus className="h-4.5 w-4.5" />
                Connect New Channel
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Authorizes OAuth tokens for automated publishing</p>
            </div>

            <div className="space-y-2">
              {["instagram", "twitter", "linkedin", "facebook"].map((platform) => {
                const isConnecting = isLoadingPlatform === platform;
                return (
                  <button
                    key={platform}
                    onClick={() => handleConnectPlatform(platform)}
                    disabled={isConnecting || !!isLoadingPlatform}
                    className="w-full flex justify-between items-center p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors text-xs font-semibold text-[var(--color-text-secondary)] disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2.5 capitalize">
                      {getPlatformIcon(platform)}
                      Connect {platform}
                    </span>
                    <span className="text-xs text-[var(--color-primary-light)] font-bold">
                      {isConnecting ? "Redirecting..." : "Link Page"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[var(--color-border)]">
              <div className="p-3 bg-[var(--color-surface-hover)] rounded border border-[var(--color-border)] flex items-start gap-2 text-xs">
                <Lock className="h-4 w-4 text-[var(--color-success)] shrink-0 mt-0.5" />
                <p className="text-[var(--color-text-muted)] leading-relaxed">
                  Tokens are encrypted using <span className="font-semibold text-[var(--color-text-secondary)]">AES-256-GCM</span> prior to database storage. Access details are never returned in public client payloads.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
