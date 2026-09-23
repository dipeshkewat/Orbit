"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Calendar as CalendarIcon,
  TrendingUp,
  Check,
  ChevronDown,
  Quote,
  Link2,
  PenLine,
  BadgeCheck,
  Rocket,
  Hash,
  Repeat2,
  Clock,
  BarChart3,
  Lightbulb,
  Heart,
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
import { OrbitLogo } from "@/components/logo";

/* ─────────────────────────────────────────────────────────────
 * Light editorial theme — ink on paper, black accent cards,
 * rounded containers, doodle details. App stays untouched.
 * ───────────────────────────────────────────────────────────── */
const C = {
  paper: "#FAFAF8",
  card: "#FFFFFF",
  ink: "#111110",
  inkSoft: "#3F3F3C",
  muted: "#78716C",
  line: "#E7E5E0",
  black: "#131311",
  accent: "#10B981",
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

/* ─── Doodles ─── */
function Starburst({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden>
      <path
        d="M50 5 L56 38 L82 18 L62 45 L95 50 L62 55 L82 82 L56 62 L50 95 L44 62 L18 82 L38 55 L5 50 L38 45 L18 18 L44 38 Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SquiggleArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 60" fill="none" className={className} aria-hidden>
      <path
        d="M6 8 C 30 4, 62 14, 66 34 C 68 46, 58 52, 50 48"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="1 8"
      />
      <path d="M42 40 L50 49 L60 44" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Section tag pill ─── */
function SectionTag({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide"
      style={
        dark
          ? { border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }
          : { border: `1px solid ${C.line}`, color: C.ink, backgroundColor: C.card }
      }
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.accent }} />
      {children}
    </span>
  );
}

/* ─── Data ─── */
const WORDMARKS = ["northwind", "studio labs", "thorne", "helio", "march&co", "fernwood", "palo", "kestrel"];

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

const SERVICES = [
  {
    n: "01",
    title: "Create with AI",
    description:
      "Captions, hashtags, and full post ideas — drafted in your brand voice, tuned per platform, ready in seconds. Orbit learns from your best content, not generic templates.",
    icon: Sparkles,
    dark: true,
  },
  {
    n: "02",
    title: "Schedule everywhere",
    description:
      "One composer, twelve networks. Tailor each variant, pick the best time, and let the queue do the remembering.",
    icon: CalendarIcon,
    dark: false,
  },
  {
    n: "03",
    title: "Know what works",
    description:
      "Reach, engagement, and clear recommendations across every account — no vanity charts, just what to do next.",
    icon: TrendingUp,
    dark: false,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect",
    description: "Link your social accounts in minutes. Tokens are encrypted and refresh themselves.",
    icon: Link2,
    rotate: "md:-rotate-6",
    offset: "md:mt-16",
  },
  {
    n: "02",
    title: "Draft",
    description: "Describe the post. Orbit writes on-brand variants for every platform you target.",
    icon: PenLine,
    rotate: "md:rotate-3",
    offset: "md:-mt-6",
  },
  {
    n: "03",
    title: "Approve",
    description: "Teams review, comment, and sign off — so nothing ships before it's ready.",
    icon: BadgeCheck,
    rotate: "md:-rotate-3",
    offset: "md:mt-10",
  },
  {
    n: "04",
    title: "Publish",
    description: "Orbit posts on time, tracks results, and suggests what to make next.",
    icon: Rocket,
    rotate: "md:rotate-6",
    offset: "md:-mt-4",
  },
];

const AI_CARDS = [
  { title: "Captions", description: "On-brand drafts for any topic, tone, or platform.", icon: PenLine },
  { title: "Hashtags", description: "Trending, relevant tags — suggested per post.", icon: Hash },
  { title: "Brand voice", description: "Trained on your examples with vector retrieval.", icon: Heart },
  { title: "Repurposing", description: "One post, platform-perfect variants in a click.", icon: Repeat2 },
  { title: "Best times", description: "Publish when your audience is actually listening.", icon: Clock },
  { title: "Recommendations", description: "What to double down on, based on your real metrics.", icon: Lightbulb },
];

const TESTIMONIALS = [
  {
    quote:
      "Orbit replaced three tools for us. We plan, write, and review every campaign in one place — and it finally feels calm.",
    name: "Alex Rivera",
    role: "Head of Marketing · Northwind",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
  },
  {
    quote:
      "The AI writes captions that actually sound like us, and the approval step means nothing ships by accident.",
    name: "Elena Rostova",
    role: "Content Director · Studio Labs",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
  },
  {
    quote:
      "Managing 12 clients used to be chaos. Separate workspaces and shareable previews changed how our agency works.",
    name: "Marcus Thorne",
    role: "Founder · Thorne Agency",
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
    a: "You give Orbit a few examples of your writing. It embeds them, learns your tone and hashtag style, and retrieves the most on-brand examples every time it drafts for you.",
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

/* ─── Scattered step card (polaroid with pin) ─── */
function StepCard({ step }: { step: (typeof STEPS)[number] }) {
  const Icon = step.icon;
  return (
    <motion.div
      variants={fadeUp}
      className={`relative rounded-2xl bg-white p-6 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.25)] ${step.rotate} ${step.offset}`}
      style={{ border: `1px solid ${C.line}` }}
    >
      {/* pin */}
      <span
        className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white shadow"
        style={{ backgroundColor: C.ink }}
      />
      <div className="flex items-start justify-between">
        <span className="text-4xl font-black" style={{ color: C.line }}>
          {step.n}
        </span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: C.paper, border: `1px solid ${C.line}`, color: C.ink }}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <h3 className="mt-4 text-xl font-extrabold tracking-tight" style={{ color: C.ink }}>
        {step.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>
        {step.description}
      </p>
    </motion.div>
  );
}

/* ─── Landing page ─── */
export default function LandingPage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: C.paper, color: C.ink }}>
      {/* ═══ NAV ═══ */}
      <header
        className="fixed inset-x-0 top-0 z-50 backdrop-blur-xl"
        style={{ backgroundColor: "rgba(250,250,248,0.85)", borderBottom: `1px solid ${C.line}` }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: C.ink }}>
              <OrbitLogo size={18} className="text-white" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Orbit</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex" style={{ color: C.inkSoft }}>
            <button onClick={() => scrollTo("services")} className="transition-colors hover:text-black">Services</button>
            <button onClick={() => scrollTo("how")} className="transition-colors hover:text-black">How it works</button>
            <button onClick={() => scrollTo("platforms")} className="transition-colors hover:text-black">Platforms</button>
            <button onClick={() => scrollTo("pricing")} className="transition-colors hover:text-black">Pricing</button>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="text-sm font-semibold transition-colors hover:text-black" style={{ color: C.inkSoft }}>
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95"
              style={{ backgroundColor: C.ink }}
            >
              Contact Sales
            </Link>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 md:hidden" aria-label="Menu">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
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
            className="fixed inset-0 z-40 flex flex-col gap-6 px-6 pt-24 md:hidden"
            style={{ backgroundColor: C.paper }}
          >
            <div className="flex flex-col gap-4 pt-6 text-lg font-medium" style={{ color: C.inkSoft }}>
              {[
                { id: "services", label: "Services" },
                { id: "how", label: "How it works" },
                { id: "platforms", label: "Platforms" },
                { id: "pricing", label: "Pricing" },
              ].map((item) => (
                <button key={item.id} onClick={() => { setMobileMenuOpen(false); scrollTo(item.id); }} className="text-left transition-colors hover:text-black">
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-full py-3 text-center text-sm font-semibold" style={{ border: `1px solid ${C.line}` }}>
                Sign in
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block rounded-full py-3 text-center text-sm font-semibold text-white" style={{ backgroundColor: C.ink }}>
                Start free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HERO ═══ */}
      <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-28 md:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="space-y-7 lg:col-span-7">
            <SectionTag>Welcome to Orbit</SectionTag>

            <h1 className="text-5xl font-black uppercase leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              We orbit your
              <br />
              brands &amp; social
              <br />
              <span className="relative inline-block">
                experiences
                <Starburst className="absolute -right-10 -top-6 hidden h-10 w-10 md:block" style={{ color: C.ink }} />
              </span>
            </h1>

            <p className="max-w-md text-base leading-relaxed" style={{ color: C.muted }}>
              Plan, create with AI, schedule everywhere, and see what actually works — one calm
              workspace for your whole social presence.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="group flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95"
                style={{ backgroundColor: C.ink }}
              >
                Let&apos;s talk
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <div className="relative">
                <button onClick={() => scrollTo("how")} className="rounded-full px-5 py-3.5 text-sm font-semibold transition-colors hover:bg-white" style={{ border: `1px solid ${C.line}` }}>
                  See how it works
                </button>
                <SquiggleArrow className="absolute -right-14 -top-6 hidden h-12 w-12 md:block" style={{ color: C.ink }} />
              </div>
            </div>
          </div>

          {/* Product card */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative rounded-[2rem] p-3 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.3)]"
              style={{ backgroundColor: C.ink }}
            >
              <div className="rounded-3xl bg-white p-5">
                <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: C.muted }}>
                    This week
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{ backgroundColor: "rgba(16,185,129,0.12)", color: "#047857" }}
                  >
                    <Sparkles className="h-3 w-3" /> AI ready
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <div
                      key={i}
                      className="rounded-lg py-2"
                      style={i === 1 ? { backgroundColor: C.ink, color: "#fff" } : { color: C.muted, backgroundColor: C.paper }}
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
                  <div className="flex -space-x-1.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: "rgba(225,48,108,0.15)", color: "#e1306c" }}>I</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-bold" style={{ border: `1px solid ${C.line}` }}>𝕏</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">Product launch thread</p>
                    <span className="text-xs" style={{ color: C.muted }}>Scheduled · 9:15 AM</span>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: "rgba(16,185,129,0.12)", color: "#047857" }}>
                    Ready
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl p-3" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
                    <span className="text-xs font-semibold" style={{ color: C.muted }}>Reach</span>
                    <p className="mt-0.5 text-lg font-black">124.8K</p>
                  </div>
                  <div className="rounded-2xl p-3" style={{ backgroundColor: C.paper, border: `1px solid ${C.line}` }}>
                    <span className="text-xs font-semibold" style={{ color: C.muted }}>Engagement</span>
                    <p className="mt-0.5 text-lg font-black" style={{ color: "#047857" }}>+14.2%</p>
                  </div>
                </div>
              </div>

              {/* floating pill on the frame */}
              <span
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg"
                style={{ backgroundColor: C.ink }}
              >
                Solutions for social teams
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ WORDMARK STRIP ═══ */}
      <section className="border-y py-8" style={{ borderColor: C.line }}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-4 px-6 text-lg font-black lowercase tracking-tight" style={{ color: C.ink }}>
          {WORDMARKS.map((name, i) => (
            <React.Fragment key={name}>
              {i > 0 && <span className="text-base font-normal" style={{ color: C.muted }}>+</span>}
              <span className="opacity-70 transition-opacity hover:opacity-100">{name}</span>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ═══ BLACK STATS BANNER ═══ */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <motion.div
          variants={fadeUp}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-80px" }}
          className="relative overflow-hidden rounded-[2.5rem] px-8 py-12 md:px-14 md:py-16"
          style={{ backgroundColor: C.black }}
        >
          {/* wavy texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "repeating-radial-gradient(circle at 85% 120%, transparent 0px, transparent 14px, rgba(255,255,255,0.5) 15px, transparent 16px)",
            }}
          />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-8 text-white">
              <p className="text-5xl font-black tracking-tight md:text-6xl">
                12+
                <span className="mt-2 block text-lg font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                  platforms connected in one calendar
                </span>
              </p>
              <p className="text-5xl font-black tracking-tight md:text-6xl">
                5 min
                <span className="mt-2 block text-lg font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                  from signup to your first scheduled post
                </span>
              </p>
              <p className="text-5xl font-black tracking-tight md:text-6xl">
                1 place
                <span className="mt-2 block text-lg font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                  for creation, approvals, and analytics
                </span>
              </p>
            </div>

            {/* floating chips panel */}
            <div className="relative flex min-h-[280px] flex-wrap content-center items-center justify-center gap-3">
              {PLATFORMS.slice(0, 8).map((p, i) => {
                const rotations = ["-rotate-3", "rotate-2", "-rotate-2", "rotate-3", "rotate-1", "-rotate-1", "rotate-2", "-rotate-3"];
                return (
                  <span
                    key={p.name}
                    className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg ${rotations[i % rotations.length]}`}
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}
                  >
                    {p.name}
                  </span>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══ SERVICES (numbered cards) ═══ */}
      <section id="services" className="mx-auto max-w-7xl space-y-12 px-6 pb-20 md:pb-28">
        <div className="flex flex-col items-center gap-4 text-center">
          <SectionTag>What we do</SectionTag>
          <h2 className="max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            Everything social, in one calm place
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            const dark = s.dark;
            return (
              <motion.div
                key={s.n}
                variants={fadeUp}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, margin: "-80px" }}
                className="flex min-h-[320px] flex-col justify-between rounded-[2rem] p-8"
                style={dark ? { backgroundColor: C.black, color: "#fff" } : { backgroundColor: C.card, border: `1px solid ${C.line}` }}
              >
                <div className="flex items-start justify-between">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={dark ? { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" } : { backgroundColor: C.paper, border: `1px solid ${C.line}` }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-4xl font-black" style={dark ? { color: "rgba(255,255,255,0.25)" } : { color: C.line }}>
                    {s.n}
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-extrabold tracking-tight">{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={dark ? { color: "rgba(255,255,255,0.65)" } : { color: C.muted }}>
                    {s.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══ HOW IT WORKS (scattered polaroids) ═══ */}
      <section id="how" className="mx-auto max-w-7xl space-y-14 px-6 pb-20 md:pb-28">
        <div className="flex flex-col items-center gap-4 text-center">
          <SectionTag>How it works</SectionTag>
          <h2 className="max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
            Let us show you how we drive your brand to new heights
          </h2>
        </div>

        <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <StepCard key={step.n} step={step} />
          ))}
        </div>

        <p className="text-center text-lg font-bold italic" style={{ color: C.inkSoft, transform: "rotate(-2deg)" }}>
          — ready to be delivered!
        </p>
      </section>

      {/* ═══ DARK AI SECTION ═══ */}
      <section className="mx-auto max-w-7xl px-6 pb-20 md:pb-28">
        <motion.div
          variants={fadeUp}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-80px" }}
          className="rounded-[2.5rem] p-8 md:p-14"
          style={{ backgroundColor: C.black }}
        >
          <div className="grid gap-12">
            <div className="grid items-start gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <SectionTag dark>Orbit AI</SectionTag>
                <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                  We craft meaningful content, not just quick impressions
                </h2>
              </div>
              <p className="max-w-md self-end text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                Orbit AI learns your voice from your own examples, drafts every variant, and turns
                your real performance data into your next content plan. Six skills, one workspace.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {AI_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="space-y-3 rounded-2xl p-6 transition-colors"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "#6EE7B7" }} />
                    <h3 className="font-bold text-white">{card.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══ PLATFORMS ═══ */}
      <section id="platforms" className="mx-auto max-w-7xl space-y-12 px-6 pb-20 md:pb-28">
        <div className="flex flex-col items-center gap-4 text-center">
          <SectionTag>Integrations</SectionTag>
          <h2 className="max-w-2xl text-4xl font-black tracking-tight md:text-5xl">Every platform, one workspace</h2>
          <p className="max-w-xl text-sm" style={{ color: C.muted }}>
            Connect your accounts and publish everywhere from a single calendar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {PLATFORMS.map((plat) => {
            const Icon = plat.icon;
            const isBlackLogo = plat.color === "#000000" || plat.color === "#000";
            return (
              <motion.div
                key={plat.name}
                variants={fadeUp}
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true, margin: "-40px" }}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl p-5 text-center"
                style={{ backgroundColor: C.card, border: `1px solid ${C.line}` }}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: isBlackLogo ? C.ink : C.paper,
                    border: isBlackLogo ? "none" : `1px solid ${C.line}`,
                  }}
                >
                  <Icon className="h-4.5 w-4.5" color={isBlackLogo ? "#FFFFFF" : plat.color} />
                </span>
                <span className="text-xs font-bold" style={{ color: C.inkSoft }}>{plat.name}</span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="mx-auto max-w-7xl space-y-12 px-6 pb-20 md:pb-28">
        <div className="flex flex-col items-center gap-4 text-center">
          <SectionTag>Testimonials</SectionTag>
          <h2 className="max-w-2xl text-4xl font-black tracking-tight md:text-5xl">Satisfied clients speak</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: "-80px" }}
              className={`flex flex-col justify-between gap-8 rounded-[2rem] p-8 ${i % 2 === 1 ? "md:-rotate-1" : "md:rotate-1"}`}
              style={{ backgroundColor: C.card, border: `1px solid ${C.line}` }}
            >
              <div className="space-y-4">
                <Quote className="h-7 w-7" style={{ color: C.line }} />
                <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3.5 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" style={{ border: `1px solid ${C.line}` }} />
                <div>
                  <h4 className="text-sm font-bold">{t.name}</h4>
                  <span className="text-xs" style={{ color: C.muted }}>{t.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="mx-auto max-w-7xl space-y-12 px-6 pb-20 md:pb-28">
        <div className="flex flex-col items-center gap-4 text-center">
          <SectionTag>Pricing</SectionTag>
          <h2 className="max-w-2xl text-4xl font-black tracking-tight md:text-5xl">Start free, upgrade as you grow</h2>
          <p className="text-sm" style={{ color: C.muted }}>Simple, transparent pricing. No surprises.</p>
        </div>

        <div className="mx-auto grid max-w-5xl items-stretch gap-6 md:grid-cols-3">
          {PRICING.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: "-80px" }}
              className="relative flex flex-col justify-between gap-8 rounded-[2rem] p-8"
              style={
                plan.highlighted
                  ? { backgroundColor: C.black, color: "#fff" }
                  : { backgroundColor: C.card, border: `1px solid ${C.line}` }
              }
            >
              <div className="space-y-4">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={plan.highlighted ? { color: "rgba(255,255,255,0.6)" } : { color: C.muted }}
                >
                  {plan.name}
                </span>
                <p className="text-4xl font-black tracking-tight">
                  {plan.price}
                  <span className="text-xs font-normal" style={plan.highlighted ? { color: "rgba(255,255,255,0.5)" } : { color: C.muted }}>
                    {" "}
                    {plan.cadence}
                  </span>
                </p>
                <p className="text-xs" style={plan.highlighted ? { color: "rgba(255,255,255,0.6)" } : { color: C.muted }}>
                  {plan.blurb}
                </p>
                <div className="my-3 h-px" style={plan.highlighted ? { backgroundColor: "rgba(255,255,255,0.15)" } : { backgroundColor: C.line }} />
                <ul className="space-y-2.5 text-xs" style={plan.highlighted ? { color: "rgba(255,255,255,0.75)" } : { color: C.inkSoft }}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5" style={{ color: plan.highlighted ? "#6EE7B7" : "#047857" }} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/signup"
                className="block w-full rounded-full py-3 text-center text-xs font-bold transition-transform hover:scale-[1.02] active:scale-95"
                style={
                  plan.highlighted
                    ? { backgroundColor: "#fff", color: C.ink }
                    : { border: `1px solid ${C.line}`, color: C.ink }
                }
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="mx-auto max-w-3xl space-y-10 px-6 pb-20 md:pb-28">
        <div className="flex flex-col items-center gap-4 text-center">
          <SectionTag>FAQ</SectionTag>
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">Questions, answered</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = faqOpen === idx;
            return (
              <div key={idx} className="overflow-hidden rounded-2xl" style={{ backgroundColor: C.card, border: `1px solid ${C.line}` }}>
                <button
                  onClick={() => setFaqOpen(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm font-bold"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 transition-transform"
                    style={{ color: C.muted, transform: isOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: C.muted }}>
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ FINAL CTA (black banner) ═══ */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <motion.div
          variants={fadeUp}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: "-80px" }}
          className="relative overflow-hidden rounded-[2.5rem] px-8 py-16 text-center md:py-20"
          style={{ backgroundColor: C.black }}
        >
          <Starburst className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 opacity-20" />
          <Starburst className="pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 opacity-20" />
          <div className="relative z-10 mx-auto max-w-2xl space-y-7">
            <h2 className="text-4xl font-black uppercase tracking-tight text-white md:text-5xl">
              Let&apos;s get your brand orbiting
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              Join the teams and creators planning their whole social presence in Orbit.
              Start free — no credit card required.
            </p>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold transition-transform hover:scale-[1.03] active:scale-95"
              style={{ color: C.ink }}
            >
              Start free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ═══ FOOTER (black) ═══ */}
      <footer className="px-6 py-16 md:py-20" style={{ backgroundColor: C.black }}>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 md:grid-cols-12">
          <div className="space-y-5 md:col-span-5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white">
                <OrbitLogo size={18} className="text-black" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-white">orbit.</span>
            </Link>
            <p className="max-w-sm text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              One calm workspace for social media. Plan, create with AI, schedule everywhere, and
              see what works.
            </p>
          </div>

          {[
            { title: "Product", links: ["Services", "How it works", "Platforms", "Pricing"] },
            { title: "Resources", links: ["Blog", "Help center", "API docs", "Status"] },
            { title: "Company", links: ["About", "Careers", "Brand", "Contact"] },
          ].map((col) => (
            <div key={col.title} className="space-y-4 md:col-span-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-white">{col.title}</span>
              <ul className="space-y-2 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="transition-colors hover:text-white">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-4 md:col-span-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-white">Social</span>
            <div className="flex flex-wrap gap-2">
              {[
                { Icon: InstagramIcon, color: PLATFORM_COLORS.instagram },
                { Icon: XIcon, color: PLATFORM_COLORS.twitter },
                { Icon: LinkedInIcon, color: PLATFORM_COLORS.linkedin },
              ].map((item, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform hover:scale-105"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <item.Icon className="h-4 w-4" color="#FFFFFF" />
                </a>
              ))}
            </div>
            <p className="pt-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              © 2026 Orbit Inc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
