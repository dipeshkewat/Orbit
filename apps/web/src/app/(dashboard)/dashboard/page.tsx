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
  ArrowUpRight as ArrowUpRightIcon,
  Layers,
  ChevronRight,
  Share2,
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

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram": return <Instagram className="h-4 w-4 text-[#E1306C]" />;
      case "twitter": return <Twitter className="h-4 w-4 text-[#1DA1F2]" />;
      case "linkedin": return <Linkedin className="h-4 w-4 text-[#0077B5]" />;
      case "facebook": return <Facebook className="h-4 w-4 text-[#1877F2]" />;
      default: return <Share2 className="h-4 w-4 text-gray-400" />;
    }
  };

  const upcomingPosts = posts
    .filter((p) => p.status === "scheduled")
    .sort((a, b) => new Date(a.scheduledAt || "").getTime() - new Date(b.scheduledAt || "").getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ── Top Header Section (Inspiration Style) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Single Stake (3,3)
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-gray-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span>7 hrs, 8 min to next rebase schedule</span>
          </p>
        </div>

        {/* Top-Right Pill Metric Summary Badge */}
        <div className="inline-flex items-center gap-3 bg-[#111318] text-white px-4 py-2 rounded-xl shadow-sm self-start sm:self-auto">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gray-800 flex items-center justify-center text-emerald-400">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Scheduled Queue</span>
              <span className="text-sm font-extrabold text-white">{scheduledCount} Posts Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Needs Attention Row (If Any Issues Exist) ── */}
      {failedPosts.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <span className="block text-xs font-bold">{failedPosts.length} post(s) failed to publish</span>
              <span className="text-[11px] text-rose-700">Review your channel credentials and retry.</span>
            </div>
          </div>
          <Link href="/calendar" className="text-xs font-bold text-rose-700 hover:underline">
            Fix issues →
          </Link>
        </div>
      )}

      {/* ── Dual-Card Contrast Layout (Mirroring Whale Loans Inspiration) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Action Card — Crisp Pure White Surface */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          
          {/* Tab Selector Pill Bar */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("schedule")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "schedule"
                    ? "bg-[#111318] text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                STAKE / SCHEDULE
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "ai"
                    ? "bg-[#111318] text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                AI DRAFT
              </button>
            </div>
            
            <button
              onClick={handleAiSuggest}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Auto Fill
            </button>
          </div>

          {/* Action Form */}
          <form onSubmit={handleQuickCompose} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Campaign Message
              </label>
              <textarea
                rows={4}
                value={quickContent}
                onChange={(e) => setQuickContent(e.target.value)}
                placeholder="Enter post content or announcement..."
                className="w-full p-4 text-xs font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white outline-none focus:border-gray-900 dark:focus:border-white transition-colors resize-none placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                Target Social Channels
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
                          ? "bg-[#111318] border-[#111318] text-white shadow-sm"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {getPlatformIcon(acc.platform)}
                      <span className="capitalize">{acc.platform}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* High-Contrast Obsidian Dark CTA Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#111318] hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-md active:scale-[0.99]"
            >
              <Send className="h-3.5 w-3.5" />
              Schedule HUMP Post
            </button>
          </form>

          {/* Quick Metrics Footer */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div>
              <span className="block text-gray-400 font-medium">Your Balance</span>
              <span className="font-bold text-gray-900 dark:text-white">0.0 HUMP</span>
            </div>
            <div>
              <span className="block text-gray-400 font-medium">Next Reward</span>
              <span className="font-bold text-gray-900 dark:text-white">0.5378%</span>
            </div>
            <div>
              <span className="block text-gray-400 font-medium">ROI (5-Day Rate)</span>
              <span className="font-bold text-emerald-600">8.3786%</span>
            </div>
          </div>
        </div>

        {/* Right Metric Container — High-Contrast Obsidian Dark Card */}
        <div className="lg:col-span-5 bg-[#111318] text-white rounded-2xl p-6 shadow-xl border border-gray-800 flex flex-col justify-between space-y-6">
          
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Estimated Yield</span>
              <span className="text-xs font-bold text-emerald-400">APY 257,900%</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowUpRightIcon className="h-5 w-5" />
            </div>
          </div>

          {/* Big Stat Block 1 */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-400 block uppercase tracking-wider">Total Value Deposited</span>
            <p className="text-4xl font-black text-white tracking-tight">$571,320</p>
            <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 pt-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+14.2% reach expansion this week</span>
            </p>
          </div>

          <div className="h-px bg-gray-800" />

          {/* Big Stat Block 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Current Index</span>
              <p className="text-xl font-bold text-white mt-1">1.99 HUMP</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Linked Channels</span>
              <p className="text-xl font-bold text-white mt-1">{accounts.length} Active</p>
            </div>
          </div>

          {/* Mini Sparkline Visualization */}
          <div className="pt-2">
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="reach" stroke="#10B981" strokeWidth={2} fill="url(#heroGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* ── Table Section — Obsidian Dark Header + White Item Rows ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Bond & Scheduled Queue (4,4)
          </h2>
          <Link href="/calendar" className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1">
            <span>View Full Calendar</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          
          {/* Obsidian Dark Table Header Bar */}
          <div className="bg-[#111318] text-white px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider grid grid-cols-12 gap-4 items-center border-b border-gray-800">
            <div className="col-span-5 sm:col-span-6">Campaign Content</div>
            <div className="col-span-3 sm:col-span-2">Scheduled Time</div>
            <div className="col-span-2 sm:col-span-2 text-center">Status</div>
            <div className="col-span-2 sm:col-span-2 text-right">Action</div>
          </div>

          {/* Table Body Rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {upcomingPosts.length > 0 ? (
              upcomingPosts.map((post) => (
                <div key={post.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  
                  {/* Content & Platforms */}
                  <div className="col-span-5 sm:col-span-6 flex items-center gap-3 min-w-0">
                    <div className="flex gap-1 shrink-0">
                      {post.platforms.map((p) => (
                        <div key={p} className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                          {getPlatformIcon(p)}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{post.content}</span>
                  </div>

                  {/* Scheduled Time */}
                  <div className="col-span-3 sm:col-span-2 text-xs font-medium text-gray-500">
                    {new Date(post.scheduledAt || "").toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-2 sm:col-span-2 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                      <CheckCircle className="h-3 w-3" />
                      {post.status}
                    </span>
                  </div>

                  {/* Action Link */}
                  <div className="col-span-2 sm:col-span-2 text-right">
                    <Link
                      href="/calendar"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111318] text-white text-[11px] font-bold hover:bg-gray-800 transition-colors"
                    >
                      <span>Bond</span>
                    </Link>
                  </div>

                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-gray-500">
                No scheduled campaign posts. Use the composer to stake your first post.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
