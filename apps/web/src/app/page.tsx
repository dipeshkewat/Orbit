"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Instagram,
  Linkedin,
  Facebook,
  Twitter,
  Youtube,
  Send,
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  CheckCircle,
  Plus,
  Clock,
  Layers,
  Check,
  ChevronRight,
  ChevronDown,
  Quote,
  Shield,
  Zap,
  MessageSquare,
  FileText,
  BarChart3,
  Globe,
  Share2,
  Lock,
  Workflow,
  Sparkle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store";
import { OrbitLogo } from "@/components/logo";

// --- ANIMATION CONFIGS ---
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// --- MOCK DATA ---
const TRUSTED_LOGOS = [
  { name: "Vercel", icon: Sparkle },
  { name: "Linear", icon: Zap },
  { name: "Framer", icon: Layers },
  { name: "Supabase", icon: Shield },
  { name: "Postiz", icon: Share2 },
  { name: "Notion", icon: FileText }
];

const PLATFORMS = [
  { name: "Instagram", icon: Instagram, color: "#e1306c", tag: "instagram" },
  { name: "LinkedIn", icon: Linkedin, color: "#0077b5", tag: "linkedin" },
  { name: "Facebook", icon: Facebook, color: "#1877f2", tag: "facebook" },
  { name: "X (Twitter)", icon: Twitter, color: "#ffffff", tag: "twitter" },
  { name: "YouTube", icon: Youtube, color: "#ff0000", tag: "youtube" },
  { name: "Threads", icon: Globe, color: "#ffffff", tag: "threads" },
  { name: "TikTok", icon: Zap, color: "#ff0050", tag: "tiktok" },
  { name: "Pinterest", icon: Shield, color: "#bd081c", tag: "pinterest" },
  { name: "Reddit", icon: MessageSquare, color: "#ff4500", tag: "reddit" },
  { name: "Discord", icon: Users, color: "#5865f2", tag: "discord" },
  { name: "Telegram", icon: Send, color: "#0088cc", tag: "telegram" },
  { name: "Bluesky", icon: Globe, color: "#0560ff", tag: "bluesky" },
  { name: "Snapchat", icon: Sparkles, color: "#fffc00", tag: "snapchat" },
  { name: "Google Business", icon: MapPinIcon, color: "#4285f4", tag: "google" },
  { name: "WordPress", icon: FileText, color: "#21759b", tag: "wordpress" },
  { name: "Medium", icon: FileText, color: "#ffffff", tag: "medium" }
];

// Helper fallback map icon
function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

const WHY_CARDS = [
  {
    title: "AI Content Creation",
    description: "Generate highly engaging, platform-specific copy, custom hashtags, and post ideas tailored to your brand voice in seconds.",
    icon: Sparkles,
    glow: "rgba(139, 92, 246, 0.15)"
  },
  {
    title: "One-Click Publishing",
    description: "Design once, customize per platform, and publish everywhere. Reach your audience on 15+ channels simultaneously.",
    icon: Send,
    glow: "rgba(99, 102, 241, 0.15)"
  },
  {
    title: "Growth Analytics",
    description: "Track performance across all platforms with consolidated reports. Uncover smart recommendations to boost your reach and engagement.",
    icon: TrendingUp,
    glow: "rgba(236, 72, 153, 0.15)"
  }
];

const FEATURES_EXPLORER = [
  {
    id: "ai-caption",
    title: "AI Caption Generator",
    description: "Craft perfect posts matching your exact tone and brand voice. Optimized for formatting rules of each platform.",
    category: "AI & Creation",
    details: {
      metrics: { wordCount: "120 words", qualityScore: "98%", platforms: "5 optimized" },
      previewText: "🚀 Introducing Orbit: The operating system for social growth. Powered by Gemini AI. Custom-crafted for founders & builders."
    }
  },
  {
    id: "smart-sched",
    title: "Smart Scheduling",
    description: "Queue content days in advance. Automatically publish at times of maximum user engagement, optimized per platform.",
    category: "Automation",
    details: {
      metrics: { queueHealth: "Excellent", autoReschedule: "Active", bufferTime: "12h interval" },
      previewText: "Auto-scheduler active: LinkedIn queue configured for Tuesday 09:15 AM EST (Peak Engagement Window)."
    }
  },
  {
    id: "calendar",
    title: "Visual Content Calendar",
    description: "Drag-and-drop posts across dates. View upcoming updates for all networks in a clean, visual grid.",
    category: "Interface",
    details: {
      metrics: { calendarViews: "Month, Week, Day", dragDrop: "60 FPS", filterBy: "Platform, Tag" },
      previewText: "Visual grid sync: 14 posts scheduled for next week. Drag post #102 to Thursday to fill gap."
    }
  },
  {
    id: "collaboration",
    title: "Team Collaboration",
    description: "Invite teammates, assign specific workspaces, assign design assets, and share live drafts securely.",
    category: "Teamwork",
    details: {
      metrics: { activeMembers: "5 online", rolePermissions: "Granular", feedbackLoop: "Instantly" },
      previewText: "Designer Alex uploaded 'banner.png'. Manager Sophia added comment: 'Looks great! Approved for X.'"
    }
  },
  {
    id: "approvals",
    title: "Approval Workflow",
    description: "Set rules requiring manager sign-off before posts go live. Avoid typos, errors, and accidental leaks.",
    category: "Teamwork",
    details: {
      metrics: { pendingReview: "2 drafts", approvedToday: "5 posts", autoAlerts: "Slack & Email" },
      previewText: "Review required: Post #204 needs manager approval. Platform: Facebook & Instagram."
    }
  },
  {
    id: "analytics",
    title: "Analytics Dashboard",
    description: "Understand reach, view impression ratios, count followers, and audit CTR in real time.",
    category: "Intelligence",
    details: {
      metrics: { dataSync: "Live (5m)", reachGrowth: "+124% MoM", exportFormat: "PDF, CSV" },
      previewText: "Consolidated stats: reach reached 124.8k (+14.2% vs last week). Average CTR at 4.2%."
    }
  }
];

const AI_TABS = [
  { id: "caption", label: "Caption", prompt: "Write a launching post for Orbit", output: "🚀 Meet Orbit: The modern, AI-powered social workspace. Manage all platforms, create custom copy in one click, and track growth with gorgeous analytics. Join the waitlist today. #buildinpublic #marketing" },
  { id: "hashtags", label: "Hashtags", prompt: "Generate high-converting SaaS growth hashtags", output: "#saasmarketing #socialmediaai #growthhacking #marketingtools #solopreneur #digitalstrategy #automation #indiehackers #techstartup" },
  { id: "post-ideas", label: "Post Ideas", prompt: "Give me 3 content ideas for a developer platform", output: "1. The evolution of our CSS variables system (Dark Theme showcase) 🎨\n2. Why auto-scheduling is the ultimate developer productivity hack ⏰\n3. Behind the scenes: Node setup and API triggers 💻" },
  { id: "carousel", label: "Carousel Slides", prompt: "Outline slide deck for LinkedIn growth tips", output: "Slide 1: How we scaled to 10k users in 30 days.\nSlide 2: Rule #1 - Content Consistency (use scheduling).\nSlide 3: Rule #2 - Brand voice tuning (AI assists copy).\nSlide 4: Rule #3 - Visual calendar planning." },
  { id: "reels", label: "Reels Script", prompt: "Draft a 15-second TikTok script about Orbit", output: "[Visual: Fast panning of dark-mode dashboard]\nHook: Stop manually posting to 5 channels!\n[Visual: Single button tap publishing to Instagram, X, LinkedIn]\nValue: This AI dashboard handles schedule, copy, and analytics automatically.\nCTA: Try Orbit for free today." },
  { id: "replies", label: "Reply Helper", prompt: "Professional response to a feedback request", output: "Thanks for the suggestion! We are actually finalizing team role presets in our workspace settings next week. Stay tuned for the update! 🚀" },
  { id: "campaign", label: "Marketing Campaign", prompt: "Launch plan outline", output: "Phase 1: Brand Teasers (X & LinkedIn). Highlight visual aesthetics.\nPhase 2: Product Hunt launch (interactive dashboard live-demo).\nPhase 3: Creator affiliate push (offering free credits)." }
];

const TESTIMONIALS = [
  {
    quote: "Orbit replaced three tools for us. We now plan, write, and analyze all of our brand campaigns from one place. The aesthetic design is inspiring.",
    name: "Alex Rivera",
    role: "Head of Marketing",
    company: "Vercel Affiliate",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80"
  },
  {
    quote: "The AI Brand Voice generator is eerily good. It writes captions that sound exactly like our writing team. Auto-publishing works perfectly every time.",
    name: "Elena Rostova",
    role: "Content Director",
    company: "SaaS Labs",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80"
  },
  {
    quote: "As an agency managing 12 clients, the Multi Workspace structure saved our workflow. The approval workflow prevents any accidental posts.",
    name: "Marcus Thorne",
    role: "Founder",
    company: "Orbit Agency",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80"
  }
];

const FAQS = [
  {
    q: "How does the AI brand voice generation work?",
    a: "You provide examples of past successful posts or a company description. Orbit analyzes your vocabulary, formatting choice, and hashtag patterns to create custom AI presets that match your brand identity across all new generations."
  },
  {
    q: "What social platforms do you support?",
    a: "We support Instagram (Business/Creator), Facebook Pages, LinkedIn Profiles & Pages, X (Twitter), Threads, TikTok, YouTube, Pinterest, Reddit, Discord, Telegram, Bluesky, WordPress, Medium, and Google Business Profile."
  },
  {
    q: "Can my clients preview scheduled posts before publication?",
    a: "Yes! You can invite clients to a read-only workspace layout or share a password-protected link to view the schedule preview, calendar, and add comments without granting full dashboard edits."
  },
  {
    q: "Do you have a free plan?",
    a: "Absolutely. Our Starter Plan is 100% free and lets you link up to 3 accounts, schedule 10 posts in advance, and try out our basic AI Caption Generator with 20 monthly credits."
  }
];

// --- SUB-COMPONENTS ---

// Animated Counter component
function Counter({ value, suffix = "", duration = 1.5 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / 100), 10);
    const step = (end - start) / (totalMiliseconds / incrementTime);

    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration, isVisible]);

  return (
    <span ref={elementRef} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// Parallax effect wrapper
function MouseParallax({ children, intensity = 10 }: { children: React.ReactNode; intensity?: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 200 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const x = useTransform(springX, [-0.5, 0.5], [-intensity, intensity]);
  const y = useTransform(springY, [-0.5, 0.5], [-intensity, intensity]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const relativeX = (e.clientX - rect.left) / width - 0.5;
    const relativeY = (e.clientY - rect.top) / height - 0.5;
    mouseX.set(relativeX);
    mouseY.set(relativeY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function LandingPage() {
  const router = useRouter();
  
  // States
  const [selectedFeature, setSelectedFeature] = useState(FEATURES_EXPLORER[0].id);
  const [aiTab, setAiTab] = useState(AI_TABS[0].id);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Typewriter effect trigger for AI Assistant section
  useEffect(() => {
    const currentTab = AI_TABS.find(t => t.id === aiTab);
    if (!currentTab) return;

    setIsTyping(true);
    setTypedText("");
    let i = 0;
    const txt = currentTab.output;
    const speed = 15; // ms per char

    const timer = setInterval(() => {
      if (i < txt.length) {
        setTypedText((prev) => prev + txt.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [aiTab]);

  const activeFeatureObj = FEATURES_EXPLORER.find(f => f.id === selectedFeature) || FEATURES_EXPLORER[0];

  const handleDemoStart = () => {
    // Set sandbox cookie for mock login
    document.cookie = "sb_bypass=true; path=/; max-age=86400";
    // Sync store login
    const login = useAuthStore.getState().login;
    login("demo@orbit.com", "Demo User");
    useAuthStore.getState().setOnboardingStep(1);
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-[#090909] text-[#f5f5f7] overflow-x-hidden selection:bg-[#8b5cf6]/30 selection:text-white">
      
      {/* Background ambient glowing mesh gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#8b5cf6]/10 rounded-full blur-[150px] pointer-events-none z-0 animate-pulse" />
      <div className="absolute top-[30%] right-[-10%] w-[60%] h-[50%] bg-[#6366f1]/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] bg-[#a855f7]/5 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* --- HEADER NAVBAR --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#090909]/70 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-[var(--header-height)] flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <OrbitLogo size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white to-white/70">
              Orbit
            </span>
          </Link>

          {/* Nav links Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#a1a1aa]">
            <a href="#why" className="hover:text-white transition-colors">Features</a>
            <a href="#supported" className="hover:text-white transition-colors">Platforms</a>
            <a href="#ai-studio" className="hover:text-white transition-colors">AI Engine</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Action buttons Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold hover:text-white text-[#a1a1aa] transition-colors">
              Sign In
            </Link>
            <button 
              onClick={handleDemoStart}
              className="px-4 py-2 rounded-xl bg-white text-black hover:bg-white/90 text-sm font-semibold transition-all active:scale-[0.98] shadow-lg shadow-white/5"
            >
              Start Free
            </button>
          </div>

          {/* Mobile hamburger icon */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#a1a1aa] hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18 18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#090909] pt-[var(--header-height)] px-6 flex flex-col space-y-6 md:hidden border-b border-white/5 shadow-2xl"
          >
            <div className="flex flex-col space-y-4 pt-8 text-lg font-medium text-[#a1a1aa]">
              <a href="#why" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Features</a>
              <a href="#supported" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Platforms</a>
              <a href="#ai-studio" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">AI Engine</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors">FAQ</a>
            </div>
            
            <div className="h-px bg-white/5 w-full my-2" />

            <div className="flex flex-col gap-4">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-3 rounded-xl border border-white/10 hover:border-white/20 font-semibold text-sm transition-all text-[#f5f5f7]">
                Sign In
              </Link>
              <button 
                onClick={() => { setMobileMenuOpen(false); handleDemoStart(); }}
                className="text-center py-3 rounded-xl bg-white text-black hover:bg-white/90 font-semibold text-sm transition-all shadow-lg"
              >
                Start Free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* --- SECTION 1: HERO --- */}
      <section className="relative pt-32 md:pt-48 pb-20 md:pb-32 px-6 overflow-hidden z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading CTAs */}
          <div className="lg:col-span-6 space-y-8 text-left max-w-2xl">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="space-y-6"
            >
              {/* Badge */}
              <motion.div 
                variants={fadeUp}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#c084fc] shadow-[0_0_15px_rgba(139,92,246,0.1)]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Next-gen Social Workspace</span>
              </motion.div>

              {/* Headline */}
              <motion.h1 
                variants={fadeUp}
                className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] text-white"
              >
                Manage Every Social Platform. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c084fc] via-[#8b5cf6] to-[#6366f1]">
                  Grow Faster with AI.
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p 
                variants={fadeUp}
                className="text-lg text-[#a1a1aa] leading-relaxed"
              >
                Everything your social media team needs. Powered by AI. Connect profiles, generate captions, queue visual calendars, and publish everywhere instantly.
              </motion.p>
            </motion.div>

            {/* Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <button 
                onClick={handleDemoStart}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white font-semibold text-sm transition-all hover:opacity-95 shadow-[0_0_25px_rgba(139,92,246,0.25)] active:scale-[0.98] flex items-center gap-2 group"
              >
                Start Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button 
                onClick={handleDemoStart}
                className="px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-semibold text-sm text-[#f5f5f7] transition-all"
              >
                Book Demo
              </button>
            </motion.div>
          </div>

          {/* Right Column: Dashboard preview with parallax */}
          <div className="lg:col-span-6 relative flex justify-center w-full min-h-[480px]">
            <MouseParallax intensity={15}>
              <div className="relative w-full h-full flex items-center justify-center">
                
                {/* Back glow */}
                <div className="absolute w-[350px] h-[350px] bg-[#8b5cf6]/10 rounded-full blur-[80px] z-0 animate-pulse pointer-events-none" />

                {/* Primary Mockup Glass Card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="w-full max-w-[500px] glass rounded-2xl border border-white/10 p-5 space-y-4 shadow-2xl relative z-10"
                >
                  {/* Header mock */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-[10px] text-[#52525b] font-mono ml-2">Console // workspace_01</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#8b5cf6]/15 border border-[#8b5cf6]/20">
                      <Sparkles className="h-3 w-3 text-[#c084fc]" />
                      <span className="text-[9px] text-[#c084fc] font-bold uppercase">AI Engines Sync</span>
                    </div>
                  </div>

                  {/* Calendar Widget mock */}
                  <div className="p-3 bg-white/2 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#a1a1aa] tracking-wider flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3 text-[#8b5cf6]" />
                        Calendar Queue
                      </span>
                      <span className="text-[9px] text-[#52525b]">Tuesday, July 19</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                        <div key={i} className={`py-1.5 rounded ${i === 1 ? "bg-[#8b5cf6] text-white font-bold" : "text-[#52525b]"}`}>
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Queue Items mock */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#a1a1aa] tracking-wider block">Upcoming Post</span>
                    <div className="p-3 bg-white/2 rounded-xl border border-white/5 flex gap-3 items-center">
                      <div className="flex -space-x-1">
                        <div className="h-5 w-5 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-[8px] font-bold text-pink-400">I</div>
                        <div className="h-5 w-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[8px] font-bold text-blue-400">L</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">SaaS Architecture Reveal...</p>
                        <span className="text-[9px] text-[#52525b]">Auto-scheduled 09:15 AM</span>
                      </div>
                      <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[9px] text-green-400 font-semibold">
                        Ready
                      </div>
                    </div>
                  </div>

                  {/* AI Suggestion Bubble mock */}
                  <div className="p-3 bg-[#8b5cf6]/5 border border-[#8b5cf6]/10 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#c084fc]">
                      <Sparkles className="h-3 w-3" />
                      AI Suggestion
                    </div>
                    <p className="text-[10px] text-[#a1a1aa] leading-relaxed">
                      "Adding #buildinpublic to X increases reach by up to 24% on Tuesdays."
                    </p>
                    <button className="text-[9px] font-bold text-white hover:underline flex items-center gap-0.5">
                      Apply recommendation <ChevronRight className="h-2 w-2" />
                    </button>
                  </div>

                  {/* Analytics Summary */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                      <span className="text-[9px] font-semibold text-[#52525b] uppercase">Follower Count</span>
                      <p className="text-base font-bold text-white mt-0.5">124.8K</p>
                    </div>
                    <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                      <span className="text-[9px] font-semibold text-[#52525b] uppercase">Reach Increment</span>
                      <p className="text-base font-bold text-green-400 mt-0.5">+14.2%</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Social Media Icons */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-10 right-4 h-11 w-11 rounded-full bg-[#e1306c]/10 border border-[#e1306c]/20 flex items-center justify-center text-[#e1306c] shadow-[0_0_20px_rgba(225,48,108,0.15)] z-20"
                >
                  <Instagram className="h-5 w-5" />
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute bottom-16 -left-8 h-10 w-10 rounded-full bg-[#0077b5]/10 border border-[#0077b5]/20 flex items-center justify-center text-[#0077b5] shadow-[0_0_20px_rgba(0,119,181,0.15)] z-20"
                >
                  <Linkedin className="h-4.5 w-4.5" />
                </motion.div>

                <motion.div 
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -top-12 left-12 h-10 w-10 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-white shadow-xl z-20"
                >
                  <Twitter className="h-4.5 w-4.5" />
                </motion.div>
              </div>
            </MouseParallax>
          </div>
        </div>
      </section>


      {/* --- SECTION 2: TRUSTED BY & METRICS --- */}
      <section className="py-16 md:py-24 border-t border-white/5 bg-[#070707] relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          {/* Ticker marquee */}
          <div className="space-y-6 text-center">
            <span className="text-[10px] uppercase font-bold text-[#52525b] tracking-widest">
              Trusted by operators at world-class brands
            </span>
            
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40 hover:opacity-60 transition-opacity">
              {TRUSTED_LOGOS.map((logo, i) => {
                const IconComponent = logo.icon;
                return (
                  <div key={i} className="flex items-center gap-2 text-white font-semibold tracking-tight text-sm md:text-base">
                    <IconComponent className="h-4.5 w-4.5 text-[#a855f7]" />
                    <span>{logo.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Counters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pt-8 border-t border-white/5">
            <div className="text-center md:text-left space-y-1">
              <p className="text-2xl sm:text-4xl font-extrabold text-white">
                <Counter value={14240192} suffix="+" />
              </p>
              <p className="text-xs text-[#a1a1aa]">Posts Scheduled</p>
            </div>
            <div className="text-center md:text-left space-y-1">
              <p className="text-2xl sm:text-4xl font-extrabold text-white">
                <Counter value={242109} suffix="+" />
              </p>
              <p className="text-xs text-[#a1a1aa]">Active Users</p>
            </div>
            <div className="text-center md:text-left space-y-1">
              <p className="text-2xl sm:text-4xl font-extrabold text-white">
                <Counter value={142} />
              </p>
              <p className="text-xs text-[#a1a1aa]">Countries Reached</p>
            </div>
            <div className="text-center md:text-left space-y-1">
              <p className="text-2xl sm:text-4xl font-extrabold text-white">
                <Counter value={8421091} suffix="+" />
              </p>
              <p className="text-xs text-[#a1a1aa]">AI Generations</p>
            </div>
            <div className="text-center md:text-left col-span-2 md:col-span-1 space-y-1">
              <p className="text-2xl sm:text-4xl font-extrabold text-[#c084fc]">
                <Counter value={248} suffix="%" />
              </p>
              <p className="text-xs text-[#a1a1aa]">Engagement Growth</p>
            </div>
          </div>

        </div>
      </section>


      {/* --- SECTION 3: WHY SOCIALSPHERE --- */}
      <section id="why" className="py-24 md:py-32 px-6 max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-bold text-[#c084fc] tracking-wider">Features Suite</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Designed for growth. Optimized for performance.
          </h2>
          <p className="text-[#a1a1aa] text-base">
            Skip the manual workflows. Orbit simplifies the entire content pipeline using advanced AI models built to understand audience engagement.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WHY_CARDS.map((card, i) => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="relative group p-8 rounded-2xl border border-white/5 bg-white/2 overflow-hidden shadow-2xl transition-all"
              >
                {/* Glow circle background */}
                <div 
                  className="absolute -right-16 -top-16 w-36 h-36 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ backgroundColor: card.glow }}
                />

                <div className="space-y-6 relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c084fc]">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#c084fc] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-[#a1a1aa] leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>


      {/* --- SECTION 4: FEATURE SHOWCASE (INTERACTIVE EXPLORER) --- */}
      <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto border-t border-white/5 space-y-16 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-bold text-[#c084fc] tracking-wider">Interactive Explorer</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            15+ Core social growth tools in one console
          </h2>
          <p className="text-[#a1a1aa] text-base">
            Select a feature from the sidebar to inspect its engine diagnostic outputs.
          </p>
        </div>

        {/* Explorer Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Tab selectors */}
          <div className="lg:col-span-5 flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-2 scrollbar-thin">
            {FEATURES_EXPLORER.map((feat) => (
              <button
                key={feat.id}
                onClick={() => setSelectedFeature(feat.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  selectedFeature === feat.id 
                    ? "bg-[#8b5cf6]/5 border-[#8b5cf6]/30 shadow-[0_0_15px_rgba(139,92,246,0.05)]" 
                    : "bg-white/1 border-white/5 hover:border-white/10"
                }`}
              >
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#52525b] block mb-1">
                    {feat.category}
                  </span>
                  <h4 className={`text-sm font-semibold transition-colors ${selectedFeature === feat.id ? "text-white" : "text-[#a1a1aa]"}`}>
                    {feat.title}
                  </h4>
                  <p className="text-xs text-[#a1a1aa] mt-1.5 leading-relaxed line-clamp-2">
                    {feat.description}
                  </p>
                </div>
                <ChevronRight className={`h-4 w-4 shrink-0 transition-transform mt-0.5 ${selectedFeature === feat.id ? "text-[#c084fc] translate-x-1" : "text-[#52525b]"}`} />
              </button>
            ))}
          </div>

          {/* Right: Mock Terminal/Diagnostic Panel */}
          <div className="lg:col-span-7 relative bg-[#0c0c0e] rounded-2xl border border-white/5 p-6 flex flex-col justify-between shadow-2xl min-h-[360px]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#c084fc] animate-ping" />
                <span className="text-[10px] font-mono text-[#a1a1aa]">ENGINE DIAGNOSTIC: {activeFeatureObj.id.toUpperCase()}</span>
              </div>
              <span className="text-[9px] text-[#52525b] font-mono">STATUS: ONLINE</span>
            </div>

            {/* Content Preview */}
            <div className="py-6 flex-1 space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <span className="text-[#52525b] text-[10px] block uppercase font-bold tracking-wider">Generated System Payload</span>
                <div className="p-4 bg-white/2 rounded-xl border border-white/5 text-[#a1a1aa] leading-relaxed whitespace-pre-wrap">
                  {activeFeatureObj.details.previewText}
                </div>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                {Object.entries(activeFeatureObj.details.metrics).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <span className="text-[9px] text-[#52525b] uppercase font-bold tracking-wider">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <p className="text-sm font-semibold text-white">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA action */}
            <div className="border-t border-white/5 pt-3 flex items-center justify-between">
              <span className="text-[10px] text-[#52525b]">Press Demo to test this feature instantly</span>
              <button 
                onClick={handleDemoStart}
                className="px-3 py-1.5 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#c084fc] hover:bg-[#8b5cf6]/20 text-[11px] font-semibold transition-all flex items-center gap-1"
              >
                Run diagnostics <ArrowRight className="h-3 w-3" />
              </button>
            </div>

          </div>
        </div>
      </section>


      {/* --- SECTION 5: AI ASSISTANT SECTION --- */}
      <section id="ai-studio" className="py-24 md:py-32 px-6 max-w-7xl mx-auto border-t border-white/5 space-y-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left side text */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-xs font-semibold text-[#c084fc]">
              <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '3s' }} />
              <span>Orbit AI Engine</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              Unleash autonomous content compilation
            </h2>
            <p className="text-[#a1a1aa] leading-relaxed">
              Experience the core content workspace. Tap any tab to simulate how the AI compiles high-converting updates, schedules calendar queues, and drafts direct-reply comments.
            </p>

            {/* Navigation buttons for tabs */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-4">
              {AI_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAiTab(tab.id)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold text-center transition-all ${
                    aiTab === tab.id 
                      ? "bg-white text-black border-transparent shadow-lg" 
                      : "bg-white/1 border-white/5 text-[#a1a1aa] hover:border-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right side AI Terminal interface */}
          <div className="lg:col-span-7 relative">
            {/* Outer Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#8b5cf6] to-[#6366f1] rounded-2xl blur-[30px] opacity-10 pointer-events-none" />

            <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative z-10 flex flex-col min-h-[380px] bg-[#0c0c0e]/80">
              
              {/* Header */}
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-[#08080a]">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                  <span className="text-[10px] font-mono text-[#c084fc] font-bold">SYSTEM PROMPT: {AI_TABS.find(t=>t.id===aiTab)?.prompt}</span>
                </div>
                <span className="text-[9px] text-[#52525b] font-mono">MODEL: GEMINI-PRO-1.5</span>
              </div>

              {/* Body Content Area */}
              <div className="p-6 flex-1 flex flex-col justify-between font-mono text-xs text-[#a1a1aa] leading-relaxed space-y-4">
                
                {/* Typing container */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#52525b] uppercase font-bold tracking-wider">
                    <span>Generating output payload</span>
                    {isTyping && <span className="h-1.5 w-1.5 bg-[#c084fc] rounded-full animate-ping" />}
                  </div>
                  
                  <div className="p-4 bg-white/2 rounded-xl border border-white/5 text-white whitespace-pre-wrap select-none min-h-[160px]">
                    {typedText}
                    {isTyping && <span className="inline-block w-1.5 h-3.5 bg-[#c084fc] ml-1 animate-pulse" />}
                  </div>
                </div>

                {/* Footer specs */}
                <div className="flex items-center justify-between text-[9px] text-[#52525b] border-t border-white/5 pt-4">
                  <span>Tokens used: 142 / 2048</span>
                  <span>Execution speed: 1.2s</span>
                </div>

              </div>

            </div>
          </div>

        </div>
      </section>


      {/* --- SECTION 6: SUPPORTED PLATFORMS --- */}
      <section id="supported" className="py-24 md:py-32 bg-[#070707] border-t border-white/5 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs uppercase font-bold text-[#c084fc] tracking-wider">Integrations</span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Every platform, everywhere.
            </h2>
            <p className="text-[#a1a1aa] text-base">
              Establish a presence across all active networks. Optimize layout formats per platform directly from one content calendar workspace.
            </p>
          </div>

          {/* Grid of platform cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {PLATFORMS.map((plat, i) => {
              const IconComponent = plat.icon;
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={handleDemoStart}
                  className="p-5 rounded-xl border border-white/5 bg-white/2 flex flex-col items-center justify-center text-center gap-3 cursor-pointer group hover:border-white/10 transition-all shadow-md"
                >
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 transition-colors text-white group-hover:text-white"
                    style={{ '--hover-color': plat.color } as React.CSSProperties}
                  >
                    <IconComponent className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs font-semibold text-[#a1a1aa] group-hover:text-white transition-colors">
                    {plat.name}
                  </span>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>


      {/* --- SECTION 7: DASHBOARD SHOWCASE (BROWSER MOCKUP) --- */}
      <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto border-t border-white/5 space-y-12 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-bold text-[#c084fc] tracking-wider">Console Showcase</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Built for design-oriented teams
          </h2>
          <p className="text-[#a1a1aa] text-base">
            Get a high-level preview of your social metrics, scheduler queue calendar, and workspace diagnostics page layout.
          </p>
        </div>

        {/* Large Browser mockup card */}
        <motion.div 
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={scaleIn}
          className="w-full relative"
        >
          {/* Radial back glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#8b5cf6]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="w-full rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative z-10 bg-[#0c0c0e]">
            {/* Top Bar */}
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-[#08080a]">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <div className="px-3 py-1 rounded bg-white/5 text-[10px] text-[#52525b] font-mono ml-4 select-none flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  https://app.orbit.com/dashboard
                </div>
              </div>
              <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white font-bold select-none">D</div>
            </div>

            {/* Dashboard Mock Content inside Browser */}
            <div className="p-6 md:p-8 space-y-8 select-none">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Console Dashboard
                    <span className="text-[10px] bg-[#8b5cf6]/15 border border-[#8b5cf6]/20 px-2 py-0.5 rounded-full text-[#c084fc] font-bold">Personal Workspace</span>
                  </h3>
                  <p className="text-xs text-[#a1a1aa] mt-1">Diagnostic oversight of campaigns and follower growth reach this week.</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-xs font-semibold text-white shadow-lg">
                  + Create Campaign
                </div>
              </div>

              {/* Metric stats card grid inside mockup */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#52525b]">Consolidated Reach</span>
                  <p className="text-xl font-bold text-white">124,802</p>
                  <span className="text-[9px] text-green-400 font-semibold flex items-center gap-0.5">
                    +14.2% <TrendingUp className="h-2.5 w-2.5" />
                  </span>
                </div>
                <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#52525b]">Average Engagement</span>
                  <p className="text-xl font-bold text-white">5.62%</p>
                  <span className="text-[9px] text-green-400 font-semibold flex items-center gap-0.5">
                    +0.8% <TrendingUp className="h-2.5 w-2.5" />
                  </span>
                </div>
                <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#52525b]">Campaign Queue</span>
                  <p className="text-xl font-bold text-white">14 scheduled</p>
                  <span className="text-[9px] text-[#a1a1aa] font-medium">All channels healthy</span>
                </div>
                <div className="p-4 bg-white/2 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#52525b]">Workspace Limits</span>
                  <p className="text-xl font-bold text-[#c084fc]">42 / 200 credits</p>
                  <span className="text-[9px] text-[#52525b]">Resets in 12 days</span>
                </div>
              </div>

              {/* Double column mock content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Reach Chart representation */}
                <div className="lg:col-span-2 p-5 bg-white/2 rounded-xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Weekly Reach Chart</span>
                    <div className="flex gap-3 text-[10px] text-[#a1a1aa] font-semibold">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#8b5cf6]" /> Reach</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#6366f1]" /> Impressions</span>
                    </div>
                  </div>

                  {/* Simulated Chart Visual */}
                  <div className="h-[180px] w-full flex items-end justify-between pt-6 px-4 relative">
                    {/* Simulated bars grid */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                      <div className="h-px bg-white/5 w-full" />
                      <div className="h-px bg-white/5 w-full" />
                      <div className="h-px bg-white/5 w-full" />
                    </div>
                    {[40, 25, 75, 55, 60, 85, 90].map((h, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-[70%] max-w-[20px] bg-gradient-to-t from-[#6366f1]/20 to-[#8b5cf6]/80 rounded-t" style={{ height: `${h * 1.5}px` }} />
                        <span className="text-[9px] text-[#52525b] font-mono">Day {i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Queue status checklist */}
                <div className="p-5 bg-white/2 rounded-xl border border-white/5 space-y-4">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">Upcoming Updates</span>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-white/1 border border-white/5 rounded-lg flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-full bg-pink-500/10 flex items-center justify-center text-[9px] font-bold text-pink-400">I</div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">Theme reveal video</p>
                          <span className="text-[9px] text-[#52525b]">Instagram • 2h left</span>
                        </div>
                      </div>
                      <div className="h-2 w-2 bg-[#8b5cf6] rounded-full" />
                    </div>
                    <div className="p-3 bg-white/1 border border-white/5 rounded-lg flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-[9px] font-bold text-blue-400">L</div>
                        <div>
                          <p className="text-[11px] font-semibold text-white">SaaS Product launch thread</p>
                          <span className="text-[9px] text-[#52525b]">LinkedIn • Tomorrow</span>
                        </div>
                      </div>
                      <div className="h-2 w-2 bg-[#6366f1] rounded-full" />
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </motion.div>
      </section>


      {/* --- SECTION 8: WORKFLOW AUTOMATION --- */}
      <section className="py-24 md:py-32 px-6 max-w-7xl mx-auto border-t border-white/5 space-y-16 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-bold text-[#c084fc] tracking-wider">Pipeline Flow</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Automated from draft to analytics
          </h2>
          <p className="text-[#a1a1aa] text-base">
            Understand how campaign workflows execute automatically without manual scheduler oversight.
          </p>
        </div>

        {/* Animated flow diagram layout */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-stretch relative">
          
          {/* Step 1: Idea */}
          <div className="p-6 rounded-2xl border border-white/5 bg-white/2 space-y-4 flex flex-col justify-between">
            <span className="text-[10px] text-[#52525b] font-mono">01 // SOURCE</span>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">Campaign Idea</h4>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">Tease the launch of dark mode layouts next Tuesday morning.</p>
            </div>
            <div className="h-1 bg-[#8b5cf6] w-[40%] rounded-full" />
          </div>

          {/* Step 2: AI Caption */}
          <div className="p-6 rounded-2xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/5 space-y-4 flex flex-col justify-between shadow-[0_0_15px_rgba(139,92,246,0.05)]">
            <span className="text-[10px] text-[#c084fc] font-mono font-bold flex items-center gap-1">
              <Sparkles className="h-3 w-3 animate-spin" />
              02 // AI COMPILE
            </span>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">AI Engine Copy</h4>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">Generates captions, hashtags, tone variations per platform in 1.2s.</p>
            </div>
            <div className="h-1 bg-[#8b5cf6] w-[80%] rounded-full" />
          </div>

          {/* Step 3: Asset Upload */}
          <div className="p-6 rounded-2xl border border-white/5 bg-white/2 space-y-4 flex flex-col justify-between">
            <span className="text-[10px] text-[#52525b] font-mono">03 // DESIGNER</span>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">Upload Media</h4>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">Teammates upload custom banner designs or product videos.</p>
            </div>
            <div className="h-1 bg-[#6366f1] w-[60%] rounded-full" />
          </div>

          {/* Step 4: Approval */}
          <div className="p-6 rounded-2xl border border-white/5 bg-white/2 space-y-4 flex flex-col justify-between">
            <span className="text-[10px] text-[#52525b] font-mono">04 // AUDIT</span>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">Manager Sign-off</h4>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">Managers audit draft output and click accept status.</p>
            </div>
            <div className="h-1 bg-green-500 w-[100%] rounded-full" />
          </div>

          {/* Step 5: Queue */}
          <div className="p-6 rounded-2xl border border-white/5 bg-white/2 space-y-4 flex flex-col justify-between">
            <span className="text-[10px] text-[#52525b] font-mono">05 // QUEUE</span>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">Auto Scheduling</h4>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">Schedules publication for hours of maximum user traffic window.</p>
            </div>
            <div className="h-1 bg-indigo-500 w-[50%] rounded-full" />
          </div>

          {/* Step 6: Publish */}
          <div className="p-6 rounded-2xl border border-[#6366f1]/20 bg-[#6366f1]/5 space-y-4 flex flex-col justify-between shadow-[0_0_15px_rgba(99,102,241,0.05)]">
            <span className="text-[10px] text-[#818cf8] font-mono font-bold">06 // BROADCAST</span>
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-white">Live Broadcast</h4>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">Published to Instagram, X, LinkedIn, YouTube simultaneously.</p>
            </div>
            <div className="h-1 bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] w-[100%] rounded-full" />
          </div>

        </div>
      </section>


      {/* --- SECTION 9: TESTIMONIALS --- */}
      <section className="py-24 md:py-32 bg-[#070707] border-t border-white/5 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs uppercase font-bold text-[#c084fc] tracking-wider">Testimonials</span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Loved by digital managers
            </h2>
            <p className="text-[#a1a1aa] text-base">
              See how modern creators and marketing directors scale their pipelines with Orbit.
            </p>
          </div>

          {/* Grid of review cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((test, i) => (
              <div 
                key={i} 
                className="p-8 rounded-2xl border border-white/5 bg-white/2 flex flex-col justify-between space-y-8 relative group hover:border-white/10 transition-all shadow-xl"
              >
                <Quote className="h-8 w-8 text-[#8b5cf6]/20 absolute top-6 right-6" />

                <div className="space-y-4 relative z-10">
                  {/* Stars */}
                  <div className="flex gap-0.5 text-yellow-500">
                    {[...Array(5)].map((_, idx) => (
                      <span key={idx}>★</span>
                    ))}
                  </div>
                  <p className="text-sm text-[#a1a1aa] leading-relaxed">
                    "{test.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-white/5 relative z-10">
                  <img src={test.avatar} alt={test.name} className="h-10 w-10 rounded-full object-cover border border-white/10" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">{test.name}</h4>
                    <span className="text-[10px] text-[#52525b]">{test.role} • {test.company}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* --- SECTION 10: PRICING PREVIEW --- */}
      <section id="pricing" className="py-24 md:py-32 px-6 max-w-7xl mx-auto border-t border-white/5 space-y-16 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-bold text-[#c084fc] tracking-wider">Pricing Plans</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Pricing optimized for scale
          </h2>
          <p className="text-[#a1a1aa] text-base">
            Start completely free, then upgrade to unlocked limits as your brand presence grows.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          
          {/* Starter Plan */}
          <div className="p-8 rounded-2xl border border-white/5 bg-white/2 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#52525b] uppercase">Starter</span>
              <p className="text-3xl font-extrabold text-white">$0 <span className="text-xs font-normal text-[#52525b]">/ month</span></p>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">Perfect for creators getting started with scheduling workflow.</p>
              
              <div className="h-px bg-white/5 my-4" />
              
              <ul className="space-y-2.5 text-xs text-[#a1a1aa]">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> Up to 3 Social Channels</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> 10 Scheduled Posts</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> AI Caption Generator (20 credits)</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> Basic Analytics Reports</li>
              </ul>
            </div>

            <button 
              onClick={handleDemoStart}
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white transition-all"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Plan (Highlighted) */}
          <div className="p-8 rounded-2xl border border-[#8b5cf6]/40 bg-[#8b5cf6]/5 flex flex-col justify-between space-y-8 relative shadow-[0_0_30px_rgba(139,92,246,0.1)]">
            <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 text-[9px] font-bold text-[#c084fc] uppercase">
              Most Popular
            </div>

            <div className="space-y-4">
              <span className="text-xs font-bold text-[#c084fc] uppercase">Pro Growth</span>
              <p className="text-3xl font-extrabold text-white">$29 <span className="text-xs font-normal text-[#52525b]">/ month</span></p>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">Unlock advanced AI tools and publish unlimited updates.</p>
              
              <div className="h-px bg-white/5 my-4" />
              
              <ul className="space-y-2.5 text-xs text-[#f5f5f7]">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> Unlimited Social Channels</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> Unlimited Scheduled Posts</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> AI Brand Voice tuning</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> Professional Analytics Reports</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> Team approval permissions (up to 3)</li>
              </ul>
            </div>

            <button 
              onClick={handleDemoStart}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-xs font-semibold text-white transition-all shadow-md shadow-[#8b5cf6]/10"
            >
              Start Free Trial
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="p-8 rounded-2xl border border-white/5 bg-white/2 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#52525b] uppercase">Agency</span>
              <p className="text-3xl font-extrabold text-white">$99 <span className="text-xs font-normal text-[#52525b]">/ month</span></p>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">For large agencies managing multiple client brands.</p>
              
              <div className="h-px bg-white/5 my-4" />
              
              <ul className="space-y-2.5 text-xs text-[#a1a1aa]">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> Everything in Pro</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> Unlimited client workspaces</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> Brand Voice tuning per client workspace</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> Premium White-label preview links</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c084fc]" /> Dedicated Support Manager</li>
              </ul>
            </div>

            <button 
              onClick={handleDemoStart}
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-white transition-all"
            >
              Contact Sales
            </button>
          </div>

        </div>
      </section>


      {/* --- SECTION 11: FAQ --- */}
      <section id="faq" className="py-24 md:py-32 px-6 max-w-4xl mx-auto border-t border-white/5 space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <span className="text-xs uppercase font-bold text-[#c084fc] tracking-wider">FAQ</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Accordion list */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = faqOpen === idx;
            return (
              <div key={idx} className="border border-white/5 bg-white/1 rounded-xl overflow-hidden">
                <button
                  onClick={() => setFaqOpen(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 text-sm font-semibold text-white hover:bg-white/2 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-[#a1a1aa] transition-transform ${isOpen ? "rotate-180 text-white" : ""}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 pb-5 text-xs text-[#a1a1aa] leading-relaxed border-t border-white/5 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>


      {/* --- SECTION 12: FINAL CTA --- */}
      <section className="py-24 md:py-32 px-6 relative z-10 max-w-7xl mx-auto overflow-hidden">
        {/* Border Box with glowing back gradient */}
        <div className="relative p-12 md:p-20 rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/1 text-center space-y-8 max-w-5xl mx-auto overflow-hidden shadow-2xl">
          
          {/* Radial glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#8b5cf6]/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready to transform your social media workflow?
            </h2>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              Join thousands of agencies, companies, and creators scaling their content calendars with Orbit AI console. Start free today.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 relative z-10">
            <button 
              onClick={handleDemoStart}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white font-semibold text-sm transition-all hover:opacity-95 shadow-[0_0_25px_rgba(139,92,246,0.2)] active:scale-[0.98] flex items-center gap-2 group"
            >
              Start Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button 
              onClick={handleDemoStart}
              className="px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-semibold text-sm text-[#f5f5f7] transition-all"
            >
              Book Demo
            </button>
          </div>

        </div>
      </section>


      {/* --- SECTION 13: FOOTER --- */}
      <footer className="border-t border-white/5 bg-[#070707] py-16 md:py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          
          {/* Logo & description column */}
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] shadow-lg">
                <OrbitLogo size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Orbit</span>
            </Link>
            <p className="text-xs text-[#a1a1aa] leading-relaxed max-w-sm">
              Everything your social media team needs. Powered by AI. One workspace for campaigns, captions, schedules, and analytics.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="md:col-span-2 space-y-4">
            <span className="text-[10px] uppercase font-bold text-white tracking-wider block">Product</span>
            <ul className="space-y-2 text-xs text-[#a1a1aa]">
              <li><a href="#why" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#ai-studio" className="hover:text-white transition-colors">AI Engine</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
              <li><a href="#supported" className="hover:text-white transition-colors">Supported platforms</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="md:col-span-2 space-y-4">
            <span className="text-[10px] uppercase font-bold text-white tracking-wider block">Resources</span>
            <ul className="space-y-2 text-xs text-[#a1a1aa]">
              <li><a href="#" className="hover:text-white transition-colors">SaaS Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Social Playbooks</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">System status</a></li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="md:col-span-2 space-y-4">
            <span className="text-[10px] uppercase font-bold text-white tracking-wider block">Company</span>
            <ul className="space-y-2 text-xs text-[#a1a1aa]">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Brand Assets</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Sales</a></li>
            </ul>
          </div>

          {/* Newsletter / Social Links Column */}
          <div className="md:col-span-2 space-y-4">
            <span className="text-[10px] uppercase font-bold text-white tracking-wider block">Stay Connected</span>
            <div className="flex gap-2">
              <a href="#" className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[#a1a1aa] hover:text-white hover:bg-white/10 transition-all">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[#a1a1aa] hover:text-white hover:bg-white/10 transition-all">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[#a1a1aa] hover:text-white hover:bg-white/10 transition-all">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
            <div className="pt-2">
              <span className="text-[9px] text-[#52525b] block">© 2026 Orbit Inc.</span>
              <span className="text-[9px] text-[#52525b] block">All rights reserved.</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
