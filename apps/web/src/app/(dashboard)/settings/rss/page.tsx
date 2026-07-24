"use client";

import { useState } from "react";
import {
  Rss,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Globe,
  Clock,
  X
} from "lucide-react";
import { toast } from "sonner";

interface RssFeed {
  id: string;
  url: string;
  name: string;
  platforms: string[];
  autoPost: boolean;
  lastChecked: string;
  status: "active" | "error" | "paused";
  postsImported: number;
}

const MOCK_FEEDS: RssFeed[] = [
  {
    id: "1",
    url: "https://blog.orbit.com/feed.xml",
    name: "Orbit Engineering Blog",
    platforms: ["twitter", "linkedin"],
    autoPost: true,
    lastChecked: "2026-07-17T10:30:00Z",
    status: "active",
    postsImported: 42
  },
  {
    id: "2",
    url: "https://techcrunch.com/feed/",
    name: "TechCrunch Latest",
    platforms: ["twitter"],
    autoPost: false,
    lastChecked: "2026-07-17T09:15:00Z",
    status: "paused",
    postsImported: 18
  },
  {
    id: "3",
    url: "https://feeds.feedburner.com/design-news",
    name: "Design Weekly Digest",
    platforms: ["instagram", "facebook"],
    autoPost: true,
    lastChecked: "2026-07-16T22:00:00Z",
    status: "error",
    postsImported: 7
  }
];

export default function RssAutoPostPage() {
  const [feeds, setFeeds] = useState<RssFeed[]>(MOCK_FEEDS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedPlatforms, setNewFeedPlatforms] = useState<string[]>([]);

  const togglePlatform = (platform: string) => {
    setNewFeedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleAddFeed = () => {
    if (!newFeedUrl.trim()) {
      toast.error("Please enter a valid RSS feed URL");
      return;
    }
    if (newFeedPlatforms.length === 0) {
      toast.error("Select at least one target platform");
      return;
    }

    const feed: RssFeed = {
      id: Math.random().toString(36).substr(2, 9),
      url: newFeedUrl,
      name: newFeedName || newFeedUrl,
      platforms: newFeedPlatforms,
      autoPost: true,
      lastChecked: new Date().toISOString(),
      status: "active",
      postsImported: 0
    };

    setFeeds((prev) => [...prev, feed]);
    setShowAddModal(false);
    setNewFeedUrl("");
    setNewFeedName("");
    setNewFeedPlatforms([]);
    toast.success("RSS feed connected & monitoring started!");
  };

  const handleDeleteFeed = (id: string) => {
    setFeeds((prev) => prev.filter((f) => f.id !== id));
    toast.success("RSS feed disconnected");
  };

  const handleToggleAutoPost = (id: string) => {
    setFeeds((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, autoPost: !f.autoPost, status: f.autoPost ? "paused" : "active" }
          : f
      )
    );
  };

  const handleRefreshFeed = (id: string) => {
    setFeeds((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, lastChecked: new Date().toISOString(), status: "active" }
          : f
      )
    );
    toast.success("Feed refreshed — checking for new articles...");
  };

  const statusConfig = {
    active: { icon: CheckCircle2, color: "text-[var(--color-success)]", bg: "bg-[var(--color-success)]/10", label: "Active" },
    error: { icon: AlertCircle, color: "text-[var(--color-error)]", bg: "bg-[var(--color-error)]/10", label: "Error" },
    paused: { icon: Clock, color: "text-[var(--color-text-muted)]", bg: "bg-[var(--color-surface)]", label: "Paused" }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RSS Auto-Posting</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Connect RSS feeds to automatically schedule and publish new articles across platforms.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-[var(--radius-md)] hover:opacity-90 active:scale-95 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Connect RSS Feed
        </button>
      </div>

      {/* Feed Cards */}
      <div className="space-y-4">
        {feeds.map((feed) => {
          const status = statusConfig[feed.status];
          const StatusIcon = status.icon;
          return (
            <div
              key={feed.id}
              className="glass rounded-[var(--radius-lg)] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Feed info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[var(--color-primary-light)] shrink-0" />
                  <h3 className="text-sm font-bold truncate">{feed.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${status.bg} ${status.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>
                <p className="text-xs font-mono text-[var(--color-text-muted)] truncate">{feed.url}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  <span>Targets: <span className="font-semibold capitalize text-[var(--color-text-secondary)]">{feed.platforms.join(", ")}</span></span>
                  <span>•</span>
                  <span>{feed.postsImported} posts imported</span>
                  <span>•</span>
                  <span>Last checked: {new Date(feed.lastChecked).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleAutoPost(feed.id)}
                  className={`px-3 py-1.5 rounded-[var(--radius-md)] border text-xs font-bold uppercase tracking-wider transition-all ${
                    feed.autoPost
                      ? "border-[var(--color-success)] bg-[var(--color-success)]/10 text-[var(--color-success)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  {feed.autoPost ? "Auto-Post ON" : "Auto-Post OFF"}
                </button>
                <button
                  onClick={() => handleRefreshFeed(feed.id)}
                  className="p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteFeed(feed.id)}
                  className="p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-error)]/10 text-[var(--color-error)] transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {feeds.length === 0 && (
          <div className="glass rounded-[var(--radius-lg)] p-12 text-center">
            <Rss className="h-8 w-8 text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">No RSS feeds connected</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Add your first feed to start auto-posting articles.</p>
          </div>
        )}
      </div>

      {/* Add Feed Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[440px] glass rounded-[var(--radius-xl)] p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold flex items-center gap-1.5 mb-2">
              <Rss className="h-4.5 w-4.5 text-[var(--color-accent)]" />
              Connect New RSS Feed
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-5">Enter any valid RSS/Atom feed URL to start monitoring.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Feed URL</label>
                <input
                  type="url"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  placeholder="https://blog.example.com/feed.xml"
                  className="w-full px-3 py-2.5 text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-muted)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Feed Label (optional)</label>
                <input
                  type="text"
                  value={newFeedName}
                  onChange={(e) => setNewFeedName(e.target.value)}
                  placeholder="My Engineering Blog"
                  className="w-full px-3 py-2.5 text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Target Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {["twitter", "instagram", "linkedin", "facebook"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`px-3 py-1.5 rounded-[var(--radius-md)] border text-xs font-bold uppercase tracking-wider capitalize transition-all ${
                        newFeedPlatforms.includes(p)
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary-light)]"
                          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddFeed}
                className="w-full flex items-center justify-center gap-1.5 bg-[var(--color-primary)] text-white text-xs font-semibold py-3 rounded-[var(--radius-md)] hover:opacity-90 active:scale-95"
              >
                <Rss className="h-3.5 w-3.5" />
                Connect & Start Monitoring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
