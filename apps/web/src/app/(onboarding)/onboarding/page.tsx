"use client";

import { useState } from "react";
import { useAuthStore, useSocialAccountStore, useCalendarStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Building2, 
  Link2, 
  PenSquare, 
  Calendar, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Zap,
  Globe
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { label: "Workspace", icon: Building2 },
  { label: "Socials", icon: Link2 },
  { label: "Create Post", icon: PenSquare },
  { label: "Schedule", icon: Calendar },
  { label: "Confirm", icon: CheckCircle }
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const createWorkspace = useAuthStore((state) => state.createWorkspace);
  const setOnboardingStep = useAuthStore((state) => state.setOnboardingStep);
  const connectAccount = useSocialAccountStore((state) => state.connectAccount);
  const addPost = useCalendarStore((state) => state.addPost);

  const [currentStep, setCurrentStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "creator" | "pro" | "agency">("creator");
  const [connectedList, setConnectedList] = useState<string[]>([]);
  const [postContent, setPostContent] = useState("");
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "best" | "custom">("best");
  const [customDate, setCustomDate] = useState("");

  const handleNext = () => {
    if (currentStep === 1) {
      if (!workspaceName.trim()) {
        toast.error("Please enter a workspace name");
        return;
      }
      createWorkspace(workspaceName);
      toast.success(`Workspace "${workspaceName}" created!`);
    } else if (currentStep === 2) {
      if (connectedList.length === 0) {
        toast.error("Please connect at least one account to proceed");
        return;
      }
    } else if (currentStep === 3) {
      if (!postContent.trim()) {
        toast.error("Please write some content for your first post");
        return;
      }
      if (targetPlatforms.length === 0) {
        toast.error("Please select at least one platform");
        return;
      }
    } else if (currentStep === 4) {
      if (scheduleMode === "custom" && !customDate) {
        toast.error("Please pick a schedule date and time");
        return;
      }
    } else if (currentStep === 5) {
      // Finalize post creation
      const scheduledTime = 
        scheduleMode === "now" 
          ? null 
          : scheduleMode === "best" 
            ? new Date(Date.now() + 86400000).toISOString() 
            : new Date(customDate).toISOString();

      addPost({
        content: postContent,
        platforms: targetPlatforms,
        status: scheduleMode === "now" ? "published" : "scheduled",
        scheduledAt: scheduledTime,
        mediaUrls: [],
        platformOverrides: {}
      });

      setOnboardingStep(0); // Mark complete
      toast.success("Welcome aboard! Your first post has been scheduled.");
      router.push("/dashboard");
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Simulate Social Connect
  const handleConnect = (platform: string) => {
    if (connectedList.includes(platform)) {
      toast.info(`Already connected to ${platform}`);
      return;
    }
    connectAccount(platform, `@${user?.name.toLowerCase().replace(/\s+/g, "") || "user"}`);
    setConnectedList((prev) => [...prev, platform]);
    setTargetPlatforms((prev) => [...prev, platform]);
    toast.success(`Connected to ${platform} successfully!`);
  };

  // AI Assistant caption help
  const handleAiAssist = () => {
    setPostContent("🚀 Kickstarting our journey with Orbit today! Designing, scheduling, and mastering social reach all from a single premium, dark-mode workspace. Looking forward to connecting with everyone here! 🌌 #launch #marketing #tech");
    toast.success("AI Caption suggested!");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--color-background)] px-4 py-8">
      {/* Background decoration */}
      <div className="absolute top-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[var(--color-primary)]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[var(--color-accent)]/10 blur-[100px] pointer-events-none" />

      {/* Onboarding Box */}
      <div className="w-full max-w-[640px] glass rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-8 sm:p-10 relative z-10">
        
        {/* Progress Tracker */}
        <div className="flex justify-between items-center mb-8 relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[var(--color-border)] -z-10 transform -translate-y-1/2" />
          {STEPS.map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep >= stepNum;
            const isCurrent = currentStep === stepNum;
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 bg-[var(--color-surface)] px-2">
                <div 
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all border ${
                    isActive 
                      ? "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] border-transparent text-white shadow-[var(--shadow-glow)]" 
                      : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                  } ${isCurrent ? "scale-110 ring-2 ring-[var(--color-primary)]/40" : ""}`}
                >
                  <step.icon className="h-4 w-4" />
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider hidden sm:block ${isActive ? "text-[var(--color-primary-light)]" : "text-[var(--color-text-muted)]"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Contents */}

        {/* Step 1: Create Workspace */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold tracking-tight text-[var(--color-text)]">Create your workspace</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Workspaces keep your social accounts, drafts, and campaigns organized by brand or client.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Branding Agency"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Plan Tier</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("free")}
                    className={`p-4 rounded-[var(--radius-md)] border text-left transition-all ${
                      selectedPlan === "free" 
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" 
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <div className="font-semibold text-sm">Free</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">3 channels • 20 AI credits</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("creator")}
                    className={`p-4 rounded-[var(--radius-md)] border text-left transition-all ${
                      selectedPlan === "creator" 
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" 
                        : "border(--color-border) hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <div className="font-semibold text-sm flex items-center justify-between">
                      Creator 
                      <span className="text-[10px] uppercase font-bold tracking-wide bg-[var(--color-success)]/20 text-[var(--color-success)] px-1.5 py-0.5 rounded">Popular</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">10 channels • 200 AI credits</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Connect Social Accounts */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold tracking-tight text-[var(--color-text)]">Link your social profiles</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Connect your brand accounts so you can publish directly from the workspace.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleConnect("instagram")}
                className={`flex items-center gap-3 p-4 rounded-[var(--radius-md)] border transition-all ${
                  connectedList.includes("instagram") 
                    ? "border-[var(--color-instagram)] bg-[var(--color-instagram)]/5" 
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-[var(--color-instagram)]/10 text-[var(--color-instagram)] flex items-center justify-center shrink-0">
                  <Instagram className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">Instagram</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {connectedList.includes("instagram") ? "Connected" : "Connect page"}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleConnect("twitter")}
                className={`flex items-center gap-3 p-4 rounded-[var(--radius-md)] border transition-all ${
                  connectedList.includes("twitter") 
                    ? "border-[var(--color-text)] bg-white/5" 
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">
                  <Twitter className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">Twitter / X</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {connectedList.includes("twitter") ? "Connected" : "Connect profile"}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleConnect("linkedin")}
                className={`flex items-center gap-3 p-4 rounded-[var(--radius-md)] border transition-all ${
                  connectedList.includes("linkedin") 
                    ? "border-[var(--color-linkedin)] bg-[var(--color-linkedin)]/5" 
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-[var(--color-linkedin)]/10 text-[var(--color-linkedin)] flex items-center justify-center shrink-0">
                  <Linkedin className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">LinkedIn</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {connectedList.includes("linkedin") ? "Connected" : "Connect company"}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleConnect("facebook")}
                className={`flex items-center gap-3 p-4 rounded-[var(--radius-md)] border transition-all ${
                  connectedList.includes("facebook") 
                    ? "border-[var(--color-facebook)] bg-[var(--color-facebook)]/5" 
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-[var(--color-facebook)]/10 text-[var(--color-facebook)] flex items-center justify-center shrink-0">
                  <Facebook className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">Facebook</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {connectedList.includes("facebook") ? "Connected" : "Connect page"}
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Create First Post */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold tracking-tight text-[var(--color-text)]">Draft your first post</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Let's create some content. You can try our AI suggestion widget.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Target Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {connectedList.map((platform) => {
                    const isSelected = targetPlatforms.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => {
                          setTargetPlatforms(prev => 
                            isSelected ? prev.filter(p => p !== platform) : [...prev, platform]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                          isSelected 
                            ? "bg-[var(--color-primary)] border-transparent text-white"
                            : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                        }`}
                      >
                        {platform === "instagram" && <Instagram className="h-3 w-3" />}
                        {platform === "twitter" && <Twitter className="h-3 w-3" />}
                        {platform === "linkedin" && <Linkedin className="h-3 w-3" />}
                        {platform === "facebook" && <Facebook className="h-3 w-3" />}
                        {platform}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Post Content</label>
                  <button
                    type="button"
                    onClick={handleAiAssist}
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-light)] hover:opacity-85"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Auto-Suggest
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="What would you like to share?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
                />
                <div className="text-right text-xs text-[var(--color-text-muted)]">
                  {postContent.length} characters
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Schedule */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold tracking-tight text-[var(--color-text)]">Set publishing schedule</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Decide when your post should go live. We highly recommend using AI Best Time.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setScheduleMode("best")}
                  className={`flex items-start gap-4 p-4 rounded-[var(--radius-md)] border text-left transition-all ${
                    scheduleMode === "best"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  <Zap className="h-5 w-5 text-[var(--color-success)] shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <div className="font-semibold text-sm">Schedule at AI Best Time (Recommended)</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">AI analyzes historical engagement to post exactly when your followers are active.</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleMode("custom")}
                  className={`flex items-start gap-4 p-4 rounded-[var(--radius-md)] border text-left transition-all ${
                    scheduleMode === "custom"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  <Calendar className="h-5 w-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                  <div className="w-full">
                    <div className="font-semibold text-sm">Pick a custom date & time</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">Specify a targeted release time of your choice.</div>
                    {scheduleMode === "custom" && (
                      <input
                        type="datetime-local"
                        required
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="mt-3 w-full px-3 py-2 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] outline-none"
                      />
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleMode("now")}
                  className={`flex items-start gap-4 p-4 rounded-[var(--radius-md)] border text-left transition-all ${
                    scheduleMode === "now"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  <Globe className="h-5 w-5 text-[var(--color-accent)] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm">Publish immediately</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">Instantly dispatch your updates onto all target social feeds.</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Confirm */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold tracking-tight text-[var(--color-text)]">Review your campaign</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">Look over your setup before finalizing. Ready to launch?</p>
            </div>

            <div className="glass rounded-[var(--radius-md)] p-5 space-y-4">
              <div className="flex justify-between text-sm border-b border-[var(--color-border)] pb-3">
                <span className="text-[var(--color-text-muted)] font-medium">Workspace</span>
                <span className="text-[var(--color-text)] font-semibold">{workspaceName}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-[var(--color-border)] pb-3">
                <span className="text-[var(--color-text-muted)] font-medium">Platforms</span>
                <span className="text-[var(--color-text)] font-semibold capitalize">{targetPlatforms.join(", ")}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-[var(--color-border)] pb-3">
                <span className="text-[var(--color-text-muted)] font-medium">Publishing Schedule</span>
                <span className="text-[var(--color-text)] font-semibold capitalize">
                  {scheduleMode === "now" && "Publish immediately"}
                  {scheduleMode === "best" && "AI Best Time (Tomorrow)"}
                  {scheduleMode === "custom" && customDate ? new Date(customDate).toLocaleString() : ""}
                </span>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Content Preview</span>
                <p className="text-sm p-4 rounded bg-[var(--color-background)] border border-[var(--color-border)] italic text-[var(--color-text)]">
                  {postContent}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-8 flex justify-between gap-4">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white text-sm font-semibold py-2.5 px-5 rounded-[var(--radius-md)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-opacity active:scale-[0.98] transition-transform"
          >
            {currentStep === 5 ? "Complete Setup" : "Next Step"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
