"use client";

import { useState } from "react";
import { useCalendarStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store";
import { trpc } from "@/lib/trpc";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Clock,
  Plus,
  Trash2,
  X,
  Layers,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";

function isUuid(value: string | null): value is string {
  return value !== null && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function CalendarPage() {
  const { posts, updatePost, deletePost, reschedulePost, addPost } = useCalendarStore();
  const activeWorkspaceId = useAuthStore((state) => state.activeWorkspaceId);
  const serverWorkspaceId = isUuid(activeWorkspaceId) ? activeWorkspaceId : null;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvContentText, setCsvContentText] = useState("");
  const [parsedPostCount, setParsedPostCount] = useState(0);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const calendarQuery = trpc.posts.getCalendar.useQuery(
    {
      workspaceId: serverWorkspaceId ?? "00000000-0000-0000-0000-000000000000",
      from: monthStart.toISOString(),
      to: monthEnd.toISOString(),
    },
    { enabled: serverWorkspaceId !== null },
  );
  const scheduleMutation = trpc.posts.schedule.useMutation();
  const deleteMutation = trpc.posts.delete.useMutation();

  const rawCalendarData: unknown = calendarQuery.data;
  const serverPosts = (Array.isArray(rawCalendarData) ? rawCalendarData : []).map((post: unknown) => {
    const serialized = post as {
      id: string;
      content: string | null;
      platforms: string[];
      status: string;
      scheduledAt: string | null;
      publishedAt: string | null;
      mediaUrls: unknown;
    };
    return {
      id: serialized.id,
      content: serialized.content ?? "",
      platforms: serialized.platforms,
      status: serialized.status as "draft" | "scheduled" | "publishing" | "published" | "failed",
      scheduledAt: serialized.scheduledAt,
      publishedAt: serialized.publishedAt,
      mediaUrls: Array.isArray(serialized.mediaUrls)
        ? serialized.mediaUrls.filter((value): value is string => typeof value === "string")
        : [],
      platformOverrides: {},
    };
  }) ?? [];
  const visiblePosts = serverWorkspaceId ? serverPosts : posts;

  const handleCsvImport = () => {
    if (!csvContentText.trim()) {
      toast.error("Please enter CSV content");
      return;
    }

    try {
      const lines = csvContentText.split("\n").filter((l) => l.trim() !== "");
      let importedCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split("|").map((p) => p.trim());
        if (parts.length < 2) continue;

        const content = parts[0];
        const platforms = parts[1].split(",").map((p) => p.trim());
        const dateStr = parts[2] || new Date(Date.now() + 86400000).toISOString();

        addPost({
          content,
          platforms,
          status: "scheduled",
          scheduledAt: new Date(dateStr).toISOString(),
          mediaUrls: [],
          platformOverrides: {}
        });
        importedCount++;
      }

      toast.success(`Imported ${importedCount} posts to calendar database!`);
      setShowCsvModal(false);
      setCsvContentText("");
    } catch (err) {
      toast.error("Invalid CSV formatting. Please review instructions.");
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram": return <Instagram className="h-3 w-3 text-[var(--color-instagram)]" />;
      case "twitter": return <Twitter className="h-3 w-3 text-white" />;
      case "linkedin": return <Linkedin className="h-3 w-3 text-[var(--color-linkedin)]" />;
      case "facebook": return <Facebook className="h-3 w-3 text-[var(--color-facebook)]" />;
      default: return null;
    }
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate || !selectedPost) return;

    const scheduledAt = new Date(rescheduleDate).toISOString();
    if (serverWorkspaceId) {
      scheduleMutation.mutate(
        { workspaceId: serverWorkspaceId, id: selectedPost.id, scheduledAt },
        {
          onSuccess: () => {
            toast.success("Post rescheduled successfully!");
            void calendarQuery.refetch();
            setSelectedPost(null);
            setRescheduleDate("");
          },
          onError: (error) => toast.error(error.message),
        },
      );
      return;
    }
    reschedulePost(selectedPost.id, scheduledAt);
    toast.success("Post rescheduled successfully!");
    setSelectedPost(null);
    setRescheduleDate("");
  };

  const handleDeletePost = (id: string) => {
    if (serverWorkspaceId) {
      deleteMutation.mutate(
        { workspaceId: serverWorkspaceId, id },
        {
          onSuccess: () => {
            toast.success("Post deleted successfully");
            void calendarQuery.refetch();
            setSelectedPost(null);
          },
          onError: (error) => toast.error(error.message),
        },
      );
      return;
    }
    deletePost(id);
    toast.success("Post deleted successfully");
    setSelectedPost(null);
  };

  // Filter posts based on filters
  const filteredPosts = visiblePosts.filter((post) => {
    if (platformFilter !== "all" && !post.platforms.includes(platformFilter)) return false;
    if (statusFilter !== "all" && post.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {serverWorkspaceId && calendarQuery.isLoading && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-secondary)]">
          Loading calendar...
        </div>
      )}
      {serverWorkspaceId && calendarQuery.isError && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
          We could not load this workspace calendar. Please try again.
        </div>
      )}
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Organize, monitor, and reschedule scheduled content campaigns.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2.5 flex-wrap">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-text-secondary)] font-medium outline-none"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="facebook">Facebook</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-text-secondary)] font-medium outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <button
            onClick={() => setShowCsvModal(true)}
            className="px-3.5 py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-semibold rounded-[var(--radius-md)] hover:opacity-90 active:scale-95"
          >
            Bulk CSV Upload
          </button>
        </div>
      </div>

      {/* Calendar Grid Controller */}
      <div className="glass rounded-[var(--radius-lg)] p-5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold tracking-tight">{format(currentMonth, "MMMM yyyy")}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Pad front empty days of startOfMonth */}
          {Array.from({ length: monthStart.getDay() }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square p-2 rounded bg-[var(--color-surface)]/20 border border-[var(--color-border)]/20 opacity-30" />
          ))}

          {/* Days */}
          {days.map((day) => {
            const dayPosts = filteredPosts.filter((post) => {
              if (!post.scheduledAt) return false;
              return isSameDay(new Date(post.scheduledAt), day);
            });

            return (
              <div
                key={day.toISOString()}
                className="aspect-square p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-all flex flex-col justify-between group cursor-pointer relative"
                onClick={() => {
                  if (dayPosts.length > 0) {
                    setSelectedPost(dayPosts[0]);
                  } else {
                    toast.info(`Click "Create Post" in header to draft for ${format(day, "MMM d")}`);
                  }
                }}
              >
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{format(day, "d")}</span>
                
                {/* Posts stack */}
                <div className="space-y-1 mt-2 overflow-hidden">
                  {dayPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`text-xs font-bold p-1 rounded flex items-center gap-1 leading-none truncate ${
                        post.status === "published"
                          ? "bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20"
                          : "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)] border border-[var(--color-primary)]/20"
                      }`}
                    >
                      <div className="flex gap-0.5 shrink-0">
                        {post.platforms.map((p) => getPlatformIcon(p))}
                      </div>
                      <span className="truncate">{post.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post Detail Drawer / Modal Overlay */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[480px] glass rounded-[var(--radius-xl)] p-6 relative">
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold">Post Details</h3>
            
            {/* Meta */}
            <div className="flex flex-wrap gap-2.5 mt-3">
              {selectedPost.platforms.map((p: string) => (
                <span key={p} className="px-2 py-0.5 rounded-full bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 capitalize text-[var(--color-text-secondary)]">
                  {getPlatformIcon(p)}
                  {p}
                </span>
              ))}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${selectedPost.status === "published" ? "bg-[var(--color-success)]/20 text-[var(--color-success)]" : "bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]"}`}>
                {selectedPost.status}
              </span>
            </div>

            {/* Content box */}
            <p className="mt-4 p-4 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
              {selectedPost.content}
            </p>

            {/* Reschedule forms */}
            {selectedPost.status === "scheduled" && (
              <form onSubmit={handleRescheduleSubmit} className="mt-6 pt-4 border-t border-[var(--color-border)] space-y-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Reschedule Date & Time</span>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] outline-none rounded"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-semibold rounded hover:opacity-90 active:scale-95"
                  >
                    Reschedule
                  </button>
                </div>
              </form>
            )}

            {/* Actions */}
            <div className="mt-6 flex justify-between gap-3 pt-4 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => handleDeletePost(selectedPost.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-error)] hover:opacity-85"
              >
                <Trash2 className="h-4 w-4" />
                Delete Post
              </button>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] rounded text-xs font-semibold text-[var(--color-text-secondary)]"
              >
                Close details
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Bulk CSV Schedule Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[480px] glass rounded-[var(--radius-xl)] p-6 relative">
            <button
              onClick={() => setShowCsvModal(false)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold flex items-center gap-1.5 mb-2">
              <Layers className="h-4.5 w-4.5 text-[var(--color-primary-light)]" />
              Bulk CSV Scheduler
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Enter one post per line using vertical bars (<code className="font-mono">|</code>) to split parameters.
            </p>

            {/* CSV helper instructions */}
            <div className="p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] mb-4 text-xs space-y-1.5">
              <span className="block font-bold text-[var(--color-text-secondary)]">CSV Column Layout:</span>
              <code className="block font-mono text-[var(--color-text-muted)] bg-[var(--color-background)] p-1.5 rounded truncate">
                Content text | channels (comma separated) | optional schedule datetime
              </code>
              <span className="block font-semibold text-[var(--color-text-secondary)]">Template Example:</span>
              <code className="block font-mono text-[var(--color-text-muted)] bg-[var(--color-background)] p-1.5 rounded truncate">
                Launch day is here! | instagram,twitter | 2026-07-20T10:00:00Z
              </code>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Raw CSV Data</label>
                <textarea
                  rows={5}
                  value={csvContentText}
                  onChange={(e) => {
                    setCsvContentText(e.target.value);
                    const count = e.target.value.split("\n").filter((l) => l.trim() !== "").length;
                    setParsedPostCount(count);
                  }}
                  placeholder="Drafting brand guidelines | linkedin,twitter&#10;Exploring new features | twitter"
                  className="w-full p-3 text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-muted)] resize-none font-mono"
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--color-text-muted)]">Detected <span className="font-bold text-[var(--color-text-secondary)]">{parsedPostCount}</span> campaigns lines</span>
                <button
                  type="button"
                  onClick={() => handleCsvImport()}
                  className="px-4 py-2.5 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-semibold rounded-[var(--radius-md)] hover:opacity-90 active:scale-95"
                >
                  Import Campaigns
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
