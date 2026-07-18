"use client";

import { useState } from "react";
import {
  Brain,
  Calendar,
  Sparkles,
  Target,
  Lightbulb,
  RefreshCw,
  Clock,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  ChevronRight,
  Plus
} from "lucide-react";
import { toast } from "sonner";

interface ContentSlot {
  id: string;
  day: string;
  time: string;
  platform: string;
  contentType: string;
  topic: string;
  hook: string;
  status: "suggested" | "approved" | "scheduled";
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const MOCK_PLAN: ContentSlot[] = [
  { id: "1", day: "Monday", time: "09:00", platform: "linkedin", contentType: "Thought Leadership", topic: "5 AI Trends Reshaping Social Media in 2026", hook: "Start with a bold statistic about AI adoption rates", status: "suggested" },
  { id: "2", day: "Monday", time: "18:00", platform: "instagram", contentType: "Carousel", topic: "Behind-the-Scenes: Our Product Design Process", hook: "Show the messy whiteboard → polished UI transformation", status: "approved" },
  { id: "3", day: "Tuesday", time: "12:00", platform: "twitter", contentType: "Thread", topic: "Why Consistency Beats Virality for Brands", hook: "Open with a controversial take: 'Viral content is overrated'", status: "suggested" },
  { id: "4", day: "Wednesday", time: "10:00", platform: "facebook", contentType: "Video", topic: "Quick Tutorial: Schedule 30 Days of Content in 10 Minutes", hook: "Start with the end result, then show the process", status: "suggested" },
  { id: "5", day: "Thursday", time: "14:00", platform: "instagram", contentType: "Reel", topic: "3 Caption Formulas That Drive Engagement", hook: "Use text overlay with before/after engagement stats", status: "scheduled" },
  { id: "6", day: "Friday", time: "09:00", platform: "linkedin", contentType: "Case Study", topic: "How Client X Grew 400% Using Our Scheduling Tools", hook: "Lead with the result, then break down the strategy", status: "suggested" },
  { id: "7", day: "Saturday", time: "11:00", platform: "twitter", contentType: "Poll", topic: "What's Your Biggest Social Media Challenge?", hook: "Give 4 relatable options with an 'Other' write-in", status: "approved" },
];

export default function AiContentPlannerPage() {
  const [plan, setPlan] = useState<ContentSlot[]>(MOCK_PLAN);
  const [selectedNiche, setSelectedNiche] = useState("SaaS / Tech");
  const [selectedGoal, setSelectedGoal] = useState("Brand Awareness");
  const [isGenerating, setIsGenerating] = useState(false);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram": return <Instagram className="h-3.5 w-3.5 text-[var(--color-instagram)]" />;
      case "twitter": return <Twitter className="h-3.5 w-3.5 text-white" />;
      case "linkedin": return <Linkedin className="h-3.5 w-3.5 text-[var(--color-linkedin)]" />;
      case "facebook": return <Facebook className="h-3.5 w-3.5 text-[var(--color-facebook)]" />;
      default: return null;
    }
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      toast.success("AI Content Plan regenerated for the week!");
    }, 1500);
  };

  const handleApproveSlot = (id: string) => {
    setPlan((prev) => prev.map((s) => s.id === id ? { ...s, status: "approved" } : s));
    toast.success("Content slot approved!");
  };

  const handleScheduleSlot = (id: string) => {
    setPlan((prev) => prev.map((s) => s.id === id ? { ...s, status: "scheduled" } : s));
    toast.success("Slot scheduled to calendar!");
  };

  const statusStyles = {
    suggested: "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/30",
    approved: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/30",
    scheduled: "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)] border-[var(--color-primary)]/30"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-[var(--color-accent)]" />
            AI Content Planner
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Auto-generate a week of strategic content ideas tailored to your brand.
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white text-xs font-semibold rounded-[var(--radius-md)] hover:opacity-90 active:scale-95 shadow-[var(--shadow-glow)] shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "Generating..." : "Regenerate Week"}
        </button>
      </div>

      {/* Strategy Config Bar */}
      <div className="glass rounded-[var(--radius-lg)] p-5 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
            <Target className="h-3 w-3" /> Industry Niche
          </label>
          <select
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-text)] font-medium outline-none"
          >
            <option>SaaS / Tech</option>
            <option>E-Commerce</option>
            <option>Personal Brand</option>
            <option>Agency</option>
            <option>Healthcare</option>
            <option>Education</option>
          </select>
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
            <Lightbulb className="h-3 w-3" /> Primary Goal
          </label>
          <select
            value={selectedGoal}
            onChange={(e) => setSelectedGoal(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-text)] font-medium outline-none"
          >
            <option>Brand Awareness</option>
            <option>Lead Generation</option>
            <option>Community Building</option>
            <option>Product Launch</option>
            <option>Thought Leadership</option>
          </select>
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Plan Period
          </label>
          <div className="px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-text)] font-medium">
            This Week (Jul 14 – Jul 20, 2026)
          </div>
        </div>
      </div>

      {/* Weekly Plan Grid */}
      <div className="space-y-3">
        {WEEKDAYS.map((day) => {
          const daySlots = plan.filter((s) => s.day === day);
          if (daySlots.length === 0) return null;

          return (
            <div key={day} className="glass rounded-[var(--radius-lg)] overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">{day}</h3>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {daySlots.map((slot) => (
                  <div key={slot.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Time + Platform */}
                    <div className="flex items-center gap-3 shrink-0 w-[140px]">
                      <Clock className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                      <span className="text-xs font-mono text-[var(--color-text-muted)]">{slot.time}</span>
                      <span className="flex items-center gap-1">
                        {getPlatformIcon(slot.platform)}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                          {slot.contentType}
                        </span>
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${statusStyles[slot.status]}`}>
                          {slot.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[var(--color-text)] truncate">{slot.topic}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-[var(--color-accent)] shrink-0" />
                        {slot.hook}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      {slot.status === "suggested" && (
                        <button
                          onClick={() => handleApproveSlot(slot.id)}
                          className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-success)] bg-[var(--color-success)]/5 text-[var(--color-success)] text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--color-success)]/10 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {(slot.status === "suggested" || slot.status === "approved") && (
                        <button
                          onClick={() => handleScheduleSlot(slot.id)}
                          className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary-light)] text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--color-primary)]/10 transition-colors"
                        >
                          Schedule
                        </button>
                      )}
                      {slot.status === "scheduled" && (
                        <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                          ✓ In Calendar
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
