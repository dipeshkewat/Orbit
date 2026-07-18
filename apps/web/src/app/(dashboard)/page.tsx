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
  AlertTriangle
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
  dark = false,
}: {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  icon: React.ElementType;
  dark?: boolean;
}) {
  return (
    <div className={`${dark ? 'glass-dark bg-[#18181b] border-[#27272a]' : 'glass bg-white border-[#e4e4e7]'} rounded-[var(--radius-lg)] p-5 transition-all hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-[#a1a1aa]' : 'text-[var(--color-text-secondary)]'}`}>{title}</p>
          <p className={`mt-1.5 text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[var(--color-text)]'}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] ${dark ? 'bg-white/10' : 'bg-[var(--color-primary)]/10'}`}>
          <Icon className={`h-5 w-5 ${dark ? 'text-white' : 'text-[var(--color-primary-light)]'}`} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs">
        <ArrowUpRight className={`h-4 w-4 ${changeType === "up" ? "text-[#10B981]" : "text-[#EF4444]"}`} />
        <span className={`${changeType === "up" ? "text-[#10B981] font-semibold" : "text-[#EF4444] font-semibold"}`}>
          {change}
        </span>
        <span className={dark ? 'text-[#71717a]' : 'text-[var(--color-text-muted)]'}>vs last 7 days</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const posts = useCalendarStore((state) => state.posts);
  const addPost = useCalendarStore((state) => state.addPost);
  const accounts = useSocialAccountStore((state) => state.accounts);
  const workspace = useAuthStore((state) => {
    const active = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
    return active || state.workspaces[0];
  });

  const [quickContent, setQuickContent] = useState("");
  const [quickPlatforms, setQuickPlatforms] = useState<string[]>([]);

  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const publishedCount = posts.filter((p) => p.status === "published").length;

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
      scheduledAt: new Date(Date.now() + 86400000).toISOString(), // schedule for tomorrow
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
      case "twitter": return <Twitter className="h-4 w-4 text-white" />;
      case "linkedin": return <Linkedin className="h-4 w-4 text-[var(--color-linkedin)]" />;
      case "facebook": return <Facebook className="h-4 w-4 text-[var(--color-facebook)]" />;
      default: return null;
    }
  };

  const upcomingPosts = posts
    .filter((p) => p.status === "scheduled")
    .sort((a, b) => new Date(a.scheduledAt || "").getTime() - new Date(b.scheduledAt || "").getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Dashboard 
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]">
              {workspace?.name}
            </span>
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Performance overview and content health checks.
          </p>
        </div>
        <Link
          href="/composer"
          className="inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-glow)] transition-all hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Create Post
        </Link>
      </div>

      {/* Metric Cards */}
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
          dark
        />
        <MetricCard
          title="Engagement Rate"
          value="5.62%"
          change="+0.8%"
          changeType="up"
          icon={Zap}
          dark
        />
        <MetricCard
          title="Connected Channels"
          value={`${accounts.length} linked`}
          change="All active"
          changeType="up"
          icon={Users}
        />
      </div>

      {/* Analytics Graph & Feed Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Engagement chart */}
        <div className="glass col-span-2 rounded-[var(--radius-lg)] p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold">Audience Engagement</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Impressions and action trends this week</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" /> Reach</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" /> Actions</span>
            </div>
          </div>

          <div className="h-[260px] w-full mt-auto">
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
        <div className="glass rounded-[var(--radius-lg)] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-1.5">
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
              className="w-full p-3 text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors resize-none placeholder:text-[var(--color-text-muted)]"
            />

            <div className="space-y-2">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Select Channels</span>
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
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white text-xs font-semibold py-2.5 rounded-[var(--radius-md)] shadow-[var(--shadow-glow)] hover:opacity-90 active:scale-95"
            >
              <Send className="h-3 w-3" />
              Schedule Post
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Grid: Upcoming feed & status checklist */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Upcoming Posts Feed */}
        <div className="glass col-span-2 rounded-[var(--radius-lg)] p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Upcoming Feed</h2>
            <Link href="/calendar" className="text-xs text-[var(--color-primary-light)] font-semibold hover:underline">
              View Calendar
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingPosts.length > 0 ? (
              upcomingPosts.map((post) => (
                <div key={post.id} className="flex gap-4 p-4 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all">
                  <div className="flex gap-1 shrink-0 mt-0.5">
                    {post.platforms.map((p) => (
                      <div key={p} className="h-7 w-7 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                        {getPlatformIcon(p)}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text)] truncate font-medium">{post.content}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--color-text-muted)] font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(post.scheduledAt || "").toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="flex items-center gap-1 text-[var(--color-success)] uppercase font-semibold text-[10px] tracking-wider">
                        <CheckCircle className="h-3 w-3" />
                        {post.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                No scheduled posts yet. Use Quick Schedule or Content Composer to add one.
              </div>
            )}
          </div>
        </div>

        {/* System & Connection Status */}
        <div className="glass rounded-[var(--radius-lg)] p-5">
          <h2 className="text-lg font-bold">System Status</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Health monitor for connected platforms</p>

          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Prisma DB connection</span>
              <span className="text-xs font-bold text-[var(--color-success)] flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)] animate-pulse" /> Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Queue scheduler service</span>
              <span className="text-xs font-bold text-[var(--color-success)] flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" /> Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">Stripe billing module</span>
              <span className="text-xs font-bold text-[var(--color-success)] flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" /> Running
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">AI generation token-limit</span>
              <span className="text-xs font-bold text-[var(--color-success)] flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" /> Reset
              </span>
            </div>

            <div className="pt-4 border-t border-[var(--color-border)]">
              <div className="p-3.5 rounded bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 flex gap-2.5">
                <AlertTriangle className="h-5 w-5 text-[var(--color-warning)] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-bold text-[var(--color-warning)]">Local Walkthrough Mode</span>
                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                    Currently utilizing local state management for full offline traversal. Clerk/Stripe actions will simulate successful responses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
