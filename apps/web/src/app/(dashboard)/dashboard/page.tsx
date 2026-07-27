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
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronRight,
  Share2,
  BarChart2,
  CheckCircle2,
} from "lucide-react";
import { getPlatformIcon } from "@/components/social-icons";
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

  const [activeTab, setActiveTab] = useState<"schedule" | "ai">("schedule");
  const [quickContent, setQuickContent] = useState("");
  const [quickPlatforms, setQuickPlatforms] = useState<string[]>([]);

  const scheduledCount = posts.filter((p) => p.status === "scheduled").length;
  const publishedCount = posts.filter((p) => p.status === "published").length;
  const failedPosts = posts.filter((p) => p.status === "failed");

  const handleQuickCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickContent.trim()) {
      toast.error("Please enter post content");
      return;
    }
    if (quickPlatforms.length === 0) {
      toast.error("Please select at least one channel");
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

  const handleAiSuggest = () => {
    setQuickContent("🚀 Elevating our social impact with Orbit! Designing, scheduling, and mastering audience reach across all platforms from one calm dashboard. #growth #marketing #saas");
    toast.success("AI Caption drafted!");
  };

  const toggleQuickPlatform = (platform: string) => {
    setQuickPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };



  const upcomingPosts = posts
    .filter((p) => p.status === "scheduled")
    .sort((a, b) => new Date(a.scheduledAt || "").getTime() - new Date(b.scheduledAt || "").getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ── Top Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            {getGreeting()}, {user?.name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <span>Workspace: <strong className="text-[var(--color-text)]">{workspace?.name || "Personal Brand"}</strong></span>
          </p>
        </div>

        {/* Top Metric Summary Pill */}
        <div className="inline-flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] px-4 py-2 rounded-xl shadow-sm self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-[var(--color-surface-secondary)] flex items-center justify-center text-[var(--color-accent)]">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Scheduled Queue</span>
              <span className="text-xs font-bold text-[var(--color-text)]">{scheduledCount} Posts Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Needs Attention Row (If Issues Exist) ── */}
      {failedPosts.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <span className="block text-xs font-bold">{failedPosts.length} post(s) failed to publish</span>
              <span className="text-[11px] text-rose-700 dark:text-rose-300">Review channel credentials and retry.</span>
            </div>
          </div>
          <Link href="/calendar" className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline">
            Fix issues →
          </Link>
        </div>
      )}

      {/* ── Dual-Card Contrast Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Action Card — Crisp Pure White Surface */}
        <div className="lg:col-span-7 glass p-6 flex flex-col justify-between space-y-6">
          
          {/* Tab Selector Pill Bar */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <div className="flex items-center gap-2 bg-[var(--color-background)] p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("schedule")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "schedule"
                    ? "bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                QUICK SCHEDULE
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "ai"
                    ? "bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
              >
                AI DRAFT
              </button>
            </div>
            
            <button
              onClick={handleAiSuggest}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-accent)] hover:underline transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Auto Fill
            </button>
          </div>

          {/* Action Form */}
          <form onSubmit={handleQuickCompose} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                Campaign Message
              </label>
              <textarea
                rows={4}
                value={quickContent}
                onChange={(e) => setQuickContent(e.target.value)}
                placeholder="Enter post content or announcement..."
                className="w-full p-4 text-xs font-medium bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors resize-none placeholder:text-[var(--color-text-muted)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Target Channels
              </label>
              <div className="flex gap-2 flex-wrap">
                {accounts.map((acc) => {
                  const isSelected = quickPlatforms.includes(acc.platform);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => toggleQuickPlatform(acc.platform)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-sm"
                          : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      {getPlatformIcon(acc.platform)}
                      <span className="capitalize">{acc.platform}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-inverse)] text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-md active:scale-[0.99]"
            >
              <Send className="h-3.5 w-3.5" />
              Schedule Campaign Post
            </button>
          </form>

          {/* Quick Metrics Footer */}
          <div className="pt-3 border-t border-[var(--color-border)] grid grid-cols-3 gap-2 text-center text-[11px]">
            <div>
              <span className="block text-[var(--color-text-muted)] font-medium">Published Today</span>
              <span className="font-bold text-[var(--color-text)]">{publishedCount} Posts</span>
            </div>
            <div>
              <span className="block text-[var(--color-text-muted)] font-medium">Scheduled Queue</span>
              <span className="font-bold text-[var(--color-text)]">{scheduledCount} Posts</span>
            </div>
            <div>
              <span className="block text-[var(--color-text-muted)] font-medium">Weekly Growth</span>
              <span className="font-bold text-[var(--color-accent)]">+14.2% Reach</span>
            </div>
          </div>
        </div>

        {/* Right Metric Container — Moderate Darker Shade / Elevated Surface */}
        <div className="lg:col-span-5 glass-secondary p-6 flex flex-col justify-between space-y-6">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <div>
              <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Estimated Growth</span>
              <span className="text-xs font-bold text-[var(--color-accent)]">+14.2% Weekly Reach</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)]">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>

          {/* Big Stat Block */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-[var(--color-text-muted)] block uppercase tracking-wider">Total Impressions</span>
            <p className="text-4xl font-black text-[var(--color-text)] tracking-tight">124,800</p>
            <p className="text-xs text-[var(--color-accent)] font-semibold flex items-center gap-1 pt-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+14.2% expansion vs last 7 days</span>
            </p>
          </div>

          <div className="h-px bg-[var(--color-border)]" />

          {/* Secondary Metric Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Engagement Rate</span>
              <p className="text-xl font-bold text-[var(--color-text)] mt-1">5.62%</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Linked Accounts</span>
              <p className="text-xl font-bold text-[var(--color-text)] mt-1">{accounts.length} Channels</p>
            </div>
          </div>

          {/* Chart Preview */}
          <div className="pt-2">
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="reach" stroke="var(--color-accent)" strokeWidth={2} fill="url(#heroGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* ── Scheduled Feed Table ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--color-text)]">
            Scheduled Campaign Posts
          </h2>
          <Link href="/calendar" className="text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] flex items-center gap-1">
            <span>View Calendar</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
          
          {/* Table Header Bar */}
          <div className="bg-[var(--color-primary)] text-[var(--color-text-inverse)] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider grid grid-cols-12 gap-4 items-center border-b border-[var(--color-border)]">
            <div className="col-span-5 sm:col-span-6">Campaign Content</div>
            <div className="col-span-3 sm:col-span-2">Scheduled Time</div>
            <div className="col-span-2 sm:col-span-2 text-center">Status</div>
            <div className="col-span-2 sm:col-span-2 text-right">Action</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[var(--color-border)]">
            {upcomingPosts.length > 0 ? (
              upcomingPosts.map((post) => (
                <div key={post.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-[var(--color-surface-hover)] transition-colors">
                  
                  {/* Content & Channels */}
                  <div className="col-span-5 sm:col-span-6 flex items-center gap-3 min-w-0">
                    <div className="flex gap-1 shrink-0">
                      {post.platforms.map((p) => (
                        <div key={p} className="h-7 w-7 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center">
                          {getPlatformIcon(p)}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-[var(--color-text)] truncate">{post.content}</span>
                  </div>

                  {/* Scheduled Time */}
                  <div className="col-span-3 sm:col-span-2 text-xs font-medium text-[var(--color-text-muted)]">
                    {new Date(post.scheduledAt || "").toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-2 sm:col-span-2 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30 text-[10px] font-bold uppercase tracking-wider">
                      <CheckCircle className="h-3 w-3" />
                      {post.status}
                    </span>
                  </div>

                  {/* Action Button */}
                  <div className="col-span-2 sm:col-span-2 text-right">
                    <Link
                      href="/calendar"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-[11px] font-bold hover:bg-[var(--color-primary-hover)] transition-colors"
                    >
                      <span>Manage</span>
                    </Link>
                  </div>

                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-[var(--color-text-muted)]">
                No scheduled campaign posts. Use the composer to schedule your first post.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
