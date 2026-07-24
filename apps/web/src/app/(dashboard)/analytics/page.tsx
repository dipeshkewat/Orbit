"use client";

import { useState } from "react";
import { useCalendarStore } from "@/lib/store";
import {
  TrendingUp,
  Zap,
  Users,
  Eye,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  Heart,
  MessageSquare,
  FileText,
  X
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell
} from "recharts";

const MONTHLY_REACH = [
  { month: "Jan", instagram: 4000, twitter: 2400, linkedin: 1800 },
  { month: "Feb", instagram: 3000, twitter: 1398, linkedin: 2200 },
  { month: "Mar", instagram: 9800, twitter: 2000, linkedin: 2900 },
  { month: "Apr", instagram: 3908, twitter: 2780, linkedin: 3908 },
  { month: "May", instagram: 4800, twitter: 1890, linkedin: 4800 },
  { month: "Jun", instagram: 3800, twitter: 2390, linkedin: 3800 },
  { month: "Jul", instagram: 6300, twitter: 3490, linkedin: 5200 },
];

const PLATFORM_PIE = [
  { name: "Instagram", value: 45000, color: "var(--color-instagram)" },
  { name: "Twitter / X", value: 28000, color: "var(--color-twitter)" },
  { name: "LinkedIn", value: 34000, color: "var(--color-linkedin)" },
  { name: "Facebook", value: 18000, color: "var(--color-facebook)" },
];

function AnalyticsCard({
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
    <div className="glass rounded-[var(--radius-lg)] p-5 transition-all hover:shadow-[var(--shadow-md)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] font-medium">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]/10">
          <Icon className="h-5 w-5 text-[var(--color-primary-light)]" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs">
        {changeType === "up" ? (
          <ArrowUpRight className="h-4 w-4 text-[var(--color-success)]" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-[var(--color-error)]" />
        )}
        <span
          className={
            changeType === "up"
              ? "text-[var(--color-success)] font-semibold"
              : "text-[var(--color-error)] font-semibold"
          }
        >
          {change}
        </span>
        <span className="text-[var(--color-text-muted)]">vs last month</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const posts = useCalendarStore((state) => state.posts);
  const [activeTab, setActiveTab] = useState<"reach" | "growth" | "breakdown">("reach");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTitle, setReportTitle] = useState("Acme Social Media Performance");
  const [clientName, setClientName] = useState("Acme Corp");
  const [brandColor, setBrandColor] = useState("var(--color-primary)");

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram": return <Instagram className="h-3.5 w-3.5 text-[var(--color-instagram)]" />;
      case "twitter": return <Twitter className="h-3.5 w-3.5 text-white" />;
      case "linkedin": return <Linkedin className="h-3.5 w-3.5 text-[var(--color-linkedin)]" />;
      case "facebook": return <Facebook className="h-3.5 w-3.5 text-[var(--color-facebook)]" />;
      default: return null;
    }
  };

  // Mock top performing posts
  const publishedPosts = posts
    .filter((p) => p.status === "published")
    .map((post) => {
      // aggregate metrics
      const likes = Object.values(post.metrics || {}).reduce((s, m) => s + m.likes, 0);
      const comments = Object.values(post.metrics || {}).reduce((s, m) => s + m.comments, 0);
      const shares = Object.values(post.metrics || {}).reduce((s, m) => s + m.shares, 0);
      const impressions = Object.values(post.metrics || {}).reduce((s, m) => s + m.impressions, 0);
      return {
        ...post,
        likes,
        comments,
        shares,
        impressions
      };
    })
    .sort((a, b) => b.impressions - a.impressions);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Audit campaign metrics, audience growth, and top-performing creatives.
          </p>
        </div>
        <button
          onClick={() => setShowReportModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-[var(--radius-md)] hover:opacity-90 active:scale-95 shrink-0"
        >
          <FileText className="h-3.5 w-3.5" />
          Export White-Label Report
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Impressions"
          value="142.8K"
          change="+18.4%"
          changeType="up"
          icon={Eye}
        />
        <AnalyticsCard
          title="Total Engagement"
          value="18,420"
          change="+12.2%"
          changeType="up"
          icon={Zap}
        />
        <AnalyticsCard
          title="Audience Growth"
          value="+3,420"
          change="+6.7%"
          changeType="up"
          icon={Users}
        />
        <AnalyticsCard
          title="Avg. Engagement Rate"
          value="5.62%"
          change="-0.2%"
          changeType="down"
          icon={TrendingUp}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main chart selector */}
        <div className="glass col-span-2 rounded-[var(--radius-lg)] p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold">Campaign Performance</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Monthly breakdown of follower interactions</p>
            </div>

            {/* Tabs selector */}
            <div className="flex gap-1.5 bg-[var(--color-background)] p-1 rounded-lg border border-[var(--color-border)]">
              <button
                onClick={() => setActiveTab("reach")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === "reach" ? "bg-[var(--color-surface)] text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
                }`}
              >
                Reach
              </button>
              <button
                onClick={() => setActiveTab("growth")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === "growth" ? "bg-[var(--color-surface)] text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
                }`}
              >
                Growth
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {activeTab === "reach" ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_REACH} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reachInsta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-instagram)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--color-instagram)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="reachLinkedin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-linkedin)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--color-linkedin)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: "var(--radius-md)" }}
                    labelStyle={{ color: "var(--color-text)", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="instagram" stroke="var(--color-instagram)" fillOpacity={1} fill="url(#reachInsta)" strokeWidth={2} />
                  <Area type="monotone" dataKey="linkedin" stroke="var(--color-linkedin)" fillOpacity={1} fill="url(#reachLinkedin)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MONTHLY_REACH} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: "var(--radius-md)" }}
                    labelStyle={{ color: "var(--color-text)", fontWeight: "bold" }}
                  />
                  <Line type="monotone" dataKey="instagram" stroke="var(--color-instagram)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="twitter" stroke="var(--color-twitter)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="linkedin" stroke="var(--color-linkedin)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Platform Breakdown Comparison */}
        <div className="glass rounded-[var(--radius-lg)] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold">Platform Spread</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Reach percentage across channels</p>
          </div>

          <div className="h-[200px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PLATFORM_PIE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: "var(--radius-md)" }}
                  labelStyle={{ color: "var(--color-text)", fontWeight: "bold" }}
                />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]}>
                  {PLATFORM_PIE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-[var(--color-border)]">
            {PLATFORM_PIE.map((entry) => (
              <div key={entry.name} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="font-medium text-[var(--color-text-secondary)]">{entry.name}</span>
                </span>
                <span className="font-bold text-[var(--color-text)]">{(entry.value / 1000).toFixed(1)}K views</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Posts Table Grid */}
      <div className="glass rounded-[var(--radius-lg)] p-5">
        <h2 className="text-lg font-bold">Top Performing Creative Posts</h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Posts ranked by maximum target impressions reached</p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] pb-3 text-[var(--color-text-muted)] font-bold uppercase tracking-wider text-xs">
                <th className="pb-3 pr-4">Post Content</th>
                <th className="pb-3 px-4">Channels</th>
                <th className="pb-3 px-4 text-right">Impressions</th>
                <th className="pb-3 px-4 text-right">Likes</th>
                <th className="pb-3 px-4 text-right">Comments</th>
                <th className="pb-3 pl-4 text-right">Shares</th>
              </tr>
            </thead>
            <tbody>
              {publishedPosts.length > 0 ? (
                publishedPosts.map((post) => (
                  <tr key={post.id} className="border-b border-[var(--color-border)]/40 last:border-0 hover:bg-[var(--color-surface-hover)]/30 transition-colors">
                    <td className="py-4 pr-4 font-medium text-[var(--color-text)] max-w-md truncate">
                      {post.content}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1">
                        {post.platforms.map((p) => (
                          <div key={p} className="h-6 w-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                            {getPlatformIcon(p)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-[var(--color-text)]">
                      {post.impressions.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-[var(--color-text-secondary)] font-medium flex items-center justify-end gap-1">
                      <Heart className="h-3 w-3 text-[var(--color-error)]" /> {post.likes}
                    </td>
                    <td className="py-4 px-4 text-right text-[var(--color-text-secondary)] font-medium">
                      {post.comments}
                    </td>
                    <td className="py-4 pl-4 text-right text-[var(--color-text-secondary)] font-medium">
                      {post.shares}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                    No published posts available for metrics compilation yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* White-Label PDF Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[480px] glass rounded-[var(--radius-xl)] p-6 relative">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold flex items-center gap-1.5 mb-2">
              <FileText className="h-4.5 w-4.5 text-[var(--color-primary-light)]" />
              White-Label PDF Report
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-5">Customize branding for a client-ready performance report.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Report Title</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Client / Company Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Brand Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-9 w-12 rounded border border-[var(--color-border)] cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-[var(--color-text-muted)]">{brandColor}</span>
                </div>
              </div>

              {/* Preview strip */}
              <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded" style={{ backgroundColor: brandColor }} />
                  <span className="text-xs font-bold text-[var(--color-text)]">{reportTitle}</span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">Prepared for: {clientName} · Period: June 2026 – July 2026</span>
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className="text-center p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <span className="block text-xs font-bold" style={{ color: brandColor }}>142.8K</span>
                    <span className="text-[8px] text-[var(--color-text-muted)]">Impressions</span>
                  </div>
                  <div className="text-center p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <span className="block text-xs font-bold" style={{ color: brandColor }}>18.4K</span>
                    <span className="text-[8px] text-[var(--color-text-muted)]">Engagement</span>
                  </div>
                  <div className="text-center p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <span className="block text-xs font-bold" style={{ color: brandColor }}>+3.4K</span>
                    <span className="text-[8px] text-[var(--color-text-muted)]">Followers</span>
                  </div>
                  <div className="text-center p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <span className="block text-xs font-bold" style={{ color: brandColor }}>87.2%</span>
                    <span className="text-[8px] text-[var(--color-text-muted)]">Score</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowReportModal(false);
                  import('sonner').then(({ toast }) => toast.success(`White-label PDF report generated for ${clientName}!`));
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-[var(--color-primary)] text-white text-xs font-semibold py-3 rounded-[var(--radius-md)] hover:opacity-90 active:scale-95"
              >
                <FileText className="h-3.5 w-3.5" />
                Generate & Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
