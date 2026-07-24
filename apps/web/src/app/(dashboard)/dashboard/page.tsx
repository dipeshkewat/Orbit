"use client";

import { useState } from "react";
import { useCalendarStore, useAuthStore, useSocialAccountStore } from "@/lib/store";
import {
  Calendar,
  TrendingUp,
  Users,
  Zap,
  ArrowUpRight,
  Send,
  Plus,
  Clock,
  Sparkles,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import Link from "next/link";

const CHART_DATA = [
  { name: "Mon", reach: 2400, engagement: 400 },
  { name: "Tue", reach: 1398, engagement: 300 },
  { name: "Wed", reach: 9800, engagement: 2000 },
  { name: "Thu", reach: 3908, engagement: 2780 },
  { name: "Fri", reach: 4800, engagement: 1890 },
  { name: "Sat", reach: 3800, engagement: 2390 },
  { name: "Sun", reach: 4300, engagement: 3490 },
];

function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  icon: React.ElementType;
}) {
  return (
    <div className="glass-dark rounded-[var(--radius-lg)] p-5 transition-all hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--color-text)]">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]/10">
          <Icon className="h-5 w-5 text-[var(--color-primary-light)]" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs">
        <ArrowUpRight className={`h-4 w-4 ${changeType === "up" ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`} />
        <span className={`${changeType === "up" ? "text-[var(--color-success)] font-semibold" : "text-[var(--color-error)] font-semibold"}`}>
          {change}
        </span>
        <span className="text-[var(--color-text-muted)]">vs last 7 days</span>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const posts = useCalendarStore((state) => state.posts);
  const addPost = useCalendarStore((state) => state.addPost);
  const accounts = useSocialAccountStore((state) => state.accounts);
  const user = useAuthStore((state) => state.user);
  const workspace = useAuthStore((state) => {
    const active = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
    return active || state.workspaces[0];
  });

  const [quickContent, setQuickContent] = useState("");
  const [quickPlatforms, setQuickPlatforms] = useState<string[]>([]);

  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const failedPosts = posts.filter((p) => p.status === "failed");

  // Needs-attention items — only render row if non-empty
  const attentionItems: { id: string; type: "error" | "warning"; icon: React.ElementType; title: string; description: string; action?: { label: string; href: string } }[] = [];

  if (failedPosts.length > 0) {
    attentionItems.push({
      id: "failed-posts",
      type: "error",
      icon: XCircle,
      title: `${failedPosts.length} post${failedPosts.length > 1 ? "s" : ""} failed to publish`,
      description: "Review and retry or reschedule these posts.",
      action: { label: "View failed", href: "/calendar" },
    });
  }

  // Check for accounts that might need reconnection (simulated — no real expiry in store)
  const disconnectedAccounts = accounts.filter((a) => a.status === "error" || a.status === "expired");
  if (disconnectedAccounts.length > 0) {
    attentionItems.push({
      id: "expired-accounts",
      type: "warning",
      icon: RefreshCw,
      title: `${disconnectedAccounts.length} account${disconnectedAccounts.length > 1 ? "s" : ""} need${disconnectedAccounts.length === 1 ? "s" : ""} reconnection`,
      description: "Reconnect to keep your scheduled posts publishing.",
      action: { label: "Reconnect", href: "/settings/accounts" },
    });
  }

  const handleQuickCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickContent.trim()) {
      toast.error("Please enter post content");
      return;
    }
    if (quickPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    addPost({
      content: quickContent,
      platforms: quickPlatforms,
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      mediaUrls: [],
      platformOverrides: {}
    });

    toast.success("Post scheduled for tomorrow!");
    setQuickContent("");
    setQuickPlatforms([]);
  };

  const toggleQuickPlatform = (platform: string) => {
    setQuickPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram": return <Instagram className="h-4 w-4 text-[var(--color-instagram)]" />;
      case "twitter": return <Twitter className="h-4 w-4 text-[var(--color-twitter)]" />;
      case "linkedin": return <Linkedin className="h-4 w-4 text-[var(--color-linkedin)]" />;
      case "facebook": return <Facebook className="h-4 w-4 text-[var(--color-facebook)]" />;
      default: return null;
    }
  };

  const upcomingPosts = posts
    .filter((p) => p.status === "scheduled")
    .sort((a, b) => new Date(a.scheduledAt || "").getTime() - new Date(b.scheduledAt || "").getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Greeting + primary action — §5 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {getGreeting()}, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Here's what's happening with {workspace?.name || "your workspace"} today.
          </p>
        </div>
        <Link
          href="/composer"
          className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-primary-hover)] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </div>

      {/* Needs-attention row — only renders if non-empty — §5 */}
      {attentionItems.length > 0 && (
        <div className="space-y-2">
          {attentionItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-4 rounded-[var(--radius-md)] border ${
                item.type === "error"
                  ? "bg-[var(--color-error)]/5 border-[var(--color-error)]/20"
                  : "bg-[var(--color-warning)]/5 border-[var(--color-warning)]/20"
              }`}
            >
              <item.icon className={`h-5 w-5 shrink-0 mt-0.5 ${
                item.type === "error" ? "text-[var(--color-error)]" : "text-[var(--color-warning)]"
              }`} />
              <div className="flex-1 min-w-0">
                <span className={`block text-sm font-semibold ${
                  item.type === "error" ? "text-[var(--color-error)]" : "text-[var(--color-warning)]"
                }`}>{item.title}</span>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.description}</p>
              </div>
              {item.action && (
                <Link
                  href={item.action.href}
                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline shrink-0"
                >
                  {item.action.label} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Today / Upcoming queue — moved above KPIs per §5 */}
      <div className="glass-dark rounded-[var(--radius-lg)] p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-bold">Upcoming Queue</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Your next scheduled posts</p>
          </div>
          <Link href="/calendar" className="text-xs text-[var(--color-primary)] font-semibold hover:underline">
            View Calendar →
          </Link>
        </div>

        <div className="space-y-2">
          {upcomingPosts.length > 0 ? (
            upcomingPosts.map((post) => (
              <div key={post.id} className="flex gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all">
                <div className="flex gap-1 shrink-0 mt-0.5">
                  {post.platforms.map((p) => (
                    <div key={p} className="h-6 w-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                      {getPlatformIcon(p)}
                    </div>
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--color-text)] truncate">{post.content}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(post.scheduledAt || "").toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--color-success)] uppercase font-semibold text-xs tracking-wider">
                      <CheckCircle className="h-3 w-3" />
                      {post.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-[var(--color-text-muted)]">No posts scheduled yet.</p>
              <Link href="/composer" className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[var(--color-primary)] hover:underline">
                <Plus className="h-3 w-3" /> Compose your first post
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* KPI cards — 4 max, below queue per §5 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Scheduled Content"
          value={String(scheduledCount)}
          change="+3 new"
          changeType="up"
          icon={Calendar}
        />
        <MetricCard
          title="Analytics Reach"
          value="124.8K"
          change="+14.2%"
          changeType="up"
          icon={TrendingUp}
        />
        <MetricCard
          title="Engagement Rate"
          value="5.62%"
          change="+0.8%"
          changeType="up"
          icon={Zap}
        />
        <MetricCard
          title="Connected Channels"
          value={`${accounts.length} linked`}
          change="All active"
          changeType="up"
          icon={Users}
        />
      </div>

      {/* Show later: Analytics chart + Quick Compose — §8 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Engagement chart */}
        <div className="glass-dark col-span-1 lg:col-span-2 rounded-[var(--radius-lg)] p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-bold">Weekly Engagement</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Impressions and action trends</p>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" /> Reach</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" /> Actions</span>
            </div>
          </div>

          <div className="h-[220px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: "var(--radius-md)" }}
                  labelStyle={{ color: "var(--color-text)", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="reach" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorReach)" strokeWidth={2} />
                <Area type="monotone" dataKey="engagement" stroke="var(--color-accent)" fillOpacity={1} fill="url(#colorEngagement)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Compose Box */}
        <div className="glass-dark rounded-[var(--radius-lg)] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
              Quick Schedule
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Draft a quick post for tomorrow</p>
          </div>

          <form onSubmit={handleQuickCompose} className="space-y-4 mt-4">
            <textarea
              rows={3}
              value={quickContent}
              onChange={(e) => setQuickContent(e.target.value)}
              placeholder="Share an update or announcement..."
              className="w-full p-3 text-sm bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors resize-none placeholder:text-[var(--color-text-muted)]"
            />

            <div className="space-y-2">
              <span className="block text-xs font-medium text-[var(--color-text-muted)]">Select Channels</span>
              <div className="flex gap-1.5 flex-wrap">
                {accounts.map((acc) => {
                  const isSelected = quickPlatforms.includes(acc.platform);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => toggleQuickPlatform(acc.platform)}
                      className={`h-7 w-7 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? "bg-[var(--color-primary)] border-transparent text-white"
                          : "bg-[var(--color-background)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                      title={acc.username}
                    >
                      {getPlatformIcon(acc.platform)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 bg-[var(--color-primary)] text-white text-sm font-semibold py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              Schedule Post
            </button>
          </form>
        </div>
      </div>

      {/* Account Health — replaced System Status diagnostics */}
      {accounts.length > 0 && (
        <div className="glass-dark rounded-[var(--radius-lg)] p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold">Account Health</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Status of your connected platforms</p>
            </div>
            <Link href="/settings/accounts" className="text-xs text-[var(--color-primary)] font-semibold hover:underline">
              Manage →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)]">
                <div className="h-8 w-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                  {getPlatformIcon(acc.platform)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-[var(--color-text)] truncate">{acc.username}</span>
                  <span className="block text-xs text-[var(--color-text-muted)] capitalize">{acc.platform}</span>
                </div>
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)] shrink-0" title="Connected" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
