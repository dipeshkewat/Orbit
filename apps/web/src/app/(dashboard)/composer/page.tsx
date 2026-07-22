"use client";

import { useState, useEffect } from "react";
import { useComposerStore, useCalendarStore, useSocialAccountStore, useAuthStore } from "@/lib/store";
import {
  Sparkles,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  UploadCloud,
  X,
  Calendar as CalendarIcon,
  Zap,
  Globe,
  Clock,
  MessageSquare,
  Bookmark,
  Share2,
  Heart,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TONAL_OPTIONS = ["Professional", "Casual", "Friendly", "Humorous", "Creative", "Bold", "Educational"];

const PLATFORM_LIMITS: Record<string, number> = {
  instagram: 2200,
  twitter: 280,
  linkedin: 3000,
  facebook: 5000
};

export default function ComposerPage() {
  const router = useRouter();
  const accounts = useSocialAccountStore((state) => state.accounts);
  const addPost = useCalendarStore((state) => state.addPost);
  const user = useAuthStore((state) => state.user);

  // Zustand Composer State
  const {
    content,
    selectedPlatforms,
    mediaFiles,
    scheduledAt,
    overrides,
    setContent,
    togglePlatform,
    addMediaFile,
    updateMediaProgress,
    removeMediaFile,
    setScheduledAt,
    updateOverride,
    resetComposer
  } = useComposerStore();

  // Local Composer UI States
  const [activePlatformTab, setActivePlatformTab] = useState<string>("general");
  const [selectedTone, setSelectedTone] = useState<string>("Professional");
  const [aiTopic, setAiTopic] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"now" | "best" | "custom">("best");
  const [customDateTime, setCustomDateTime] = useState("");
  const [showImageGenModal, setShowImageGenModal] = useState(false);
  const [imageGenPrompt, setImageGenPrompt] = useState("");
  const [imageGenSize, setImageGenSize] = useState<"512" | "1024">("512");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Preview tab selection
  const [previewPlatform, setPreviewPlatform] = useState<string>("instagram");
  const [showInstaGrid, setShowInstaGrid] = useState(false);

  // Sync preview selection with selected platforms
  useEffect(() => {
    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(previewPlatform)) {
      setPreviewPlatform(selectedPlatforms[0]);
    }
  }, [selectedPlatforms, previewPlatform]);

  // Handle Mock Media Upload
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = Math.random().toString(36).substr(2, 9);
      const url = URL.createObjectURL(file);

      addMediaFile({ id, url, progress: 0, name: file.name });

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        updateMediaProgress(id, progress);
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 300);
    }
    toast.success("Media file(s) added successfully");
  };

  // AI Caption Suggestion stream simulation
  const handleGenerateAiCaption = () => {
    if (!aiTopic.trim()) {
      toast.error("Please enter a topic or keyword for the AI");
      return;
    }

    setIsAiGenerating(true);
    setContent(""); // clear old content
    let fullText = `🌌 Discovering new frontiers with Orbit! 🚀

We're building the future of social automation, branding feeds, and scheduling campaigns directly from our premium, dark-mode workspace. 

💡 Tone applied: ${selectedTone}
🔑 Key keyword: ${aiTopic}

Let us know what platforms you want to build on! 👇 #socialmedia #marketing #tech`;

    let currentLength = 0;
    const interval = setInterval(() => {
      setContent(fullText.slice(0, currentLength + 3));
      currentLength += 3;
      if (currentLength >= fullText.length) {
        clearInterval(interval);
        setIsAiGenerating(false);
        toast.success("AI Caption generated!");
      }
    }, 15);
  };

  const handleAiImageGenerate = () => {
    if (!imageGenPrompt.trim()) {
      toast.error("Please enter an image prompt");
      return;
    }
    const cost = imageGenSize === "512" ? 10 : 20;
    const success = useAuthStore.getState().deductCredits(cost);
    if (!success) {
      toast.error("Insufficient AI credits for this resolution");
      return;
    }

    setIsGeneratingImage(true);
    setTimeout(() => {
      const mockImgUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=${imageGenSize}&q=80&sig=${Math.floor(Math.random() * 1000)}`;
      addMediaFile({
        id: Math.random().toString(36).substr(2, 9),
        url: mockImgUrl,
        progress: 100,
        name: "Flux-Generated-Image.png"
      });
      setIsGeneratingImage(false);
      setShowImageGenModal(false);
      setImageGenPrompt("");
      toast.success(`Flux AI Image attached to post! (-${cost} credits)`);
    }, 1500);
  };

  // Schedule / Publish Action
  const handlePublishOrSchedule = () => {
    if (!content.trim()) {
      toast.error("Please enter post content");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one target platform");
      return;
    }

    // Check character limits
    for (const platform of selectedPlatforms) {
      const text = overrides[platform]?.content || content;
      const limit = PLATFORM_LIMITS[platform] || 2200;
      if (text.length > limit) {
        toast.error(`Content exceeds character limit for ${platform} (${text.length}/${limit} chars)`);
        return;
      }
    }

    // Verify scheduled time
    let scheduledTime = null;
    if (scheduleMode === "best") {
      scheduledTime = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
    } else if (scheduleMode === "custom") {
      if (!customDateTime) {
        toast.error("Please select a date and time for publishing");
        return;
      }
      scheduledTime = new Date(customDateTime).toISOString();
    }

    addPost({
      content,
      platforms: selectedPlatforms,
      status: scheduleMode === "now" ? "published" : "scheduled",
      scheduledAt: scheduledTime,
      mediaUrls: mediaFiles.map((m) => m.url),
      platformOverrides: overrides
    });

    toast.success(
      scheduleMode === "now" 
        ? "Post published successfully!" 
        : "Post scheduled successfully!"
    );

    resetComposer();
    router.push("/calendar");
  };

  // Appending hashtags helper
  const handleAddHashtag = (tag: string) => {
    setContent(content + (content.endsWith(" ") || content === "" ? "" : " ") + tag);
  };

  // Get active text (either General or Override)
  const getActiveText = (platform: string) => {
    if (platform === "general") return content;
    return overrides[platform]?.content ?? content;
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram": return "text-[var(--color-instagram)]";
      case "twitter": return "text-white";
      case "linkedin": return "text-[var(--color-linkedin)]";
      case "facebook": return "text-[var(--color-facebook)]";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Composer</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Draft, customize, and optimize posts across your social channels.
        </p>
      </div>

      {/* Main Composer Columns */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Side: Editor, Uploads, Overrides */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Platform Selector Box */}
          <div className="glass rounded-[var(--radius-lg)] p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Publish To</h3>
            <div className="flex gap-3 flex-wrap">
              {accounts.map((acc) => {
                const isSelected = selectedPlatforms.includes(acc.platform);
                return (
                  <button
                    key={acc.id}
                    onClick={() => togglePlatform(acc.platform)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] border transition-all text-xs font-semibold uppercase tracking-wider ${
                      isSelected 
                        ? "bg-[var(--color-primary)] border-transparent text-white shadow-[var(--shadow-glow)]" 
                        : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {acc.platform === "instagram" && <Instagram className="h-4 w-4" />}
                    {acc.platform === "twitter" && <Twitter className="h-4 w-4" />}
                    {acc.platform === "linkedin" && <Linkedin className="h-4 w-4" />}
                    {acc.platform === "facebook" && <Facebook className="h-4 w-4" />}
                    {acc.displayName}
                  </button>
                );
              })}
              {accounts.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  No channels connected yet. Go to <Link href="/settings/accounts" className="text-[var(--color-primary-light)] hover:underline">Settings</Link> to connect one.
                </p>
              )}
            </div>
          </div>

          {/* Core Composer Box */}
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            
            {/* Tabs for General & Overrides */}
            <div className="flex gap-2 border-b border-[var(--color-border)] pb-3 overflow-x-auto">
              <button
                onClick={() => setActivePlatformTab("general")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                  activePlatformTab === "general"
                    ? "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                General Text
              </button>
              {selectedPlatforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePlatformTab(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all capitalize ${
                    activePlatformTab === p
                      ? "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  }`}
                >
                  {p === "instagram" && <Instagram className="h-3 w-3" />}
                  {p === "twitter" && <Twitter className="h-3 w-3" />}
                  {p === "linkedin" && <Linkedin className="h-3 w-3" />}
                  {p === "facebook" && <Facebook className="h-3 w-3" />}
                  {p} Override
                </button>
              ))}
            </div>

            {/* Textarea Editor */}
            <div className="relative">
              {activePlatformTab === "general" ? (
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your general post content here..."
                  className="w-full p-4 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-muted)] resize-none"
                />
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    value={overrides[activePlatformTab]?.content ?? content}
                    onChange={(e) => updateOverride(activePlatformTab, e.target.value)}
                    placeholder={`Write custom content for ${activePlatformTab}...`}
                    className="w-full p-4 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-muted)] resize-none"
                  />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--color-text-muted)]">Customizing override for <span className="capitalize font-semibold text-[var(--color-text-secondary)]">{activePlatformTab}</span></span>
                    <button
                      onClick={() => updateOverride(activePlatformTab, content)}
                      className="text-[var(--color-primary-light)] font-medium hover:underline"
                    >
                      Reset to General Text
                    </button>
                  </div>
                </div>
              )}

              {/* Character Limit Counters for selected platforms */}
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                {selectedPlatforms.map((p) => {
                  const text = getActiveText(p);
                  const limit = PLATFORM_LIMITS[p] || 2200;
                  const isOver = text.length > limit;
                  return (
                    <span
                      key={p}
                      className={`font-semibold capitalize px-2 py-0.5 rounded border ${
                        isOver 
                          ? "bg-[var(--color-error)]/10 border-[var(--color-error)] text-[var(--color-error)]" 
                          : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                      }`}
                    >
                      {p}: {text.length}/{limit}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Media Uploader Box */}
            <div className="space-y-3">
              <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Attachments</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Previews */}
                {mediaFiles.map((media) => (
                  <div key={media.id} className="relative aspect-square rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] group">
                    <img src={media.url} alt="attachment" className="w-full h-full object-cover" />
                    
                    {media.progress < 100 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-3">
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[var(--color-primary)] h-full transition-all duration-300" style={{ width: `${media.progress}%` }} />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => removeMediaFile(media.id)}
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100 duration-150"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {/* Upload Buttons */}
                {mediaFiles.length < 4 && (
                  <>
                    <label className="aspect-square flex flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors p-3 text-center">
                      <UploadCloud className="h-5 w-5 text-[var(--color-text-muted)] mb-1" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Upload File</span>
                      <input type="file" accept="image/*" multiple onChange={handleMediaUpload} className="hidden" />
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowImageGenModal(true)}
                      className="aspect-square flex flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-colors p-3 text-center"
                    >
                      <Sparkles className="h-5 w-5 text-[var(--color-accent)] mb-1 animate-pulse" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">AI Generate</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Engine Selector Box */}
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Publishing Queue Engine</h3>
            
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setScheduleMode("best")}
                className={`flex flex-col items-center p-4 rounded-[var(--radius-md)] border text-center transition-all ${
                  scheduleMode === "best"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <Zap className="h-5 w-5 text-[var(--color-success)] mb-2 animate-pulse" />
                <span className="text-xs font-semibold">AI Best Time</span>
                <span className="text-[10px] text-[var(--color-text-muted)] mt-1">Posts when reach is highest</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleMode("custom")}
                className={`flex flex-col items-center p-4 rounded-[var(--radius-md)] border text-center transition-all ${
                  scheduleMode === "custom"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <CalendarIcon className="h-5 w-5 text-[var(--color-primary)] mb-2" />
                <span className="text-xs font-semibold">Pick Date & Time</span>
                <span className="text-[10px] text-[var(--color-text-muted)] mt-1">Specify date and hour</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleMode("now")}
                className={`flex flex-col items-center p-4 rounded-[var(--radius-md)] border text-center transition-all ${
                  scheduleMode === "now"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <Globe className="h-5 w-5 text-[var(--color-accent)] mb-2" />
                <span className="text-xs font-semibold">Publish Now</span>
                <span className="text-[10px] text-[var(--color-text-muted)] mt-1">Post immediately</span>
              </button>
            </div>

            {scheduleMode === "custom" && (
              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)] space-y-2 max-w-sm">
                <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Custom Date & Time</span>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text)] outline-none rounded"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Preview Panel & AI Assistance sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Assistance Box */}
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
              AI Assistant Studio
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Selected Tone</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TONAL_OPTIONS.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setSelectedTone(tone)}
                      className={`py-1 px-1.5 rounded border text-[10px] font-medium transition-all ${
                        selectedTone === tone
                          ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary-light)]"
                          : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Generate Caption Topic</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="E.g., new SaaS release, designs..."
                    className="flex-1 px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] outline-none rounded placeholder:text-[var(--color-text-muted)]"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAiCaption}
                    disabled={isAiGenerating}
                    className="px-3.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-semibold text-xs rounded shadow-[var(--shadow-glow)] hover:opacity-90 active:scale-95 disabled:opacity-50"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Trending Hashtags</label>
                <div className="flex flex-wrap gap-1.5">
                  {["#saas", "#tech", "#marketing", "#uiux", "#branding", "#productivity"].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddHashtag(tag)}
                      className="px-2 py-0.5 rounded bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] text-[10px] text-[var(--color-text-secondary)] font-medium"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Social Platform Feed Previews */}
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Live Feed Previews</h3>
            
            <div className="flex gap-1.5 border-b border-[var(--color-border)] pb-2 overflow-x-auto">
              {["instagram", "twitter", "linkedin", "facebook"].map((platform) => {
                const isSelected = selectedPlatforms.includes(platform);
                return (
                  <button
                    key={platform}
                    onClick={() => setPreviewPlatform(platform)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                      previewPlatform === platform
                        ? "bg-[var(--color-surface-hover)] text-[var(--color-text)]"
                        : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    <span className={isSelected ? getPlatformColor(platform) : "text-zinc-600"}>●</span>
                    {platform}
                  </button>
                );
              })}
            </div>

            {/* Instagram Grid Preview Toggle */}
            {previewPlatform === "instagram" && (
              <div className="flex justify-end pt-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowInstaGrid(!showInstaGrid)}
                  className="px-3 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] rounded text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary-light)] transition-colors"
                >
                  {showInstaGrid ? "View Post Preview" : "View Instagram Grid"}
                </button>
              </div>
            )}

            {/* Simulated Post Card Feed container */}
            {previewPlatform === "instagram" && showInstaGrid ? (
              <div className="grid grid-cols-3 gap-1 bg-[#000] border border-[var(--color-border)] p-1 rounded-[var(--radius-md)] max-w-sm mx-auto aspect-square overflow-hidden">
                {/* Slot 1: Current Draft Image */}
                <div className="relative aspect-square bg-zinc-900 border border-zinc-800/50 overflow-hidden group">
                  {mediaFiles.length > 0 ? (
                    <img src={mediaFiles[0].url} alt="draft" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[8px] text-zinc-600 font-bold uppercase tracking-wider">
                      <Instagram className="h-4 w-4 mb-1" />
                      Draft
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1 rounded">DRAFT</span>
                </div>

                {/* Slots 2-9: Mock historical posts */}
                {[
                  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80&sig=1",
                  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=200&q=80&sig=2",
                  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&q=80&sig=3",
                  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=200&q=80&sig=4",
                  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=200&q=80&sig=5",
                  "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=200&q=80&sig=6",
                  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=200&q=80&sig=7",
                  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=200&q=80&sig=8"
                ].map((url, index) => (
                  <div key={index} className="aspect-square bg-zinc-900 overflow-hidden border border-zinc-800/50">
                    <img src={url} alt="mock-post" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-[var(--radius-md)] bg-[#0b0c10] border border-[var(--color-border)] max-w-sm mx-auto overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white">D</span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">{user?.name || "User"}</span>
                    <span className="block text-[9px] text-zinc-500">
                      {previewPlatform === "instagram" && "@insta_handle"}
                      {previewPlatform === "twitter" && `@${user?.name.toLowerCase().replace(/\s+/g, "") || "user"}`}
                      {previewPlatform === "linkedin" && "Director of Marketing"}
                      {previewPlatform === "facebook" && "Digital Marketer"}
                    </span>
                  </div>
                </div>

                {/* Text Body */}
                <p className="mt-3 text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {getActiveText(previewPlatform) || <span className="text-zinc-500 italic">No content draft written yet...</span>}
                </p>

                {/* Images */}
                {mediaFiles.length > 0 && (
                  <div className="mt-3 rounded overflow-hidden bg-zinc-900 border border-zinc-800">
                    <img src={mediaFiles[0].url} alt="feed preview" className="w-full h-auto object-cover max-h-[220px]" />
                  </div>
                )}

                {/* Footer Likes / Comments Bar */}
                <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between text-zinc-500 text-[10px]">
                  {previewPlatform === "instagram" && (
                    <>
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Likes</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Comments</span>
                      <Bookmark className="h-3.5 w-3.5" />
                    </>
                  )}
                  {previewPlatform === "twitter" && (
                    <>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> 0</span>
                      <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> 0</span>
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> 0</span>
                    </>
                  )}
                  {previewPlatform === "linkedin" && (
                    <>
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Like</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Comment</span>
                      <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> Repost</span>
                    </>
                  )}
                  {previewPlatform === "facebook" && (
                    <>
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Like</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Comment</span>
                      <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> Share</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Large Action Panel */}
          <button
            onClick={handlePublishOrSchedule}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-semibold py-3.5 px-4 rounded-[var(--radius-lg)] shadow-[var(--shadow-glow)] hover:opacity-90 active:scale-98 transition-all"
          >
            {scheduleMode === "now" ? "Publish Campaign Now" : "Schedule Content Campaign"}
          </button>
        </div>
      </div>
      {/* AI Image Generation Modal */}
      {showImageGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[420px] glass rounded-[var(--radius-xl)] p-6 relative">
            <button
              onClick={() => setShowImageGenModal(false)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold flex items-center gap-1.5 mb-2">
              <Sparkles className="h-4.5 w-4.5 text-[var(--color-accent)] animate-pulse" />
              Generate AI Post Asset
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">Uses fal.ai Flux to render customized post creatives.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Creative Prompt</label>
                <textarea
                  rows={3}
                  value={imageGenPrompt}
                  onChange={(e) => setImageGenPrompt(e.target.value)}
                  placeholder="Explain what you want to render (e.g. abstract glass background)..."
                  className="w-full p-3 text-xs bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors placeholder:text-[var(--color-text-muted)] resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Resolution Size</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImageGenSize("512")}
                    className={`py-2 rounded-[var(--radius-md)] border text-xs font-semibold uppercase tracking-wider transition-all ${
                      imageGenSize === "512"
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary-light)]"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    512 x 512 (-10c)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageGenSize("1024")}
                    className={`py-2 rounded-[var(--radius-md)] border text-xs font-semibold uppercase tracking-wider transition-all ${
                      imageGenSize === "1024"
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary-light)]"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    1024 x 1024 (-20c)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAiImageGenerate}
                disabled={isGeneratingImage}
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white text-xs font-semibold py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-glow)] hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                <Zap className="h-3.5 w-3.5" />
                {isGeneratingImage ? "Rendering flux image..." : "Start Generation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
