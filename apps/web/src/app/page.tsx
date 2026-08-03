"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Calendar as CalendarIcon,
  TrendingUp,
  Users,
  Check,
  ChevronRight,
  ChevronDown,
  Quote,
  Shield,
  Zap,
  MessageSquare,
  FileText,
  Globe,
  Share2,
  Lock,
} from "lucide-react";
import {
  InstagramIcon,
  LinkedInIcon,
  FacebookIcon,
  XIcon,
  YouTubeIcon,
  ThreadsIcon,
  TikTokIcon,
  PinterestIcon,
  RedditIcon,
  TelegramIcon,
  BlueskyIcon,
  MastodonIcon,
  PLATFORM_COLORS,
} from "@/components/social-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { OrbitLogo } from "@/components/logo";

/* ─────────────────────────────────────────────────────────────
 * Calm palette (marketing is single-theme dark by design).
 * Dark grey + white: clean, minimal, no neon or indigo.
 * ───────────────────────────────────────────────────────────── */
const C = {
  bg: "#111111",
  bgDeep: "#0A0A0A",
  card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.10)",
  primary: "#FFFFFF",
  primaryHover: "#E4E4E7",
  primaryLight: "#D4D4D8",
  accent: "#10B981", // emerald — status moments only
  text: "#F5F5F5",
  textSecondary: "#A1A1A1",
  textMuted: "#6B6B6B",
};

// --- ANIMATION CONFIGS ---
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

// --- DATA ---
const TRUSTED_LOGOS = [
  { name: "Vercel", icon: Zap },
  { name: "Linear", icon: Zap },
  { name: "Framer", icon: Share2 },
  { name: "Supabase", icon: Shield },
  { name: "Notion", icon: FileText },
  { name: "Loom", icon: MessageSquare },
];

const PLATFORMS = [
  { name: "Instagram", icon: InstagramIcon, color: PLATFORM_COLORS.instagram },
  { name: "LinkedIn", icon: LinkedInIcon, color: PLATFORM_COLORS.linkedin },
  { name: "Facebook", icon: FacebookIcon, color: PLATFORM_COLORS.facebook },
  { name: "X (Twitter)", icon: XIcon, color: PLATFORM_COLORS.twitter },
  { name: "YouTube", icon: YouTubeIcon, color: PLATFORM_COLORS.youtube },
  { name: "Threads", icon: ThreadsIcon, color: PLATFORM_COLORS.threads },
  { name: "TikTok", icon: TikTokIcon, color: PLATFORM_COLORS.tiktok },
  { name: "Pinterest", icon: PinterestIcon, color: PLATFORM_COLORS.pinterest },
  { name: "Reddit", icon: RedditIcon, color: PLATFORM_COLORS.reddit },
  { name: "Telegram", icon: TelegramIcon, color: PLATFORM_COLORS.telegram },
  { name: "Bluesky", icon: BlueskyIcon, color: PLATFORM_COLORS.bluesky },
  { name: "Mastodon", icon: MastodonIcon, color: PLATFORM_COLORS.mastodon },
];

const PILLARS = [
  {
    title: "Create with AI",
    description:
      "Generate on-brand captions, hashtags, and post ideas tuned to each network — in your voice, in seconds.",
    icon: Sparkles,
  },
  {
    title: "Schedule everywhere",
    description:
      "Write once, tailor per platform, and publish across every channel from one calm calendar.",
    icon: CalendarIcon,
  },
  {
    title: "Understand what works",
    description:
      "One clear view of reach and engagement across accounts — with recommendations, not vanity charts.",
    icon: TrendingUp,
  },
];

const FEATURES = [
  {
    id: "compose",
    title: "One composer, every network",
    description:
      "Draft a post, preview it exactly as it'll appear on each platform, and fine-tune per network without starting over.",
    bullets: ["Per-platform previews", "First-comment & thread support", "Drafts and reusable templates"],
  },
  {
    id: "schedule",
    title: "A calendar you can actually plan around",
    description:
      "Drag posts across dates, spot gaps at a glance, and let best-time suggestions fill your queue.",
    bullets: ["Drag-and-drop scheduling", "Best-time suggestions", "Month, week, and day views"],
  },
  {
    id: "collaborate",
    title: "Built for teams and clients",
    description:
      "Separate workspaces, roles, and an approval step so nothing goes live before it's ready.",
    bullets: ["Workspaces per brand or client", "Approval workflow", "Shareable read-only previews"],
  },
  {
    id: "analyze",
    title: "Reporting without the noise",
    description:
      "Headline metrics first, depth on demand. Export clean reports your clients understand.",
    bullets: ["Cross-account overview", "Post-level breakdown", "PDF & CSV export"],
  },
];

const AI_TABS = [
  {
    id: "caption",
    label: "Caption",
    prompt: "Write a launch post for Orbit",
    output:
      "Meet Orbit — one calm workspace for all your social media. Plan, write with AI, schedule everywhere, and see what's actually working. Your whole team, one place. Start free today.",
  },
  {
    id: "hashtags",
    label: "Hashtags",
    prompt: "Suggest hashtags for a SaaS launch",
    output:
      "#socialmedia  #marketing  #contentstrategy  #saas  #buildinpublic  #creators  #smm  #growth",
  },
  {
    id: "ideas",
    label: "Post ideas",
    prompt: "3 content ideas for a design tool",
    output:
      "1. A before/after of a messy calendar → a planned week.\n2. \"3 captions, 1 prompt\" — show the AI drafting variations.\n3. A teardown of a great post and why it worked.",
  },
  {
    id: "reply",
    label: "Reply",
    prompt: "Friendly reply to a feature request",
    output:
      "Love this idea — team presets are on our roadmap for next month. I'll follow up here the moment it ships. Thanks for helping shape Orbit!",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Orbit replaced three tools for us. We plan, write, and review every campaign in one place — and it finally feels calm.",
    name: "Alex Rivera",
    role: "Head of Marketing",
    company: "Northwind",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
  },
  {
    quote:
      "The AI writes captions that actually sound like us, and the approval step means nothing ships by accident.",
    name: "Elena Rostova",
    role: "Content Director",
    company: "Studio Labs",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
  },
  {
    quote:
      "Managing 12 clients used to be chaos. Separate workspaces and shareable previews changed how our agency works.",
    name: "Marcus Thorne",
    role: "Founder",
    company: "Thorne Agency",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "$0",
    cadence: "/ month",
    blurb: "For creators getting started.",
    features: ["3 social channels", "10 scheduled posts", "20 AI credits / month", "Basic analytics"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    cadence: "/ month",
    blurb: "For growing brands and creators.",
    features: [
      "Unlimited channels",
      "Unlimited scheduling",
      "AI brand-voice tuning",
      "Advanced analytics",
      "Approvals (up to 3 seats)",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Agency",
    price: "$99",
    cadence: "/ month",
    blurb: "For teams managing many brands.",
    features: [
      "Everything in Pro",
      "Unlimited client workspaces",
      "Per-client brand voice",
      "White-label preview links",
      "Priority support",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
];

const FAQS = [
  {
    q: "Which platforms does Orbit support?",
    a: "Instagram, Facebook, LinkedIn, X (Twitter), Threads, TikTok, YouTube, Pinterest, Reddit, Telegram, Bluesky, and Mastodon — with more added regularly.",
  },
  {
    q: "How does the AI match my brand voice?",
    a: "You give Orbit a few examples or a short description of your brand. It learns your tone, formatting, and hashtag style, then drafts new content that sounds like you.",
  },
  {
    q: "Can clients preview posts before they publish?",
    a: "Yes. Invite clients to a read-only workspace or share a private preview link so they can review the calendar and leave comments — without touching your setup.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. Starter is free forever: connect up to 3 accounts, schedule 10 posts, and try the AI caption generator with 20 monthly credits.",
  },
];

/* ─── Hero visual: subtle mouse parallax ─── */
function MouseParallax({ children, intensity = 12 }: { children: React.ReactNode; intensity?: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 200 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  const x = useTransform(springX, [-0.5, 0.5], [-intensity, intensity]);
  const y = useTransform(springY, [-0.5, 0.5], [-intensity, intensity]);

  return (
    <motion.div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      style={{ x, y }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

// --- MAIN PAGE ---
export default function LandingPage() {
  const router = useRouter();

  const [selectedFeature, setSelectedFeature] = useState(FEATURES[0].id);
  const [aiTab, setAiTab] = useState(AI_TABS[0].id);
  const [typedText, setTypedText] = useState("");
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentOutput = AI_TABS.find((t) => t.id === aiTab)?.output ?? "";
  const isTyping = typedText !== currentOutput;

  // Typewriter for the AI section — setState runs only inside the timer callback
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypedText(currentOutput.slice(0, i));
      if (i >= currentOutput.length) clearInterval(timer);
    }, 15);
    return () => clearInterval(timer);
  }, [currentOutput]);

  const activeFeature = FEATURES.find((f) => f.id === selectedFeature) || FEATURES[0];

  const handleSignup = () => router.push("/signup");

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: C.bg, color: C.text }}
    >
      {/* One restrained ambient orb behind the hero (indigo, not neon) */}
      <div
        className="glow-bg"
        style={{ top: "-8%", left: "50%", transform: "translateX(-50%)", width: "60%", height: "45%", backgroundColor: "rgba(255,255,255,0.06)" }}
      />

      {/* ── NAV ── */}
      <header
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl"
        style={{ backgroundColor: "rgba(11,15,25,0.72)", borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-7xl mx-auto px-6 h-[var(--header-height)] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: C.primary }}>
              <OrbitLogo size={20} className="text-[#111]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Orbit</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: C.textSecondary }}>
            <button onClick={() => scrollTo("features")} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollTo("platforms")} className="hover:text-white transition-colors">Platforms</button>
            <button onClick={() => scrollTo("pricing")} className="hover:text-white transition-colors">Pricing</button>
            <button onClick={() => scrollTo("faq")} className="hover:text-white transition-colors">FAQ</button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold px-3 py-2 hover:text-white transition-colors" style={{ color: C.textSecondary }}>
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#111] transition-colors"
              style={{ backgroundColor: C.primary }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primaryHover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
            >
              Start free
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-white/80" aria-label="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18 18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 pt-[var(--header-height)] px-6 flex flex-col gap-6 md:hidden"
            style={{ backgroundColor: C.bg }}
          >
            <div className="flex flex-col gap-4 pt-8 text-lg font-medium" style={{ color: C.textSecondary }}>
              {["features", "platforms", "pricing", "faq"].map((id) => (
                <button key={id} onClick={() => { setMobileMenuOpen(false); scrollTo(id); }} className="text-left capitalize hover:text-white transition-colors">
                  {id}
                </button>
              ))}
            </div>
            <div className="h-px w-full" style={{ backgroundColor: C.border }} />
            <div className="flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-3 rounded-xl font-semibold text-sm text-white" style={{ border: `1px solid ${C.border}` }}>
                Sign in
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block text-center py-3 rounded-xl font-semibold text-sm text-[#111]" style={{ backgroundColor: C.primary }}>
                Start free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32 md:pt-44 pb-20 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div initial="initial" animate="animate" variants={staggerContainer} className="lg:col-span-6 space-y-8 max-w-2xl">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.primaryLight }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>One calm workspace for social media</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
              Manage every social platform.
              <span style={{ color: C.primaryLight }}> Grow with AI.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg leading-relaxed" style={{ color: C.textSecondary }}>
              Plan, create, schedule, and analyze across all your channels — from one place. Powered by AI, built for teams.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/signup"
                className="px-6 py-3.5 rounded-xl text-[#111] font-semibold text-sm transition-colors flex items-center gap-2 group"
                style={{ backgroundColor: C.primary }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primaryHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
              >
                Start free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button onClick={() => scrollTo("features")} className="px-4 py-3.5 text-sm font-semibold transition-colors hover:text-white" style={{ color: C.textSecondary }}>
                See how it works
              </button>
            </motion.div>

            <motion.p variants={fadeUp} className="text-xs" style={{ color: C.textMuted }}>
              Free forever plan · No credit card required
            </motion.p>
          </motion.div>

          {/* Product preview */}
          <div className="lg:col-span-6 relative flex justify-center w-full min-h-[440px]">
            <MouseParallax>
              <div className="relative w-full h-full flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="w-full max-w-[500px] rounded-2xl p-5 space-y-4 relative z-10"
                  style={{ backgroundColor: "rgba(19,24,38,0.8)", border: `1px solid ${C.border}`, boxShadow: "var(--shadow-lg)", backdropFilter: "blur(12px)" }}
                >
                  <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <span className="text-xs font-semibold" style={{ color: C.textSecondary }}>This week</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(45,212,191,0.12)", color: C.accent }}>
                      <Sparkles className="h-3 w-3" /> AI ready
                    </span>
                  </div>

                  {/* mini calendar */}
                  <div className="p-3 rounded-xl space-y-2" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.textSecondary }}>
                        <CalendarIcon className="h-3.5 w-3.5" style={{ color: C.primaryLight }} /> Queue
                      </span>
                      <span className="text-xs" style={{ color: C.textMuted }}>Tue, Jul 21</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                        <div key={i} className="py-1.5 rounded font-semibold" style={i === 1 ? { backgroundColor: C.primary, color: "#111" } : { color: C.textMuted }}>
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* upcoming post */}
                  <div className="p-3 rounded-xl flex gap-3 items-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                    <div className="flex -space-x-1">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "rgba(225,48,108,0.18)", color: "#f0729f" }}>I</div>
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "rgba(0,119,181,0.2)", color: "#4aa3d5" }}>in</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">Product launch thread</p>
                      <span className="text-xs" style={{ color: C.textMuted }}>Scheduled · 9:15 AM</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: "rgba(22,163,74,0.15)", color: "#4ade80" }}>Ready</span>
                  </div>

                  {/* AI suggestion */}
                  <div className="p-3 rounded-xl space-y-1.5" style={{ backgroundColor: "rgba(45,212,191,0.06)", border: `1px solid rgba(45,212,191,0.15)` }}>
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: C.accent }}>
                      <Sparkles className="h-3.5 w-3.5" /> AI suggestion
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: C.textSecondary }}>
                      Posting Tuesday at 9 AM reaches ~24% more of your audience.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                      <span className="text-xs font-semibold" style={{ color: C.textMuted }}>Reach</span>
                      <p className="text-base font-bold text-white mt-0.5">124.8K</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                      <span className="text-xs font-semibold" style={{ color: C.textMuted }}>Engagement</span>
                      <p className="text-base font-bold mt-0.5" style={{ color: "#4ade80" }}>+14.2%</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </MouseParallax>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF (static, honest — no fake counters) ── */}
      <section className="relative z-10 py-14 border-t" style={{ borderColor: C.border, backgroundColor: C.bgDeep }}>
        <div className="max-w-7xl mx-auto px-6 space-y-8 text-center">
          <span className="text-xs uppercase font-bold tracking-widest" style={{ color: C.textMuted }}>
            Trusted by modern marketing teams
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
            {TRUSTED_LOGOS.map((logo, i) => {
              const Icon = logo.icon;
              return (
                <div key={i} className="flex items-center gap-2 font-semibold tracking-tight text-sm md:text-base text-white/80">
                  <Icon className="h-4.5 w-4.5" style={{ color: C.primaryLight }} />
                  <span>{logo.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PILLARS ── */}
      <section className="relative z-10 py-24 md:py-32 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-bold tracking-wider" style={{ color: C.primaryLight }}>Why Orbit</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">Everything social, in one calm place</h2>
          <p className="text-base" style={{ color: C.textSecondary }}>
            Skip the tab-juggling. Orbit brings creation, scheduling, and analytics into a single, focused workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeUp}
                className="p-8 rounded-2xl space-y-5"
                style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
              >
                <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.06)", color: C.primaryLight }}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white">{card.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>{card.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── FEATURE EXPLORER (clean product panel — no terminal gimmick) ── */}
      <section id="features" className="relative z-10 py-24 md:py-32 px-6 max-w-7xl mx-auto border-t space-y-16" style={{ borderColor: C.border }}>
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-bold tracking-wider" style={{ color: C.primaryLight }}>Features</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">A tool for every part of the workflow</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Tabs */}
          <div className="lg:col-span-5 flex flex-col gap-2">
            {FEATURES.map((feat) => {
              const active = selectedFeature === feat.id;
              return (
                <button
                  key={feat.id}
                  onClick={() => setSelectedFeature(feat.id)}
                  className="w-full text-left p-4 rounded-xl transition-colors flex items-start justify-between gap-4"
                  style={{
                    backgroundColor: active ? "rgba(99,102,241,0.08)" : C.card,
                    border: `1px solid ${active ? "rgba(99,102,241,0.3)" : C.border}`,
                  }}
                >
                  <div>
                    <h4 className="text-sm font-semibold" style={{ color: active ? "#fff" : C.textSecondary }}>{feat.title}</h4>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.textMuted }}>{feat.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 transition-transform" style={{ color: active ? C.primaryLight : C.textMuted, transform: active ? "translateX(2px)" : "none" }} />
                </button>
              );
            })}
          </div>

          {/* Preview */}
          <div className="lg:col-span-7 rounded-2xl p-8 min-h-[340px] flex flex-col justify-between" style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.border}` }}>
            <div className="space-y-5">
              <h3 className="text-2xl font-bold text-white">{activeFeature.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>{activeFeature.description}</p>
              <ul className="space-y-3 pt-2">
                {activeFeature.bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm" style={{ color: C.text }}>
                    <span className="h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: C.primaryLight }}>
                      <Check className="h-3 w-3" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/signup" className="self-start mt-6 text-sm font-semibold flex items-center gap-1.5 transition-colors" style={{ color: C.primaryLight }}>
              Try it free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI MOMENT (teal accent, no terminal framing) ── */}
      <section className="relative z-10 py-24 md:py-32 px-6 max-w-7xl mx-auto border-t" style={{ borderColor: C.border }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: "rgba(45,212,191,0.1)", border: `1px solid rgba(45,212,191,0.2)`, color: C.accent }}>
              <Sparkles className="h-3.5 w-3.5" /> Orbit AI
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">Draft a week of content in minutes</h2>
            <p className="leading-relaxed" style={{ color: C.textSecondary }}>
              Describe what you need. Orbit writes captions, hashtags, replies, and ideas in your brand voice — ready to schedule.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {AI_TABS.map((tab) => {
                const active = aiTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAiTab(tab.id)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                    style={active ? { backgroundColor: C.accent, color: "#04201c" } : { backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.textSecondary }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl overflow-hidden flex flex-col min-h-[340px]" style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.border}` }}>
              <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                <Sparkles className="h-3.5 w-3.5" style={{ color: C.accent }} />
                <span className="text-xs font-medium" style={{ color: C.textSecondary }}>
                  {AI_TABS.find((t) => t.id === aiTab)?.prompt}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <span className="text-xs uppercase font-bold tracking-wider mb-3" style={{ color: C.textMuted }}>Generated</span>
                <div className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap flex-1" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.text }}>
                  {typedText}
                  {isTyping && <span className="inline-block w-1.5 h-4 ml-1 align-middle animate-pulse" style={{ backgroundColor: C.accent }} />}
                </div>
                <div className="flex items-center justify-end gap-2 mt-4">
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.textSecondary }}>
                    Regenerate
                  </button>
                  <Link href="/signup" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#111] transition-colors" style={{ backgroundColor: C.primary }}>
                    Use this
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORMS ── */}
      <section id="platforms" className="relative z-10 py-24 md:py-32 border-t" style={{ borderColor: C.border, backgroundColor: C.bgDeep }}>
        <div className="max-w-7xl mx-auto px-6 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs uppercase font-bold tracking-wider" style={{ color: C.primaryLight }}>Integrations</span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">Every platform, one workspace</h2>
            <p className="text-base" style={{ color: C.textSecondary }}>Connect your accounts and publish everywhere from a single calendar.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {PLATFORMS.map((plat, i) => {
              const Icon = plat.icon;
              const isBlackLogo = plat.color === "#000000" || plat.color === "#000";
              return (
                <div key={i} className="p-5 rounded-xl flex flex-col items-center justify-center text-center gap-3 transition-colors" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center" 
                    style={{ 
                      backgroundColor: isBlackLogo ? "#FFFFFF" : "rgba(255,255,255,0.05)", 
                      border: isBlackLogo ? "none" : `1px solid ${C.border}` 
                    }}
                  >
                    <Icon className="h-5 w-5" color={plat.color} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: C.textSecondary }}>{plat.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative z-10 py-24 md:py-32 px-6 max-w-7xl mx-auto border-t space-y-16" style={{ borderColor: C.border }}>
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-bold tracking-wider" style={{ color: C.primaryLight }}>Testimonials</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">Loved by teams that ship content</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="p-8 rounded-2xl flex flex-col justify-between gap-8 relative" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <Quote className="h-8 w-8 absolute top-6 right-6" style={{ color: "rgba(255,255,255,0.10)" }} />
              <div className="space-y-4 relative z-10">
                <div className="flex gap-0.5" style={{ color: "#f5b301" }}>
                  {[...Array(5)].map((_, idx) => <span key={idx}>★</span>)}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>“{t.quote}”</p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 relative z-10" style={{ borderTop: `1px solid ${C.border}` }}>
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover mt-4" style={{ border: `1px solid ${C.border}` }} />
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-white">{t.name}</h4>
                  <span className="text-xs" style={{ color: C.textMuted }}>{t.role} · {t.company}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative z-10 py-24 md:py-32 px-6 max-w-7xl mx-auto border-t space-y-16" style={{ borderColor: C.border }}>
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-bold tracking-wider" style={{ color: C.primaryLight }}>Pricing</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">Start free, upgrade as you grow</h2>
          <p className="text-base" style={{ color: C.textSecondary }}>Simple, transparent pricing. No surprises.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className="p-8 rounded-2xl flex flex-col justify-between gap-8 relative"
              style={{
                backgroundColor: plan.highlighted ? "rgba(99,102,241,0.06)" : C.card,
                border: `1px solid ${plan.highlighted ? "rgba(99,102,241,0.4)" : C.border}`,
              }}
            >
              {plan.highlighted && (
                <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-xs font-bold uppercase" style={{ backgroundColor: "rgba(255,255,255,0.10)", color: C.primaryLight }}>
                  Most popular
                </div>
              )}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase" style={{ color: plan.highlighted ? C.primaryLight : C.textMuted }}>{plan.name}</span>
                <p className="text-3xl font-extrabold text-white">{plan.price}<span className="text-xs font-normal" style={{ color: C.textMuted }}> {plan.cadence}</span></p>
                <p className="text-xs leading-relaxed" style={{ color: C.textSecondary }}>{plan.blurb}</p>
                <div className="h-px my-3" style={{ backgroundColor: C.border }} />
                <ul className="space-y-2.5 text-xs" style={{ color: C.textSecondary }}>
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5" style={{ color: C.primaryLight }} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/signup"
                className="block w-full py-2.5 rounded-xl text-xs font-semibold transition-colors text-center"
                style={plan.highlighted ? { backgroundColor: C.primary, color: "#111" } : { backgroundColor: "transparent", border: `1px solid ${C.border}`, color: C.text }}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 py-24 md:py-32 px-6 max-w-4xl mx-auto border-t space-y-12" style={{ borderColor: C.border }}>
        <div className="text-center space-y-4">
          <span className="text-xs uppercase font-bold tracking-wider" style={{ color: C.primaryLight }}>FAQ</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">Questions, answered</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = faqOpen === idx;
            return (
              <div key={idx} className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                <button onClick={() => setFaqOpen(isOpen ? null : idx)} className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 text-sm font-semibold text-white">
                  <span>{faq.q}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform" style={{ color: C.textSecondary, transform: isOpen ? "rotate(180deg)" : "none" }} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 pb-5 text-sm leading-relaxed"
                      style={{ color: C.textSecondary, borderTop: `1px solid ${C.border}`, paddingTop: "0.75rem" }}
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

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 py-24 md:py-32 px-6 max-w-7xl mx-auto">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={scaleIn}
          className="relative p-12 md:p-20 rounded-3xl text-center space-y-8 max-w-4xl mx-auto overflow-hidden"
          style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="glow-bg" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "60%", height: "80%", backgroundColor: "rgba(255,255,255,0.06)" }} />
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">Ready to simplify your social media?</h2>
            <p className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>
              Join the teams and creators planning their whole social presence in Orbit. Start free — no credit card required.
            </p>
            <div className="flex justify-center pt-2">
              <Link
                href="/signup"
                className="px-6 py-3.5 rounded-xl text-[#111] font-semibold text-sm transition-colors flex items-center gap-2 group"
                style={{ backgroundColor: C.primary }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.primaryHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
              >
                Start free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t py-16 md:py-20 px-6" style={{ borderColor: C.border, backgroundColor: C.bgDeep }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: C.primary }}>
                <OrbitLogo size={20} className="text-[#111]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Orbit</span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm" style={{ color: C.textSecondary }}>
              One calm workspace for social media. Plan, create with AI, schedule everywhere, and see what works.
            </p>
          </div>

          {[
            { title: "Product", links: ["Features", "Platforms", "Pricing", "Changelog"] },
            { title: "Resources", links: ["Blog", "Help center", "API docs", "Status"] },
            { title: "Company", links: ["About", "Careers", "Brand", "Contact"] },
          ].map((col) => (
            <div key={col.title} className="md:col-span-2 space-y-4">
              <span className="text-xs uppercase font-bold tracking-wider text-white block">{col.title}</span>
              <ul className="space-y-2 text-xs" style={{ color: C.textSecondary }}>
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-2 space-y-4">
            <span className="text-xs uppercase font-bold tracking-wider text-white block">Connect</span>
            <div className="flex gap-2">
              {[
                { Icon: InstagramIcon, color: PLATFORM_COLORS.instagram },
                { Icon: LinkedInIcon, color: PLATFORM_COLORS.linkedin },
                { Icon: XIcon, color: PLATFORM_COLORS.twitter },
              ].map((item, i) => {
                const isBlackLogo = item.color === "#000000" || item.color === "#000";
                return (
                  <a 
                    key={i} 
                    href="#" 
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80" 
                    style={{ 
                      backgroundColor: isBlackLogo ? "#FFFFFF" : C.card, 
                      border: isBlackLogo ? "none" : `1px solid ${C.border}` 
                    }}
                  >
                    <item.Icon className="h-4 w-4" color={item.color} />
                  </a>
                );
              })}
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs" style={{ color: C.textMuted }}>
              <Lock className="h-3 w-3" /> © 2026 Orbit Inc.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
