"use client";

import { useState } from "react";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Plus,
  Trash2,
  BarChart3,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  X,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { toast } from "sonner";

interface Competitor {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  followerGrowth: number;
  avgEngagement: number;
  postsPerWeek: number;
  topContentType: string;
}

const MOCK_COMPETITORS: Competitor[] = [
  { id: "1", name: "Buffer", handle: "@buffer", platform: "twitter", followers: 1200000, followerGrowth: 2.4, avgEngagement: 3.8, postsPerWeek: 14, topContentType: "Threads" },
  { id: "2", name: "Hootsuite", handle: "@hootsuite", platform: "instagram", followers: 890000, followerGrowth: -0.8, avgEngagement: 4.2, postsPerWeek: 21, topContentType: "Carousels" },
  { id: "3", name: "Later", handle: "@latermedia", platform: "instagram", followers: 650000, followerGrowth: 5.1, avgEngagement: 5.6, postsPerWeek: 18, topContentType: "Reels" },
  { id: "4", name: "Sprout Social", handle: "@SproutSocial", platform: "linkedin", followers: 420000, followerGrowth: 3.2, avgEngagement: 2.9, postsPerWeek: 10, topContentType: "Articles" },
];

export default function CompetitorTrackingPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>(MOCK_COMPETITORS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [newPlatform, setNewPlatform] = useState("twitter");

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram": return <Instagram className="h-4 w-4 text-[var(--color-instagram)]" />;
      case "twitter": return <Twitter className="h-4 w-4 text-white" />;
      case "linkedin": return <Linkedin className="h-4 w-4 text-[var(--color-linkedin)]" />;
      case "facebook": return <Facebook className="h-4 w-4 text-[var(--color-facebook)]" />;
      default: return null;
    }
  };

  const handleAddCompetitor = () => {
    if (!newName.trim() || !newHandle.trim()) {
      toast.error("Please fill in competitor details");
      return;
    }
    const comp: Competitor = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      handle: newHandle,
      platform: newPlatform,
      followers: Math.floor(Math.random() * 500000) + 10000,
      followerGrowth: parseFloat((Math.random() * 8 - 2).toFixed(1)),
      avgEngagement: parseFloat((Math.random() * 6 + 1).toFixed(1)),
      postsPerWeek: Math.floor(Math.random() * 20) + 5,
      topContentType: ["Carousels", "Reels", "Threads", "Stories"][Math.floor(Math.random() * 4)]
    };
    setCompetitors((prev) => [...prev, comp]);
    setShowAddModal(false);
    setNewName("");
    setNewHandle("");
    toast.success(`Now tracking ${newName}!`);
  };

  const formatFollowers = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-[var(--color-error)]" />
            Competitor Tracking
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Monitor competitor social metrics and benchmark your performance.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-[var(--radius-md)] hover:opacity-90 active:scale-95 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Competitor
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-[var(--radius-lg)] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-[var(--color-primary-light)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Avg Competitor Followers</span>
          </div>
          <span className="text-2xl font-extrabold">{formatFollowers(competitors.reduce((s, c) => s + c.followers, 0) / competitors.length)}</span>
        </div>
        <div className="glass rounded-[var(--radius-lg)] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-[var(--color-accent)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Avg Engagement Rate</span>
          </div>
          <span className="text-2xl font-extrabold">{(competitors.reduce((s, c) => s + c.avgEngagement, 0) / competitors.length).toFixed(1)}%</span>
        </div>
        <div className="glass rounded-[var(--radius-lg)] p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-[var(--color-success)]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Avg Posts / Week</span>
          </div>
          <span className="text-2xl font-extrabold">{(competitors.reduce((s, c) => s + c.postsPerWeek, 0) / competitors.length).toFixed(0)}</span>
        </div>
      </div>

      {/* Competitor Table */}
      <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Brand</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Platform</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Followers</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Growth</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Eng. Rate</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Posts/Wk</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Top Format</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((comp) => (
                <tr key={comp.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <span className="text-xs font-bold text-[var(--color-text)]">{comp.name}</span>
                      <span className="block text-[10px] text-[var(--color-text-muted)]">{comp.handle}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 capitalize text-xs text-[var(--color-text-secondary)]">
                      {getPlatformIcon(comp.platform)}
                      {comp.platform}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-bold">{formatFollowers(comp.followers)}</td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-0.5 text-xs font-bold ${comp.followerGrowth >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}>
                      {comp.followerGrowth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(comp.followerGrowth)}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-[var(--color-text-secondary)]">{comp.avgEngagement}%</td>
                  <td className="px-5 py-4 text-xs font-semibold text-[var(--color-text-secondary)]">{comp.postsPerWeek}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-[var(--color-text-secondary)]">{comp.topContentType}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => {
                        setCompetitors((prev) => prev.filter((c) => c.id !== comp.id));
                        toast.success(`Stopped tracking ${comp.name}`);
                      }}
                      className="p-1.5 rounded hover:bg-[var(--color-error)]/10 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Competitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[400px] glass rounded-[var(--radius-xl)] p-6 relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold flex items-center gap-1.5 mb-4">
              <Target className="h-4.5 w-4.5 text-[var(--color-error)]" />
              Track New Competitor
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Brand Name</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Buffer" className="w-full px-3 py-2.5 text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Handle / URL</label>
                <input type="text" value={newHandle} onChange={(e) => setNewHandle(e.target.value)} placeholder="@buffer" className="w-full px-3 py-2.5 text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors font-mono" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Platform</label>
                <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-text)] outline-none">
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              <button type="button" onClick={handleAddCompetitor} className="w-full flex items-center justify-center gap-1.5 bg-[var(--color-primary)] text-white text-xs font-semibold py-3 rounded-[var(--radius-md)] hover:opacity-90 active:scale-95">
                <Target className="h-3.5 w-3.5" />
                Start Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
