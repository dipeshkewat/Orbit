"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import {
  Sparkles,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Copy,
  PenSquare,
  Cpu,
  Coins,
  CheckCircle,
  HelpCircle,
  Zap,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useComposerStore } from "@/lib/store";

export default function AiStudioPage() {
  const router = useRouter();
  const workspace = useAuthStore((state) => {
    const active = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
    return active || state.workspaces[0];
  });
  const deductCredits = useAuthStore((state) => state.deductCredits);
  const setComposerContent = useComposerStore((state) => state.setContent);

  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Professional");
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [hashtagInput, setHashtagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isTagsGenerating, setIsTagsGenerating] = useState(false);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleGenerateCaption = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a topic prompt");
      return;
    }

    const cost = platforms.length;
    // Try to deduct credit
    const success = deductCredits(cost);
    if (!success) {
      toast.error(`Insufficient AI credits! Used: ${workspace.aiCreditsUsed}/${workspace.aiCreditsLimit}`);
      return;
    }

    setIsGenerating(true);
    setGeneratedCaption("");

    const fullResult = `🤖 Generated Caption for target: ${platforms.join(", ")}
🎨 Selected Tone: ${tone}

"🚀 Let's transform how you schedule your social updates! With Orbit, we design your brand presence and track engagement with a beautiful dark-mode interface. Automate drafts, customize per-channel, and build consistency easily. #branding #socialmedia #productivity"`;

    let currentLen = 0;
    const timer = setInterval(() => {
      setGeneratedCaption(fullResult.slice(0, currentLen + 3));
      currentLen += 3;
      if (currentLen >= fullResult.length) {
        clearInterval(timer);
        setIsGenerating(false);
        toast.success(`Generated successfully! (-${cost} AI credits)`);
      }
    }, 15);
  };

  const handleGenerateHashtags = () => {
    if (!hashtagInput.trim()) {
      toast.error("Please enter a topic keyword");
      return;
    }

    const success = deductCredits(1);
    if (!success) {
      toast.error("Insufficient AI credits!");
      return;
    }

    setIsTagsGenerating(true);
    setSuggestedTags([]);

    setTimeout(() => {
      setSuggestedTags([
        `#${hashtagInput.toLowerCase()}`,
        `#${hashtagInput.toLowerCase()}marketing`,
        "#saasgrowth",
        "#brandingtrends",
        "#digitaldesign",
        "#contentcalendar",
        "#automationtech",
        "#mediastuff",
        "#socialscheduler",
        "#techtools"
      ]);
      setIsTagsGenerating(false);
      toast.success("Hashtag suggestions generated! (-1 AI credit)");
    }, 800);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleOpenInComposer = () => {
    if (!generatedCaption) return;
    setComposerContent(generatedCaption);
    toast.success("Opening in Content Composer...");
    router.push("/composer");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Studio</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Utilize advanced models to write captions, recommend scheduling, and suggest tags.
          </p>
        </div>

        {/* Credits Counter Card */}
        <div className="glass rounded-[var(--radius-md)] px-4 py-2 flex items-center gap-3">
          <Coins className="h-5 w-5 text-[var(--color-accent)] animate-pulse" />
          <div className="text-xs">
            <span className="block font-bold text-[var(--color-text)]">
              {workspace?.aiCreditsLimit - workspace?.aiCreditsUsed} Credits Available
            </span>
            <span className="block text-[10px] text-[var(--color-text-muted)] font-medium">
              Used: {workspace?.aiCreditsUsed} / {workspace?.aiCreditsLimit} limit
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Columns */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-5">
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-[var(--color-primary-light)]" />
              Caption Studio
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Topic or Prompt Description</label>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Explain your product release, sharing tips on design, calendar organization..."
                  className="w-full p-4 text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-muted)] resize-none"
                />
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Applied Voice Tone</label>
                <div className="flex gap-2 flex-wrap">
                  {["Professional", "Creative", "Casual", "Bold", "Humorous"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTone(item)}
                      className={`px-3 py-1.5 rounded-md border text-xs font-semibold tracking-wide transition-all ${
                        tone === item
                          ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary-light)]"
                          : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target platforms (each adds credit cost) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Target Platform Formats</label>
                  <span className="text-[10px] text-[var(--color-accent)] font-semibold">Cost: {platforms.length} credits</span>
                </div>
                <div className="flex gap-2">
                  {["instagram", "twitter", "linkedin", "facebook"].map((p) => {
                    const isSelected = platforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                          isSelected
                            ? "bg-[var(--color-primary)] border-transparent text-white shadow-[var(--shadow-glow)]"
                            : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                        }`}
                      >
                        {p === "instagram" && <Instagram className="h-3.5 w-3.5" />}
                        {p === "twitter" && <Twitter className="h-3.5 w-3.5" />}
                        {p === "linkedin" && <Linkedin className="h-3.5 w-3.5" />}
                        {p === "facebook" && <Facebook className="h-3.5 w-3.5" />}
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white text-xs font-semibold py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-glow)] hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                Generate Optimized Captions
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Output Studio */}
        <div className="lg:col-span-5 space-y-6">
          {/* Caption Output Box */}
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4 flex flex-col justify-between min-h-[300px]">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Generated Output Preview</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Edit, copy, or load directly inside composer</p>
            </div>

            <div className="flex-1 my-4">
              {generatedCaption ? (
                <div className="w-full p-4 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] whitespace-pre-wrap leading-relaxed min-h-[160px]">
                  {generatedCaption}
                </div>
              ) : (
                <div className="w-full p-4 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-center min-h-[160px]">
                  <HelpCircle className="h-8 w-8 text-[var(--color-text-muted)] mb-2" />
                  <span className="text-xs text-[var(--color-text-muted)]">Click generate to compose AI content copy.</span>
                </div>
              )}
            </div>

            {generatedCaption && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyToClipboard(generatedCaption)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text-secondary)]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Output
                </button>
                <button
                  type="button"
                  onClick={handleOpenInComposer}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white text-xs font-semibold rounded hover:opacity-90 active:scale-95 shadow-[var(--shadow-glow)]"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  Load to Composer
                </button>
              </div>
            )}
          </div>

          {/* Hashtag suggestions generator */}
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Tag Studio Suggestions</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                placeholder="Enter topic keyword (e.g. startup, design)..."
                className="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] outline-none rounded placeholder:text-[var(--color-text-muted)]"
              />
              <button
                type="button"
                onClick={handleGenerateHashtags}
                disabled={isTagsGenerating}
                className="px-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text-secondary)] rounded active:scale-95 disabled:opacity-50"
              >
                Find Tags
              </button>
            </div>

            {suggestedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleCopyToClipboard(tag)}
                    className="px-2 py-1 rounded bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] text-[10px] text-[var(--color-text-secondary)] font-semibold"
                    title="Click to copy"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-[var(--color-text-muted)]">Search a topic above to suggestions (Costs 1 credit).</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
