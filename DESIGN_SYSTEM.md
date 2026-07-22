# Orbit — Product Design System & UX Blueprint

> Lead-designer reference for the Orbit platform. Covers branding, IA, page
> architecture, components, responsive rules, and the rationale behind every major decision.
>
> **Codebase reality check (read first):**
> - App name is **Orbit** — matches the code (`components/logo.tsx` → `OrbitLogo`, metadata
>   in `app/layout.tsx`, persisted store keys `orbit-*`, UI package `@socialsphear/ui`). The
>   repo folder "Social Sphear" is just the directory name; the product is Orbit.
> - `globals.css` is a **neon violet/purple dark theme** (`--color-primary: #8b5cf6`,
>   documented as "neon violet/purple gradients"). The brief says **no neon**. Section 1
>   defines the replacement palette and the exact token edits.
> - All primary surfaces already exist as routes — this is a **redesign + fill-in**, not
>   greenfield. Existing routes are noted per page in Section 6.

---

## 0. TL;DR — the 12 decisions that matter most

1. **De-neon the palette.** Replace neon violet `#8b5cf6` with a deeper, desaturated
   **Indigo `#4F46E5`** primary. Same brand family, half the vibration. (§1)
2. **Ship light mode as the default marketing + app theme**, dark mode as a first-class
   toggle. Current app is dark-only; creators and agencies expect light for daytime work. (§1.10)
3. **Brand personality: the calm operator.** Confident, quiet, in-control — not loud or
   "growth-hacky." (§1.1)
4. **One primary CTA per screen.** "Start free" everywhere on marketing; "New Post" as the
   single accent action in-app. (§2, §5)
5. **Onboarding must reach "first scheduled post" in under 3 minutes.** Connect → compose →
   schedule is the activation spine. (§3)
6. **Sidebar caps at 7 items** with a "More" overflow; today's app has 8 flat items that
   will not scale. (§4)
7. **Dashboard = "what needs me now."** Lead with scheduled-today + failures + one hero
   metric, not a wall of charts. (§5)
8. **Composer is the product.** It gets the most design investment: multi-platform preview,
   per-network overrides, AI assist inline. (§6, §7)
9. **Progressive disclosure everywhere.** Every page has an explicit Show First / Show
   Later / Don't Show contract. (§8)
10. **Calendar and Analytics are read-heavy — optimize for scan, not decoration.** (§6)
11. **Accessibility is a launch gate, not a polish task.** WCAG 2.2 AA contrast, full
    keyboard paths, respect `prefers-reduced-motion`. (§10)
12. **Beat Buffer on depth, beat Hootsuite on simplicity.** That's the strategic wedge. (§11)

---

## 1. Branding & Visual Identity

### 1.1 Brand personality
**The calm operator.** Orbit is where a creator, marketer, or agency sits down and
*feels in control of everything at once*. The emotional target is **relief and confidence**,
not excitement. Traits, in priority order:

| Trait | Shows up as |
|---|---|
| **Trustworthy** | Restrained color, generous whitespace, no dark patterns, honest empty/error states |
| **Effortless** | One clear action per screen, sane defaults, AI that assists rather than nags |
| **Premium** | Precise spacing, a single quality typeface, subtle depth — never skeuomorphic or loud |
| **Capable** | Depth is available on demand (overrides, analytics, team roles) but never in your face |

Why: the audience spans solo creators to enterprise agencies. Loud/playful branding wins
creators but loses agencies; sterile/corporate wins enterprise but loses creators. **Calm +
premium is the one register that reads as credible to both.** Linear and Stripe live here.

### 1.2 Design style — Minimal (as specified)
Swiss-influenced minimalism: strong typographic hierarchy, lots of negative space, color
used *only* to direct attention. No gradients as decoration (gradients reserved for one hero
moment + the logo mark). No glassmorphism as a default surface — the current `.glass`
blur-everything approach reads as 2021 and hurts contrast; keep blur only for overlays.

### 1.3 Color palette (no neon)

The rule for "not neon": keep **saturation moderate** and **lightness mid**, so colors sit
*into* the surface instead of glowing off it. Indigo stays as the brand anchor (continuity
with the current violet) but pulled toward the classic, trustworthy end.

**Primary — Indigo**
| Token | Hex | Use |
|---|---|---|
| `primary-50` | `#EEF2FF` | tints, hover backgrounds (light) |
| `primary-100` | `#E0E7FF` | selected row / chip bg |
| `primary-500` | `#6366F1` | secondary emphasis |
| `primary-600` | `#4F46E5` | **primary actions, links** ← the brand color |
| `primary-700` | `#4338CA` | hover / pressed |
| `primary-900` | `#312E81` | dark-mode accents on dark |

**Secondary — Slate (neutral spine)** carries ~90% of the UI.
| Token | Hex (light) | Role |
|---|---|---|
| `slate-50` | `#F8FAFC` | app background |
| `slate-100` | `#F1F5F9` | subtle surfaces, hover |
| `slate-200` | `#E2E8F0` | borders, dividers |
| `slate-400` | `#94A3B8` | muted text, icons-off |
| `slate-600` | `#475569` | secondary text |
| `slate-900` | `#0F172A` | primary text, headings |

**Accent — Teal** `#0D9488` (600). Used *sparingly* for positive/AI/"new" moments so it
never competes with primary indigo. Two-accent discipline (indigo = action, teal = insight)
keeps the UI legible.

**Semantic**
| | Hex | Notes |
|---|---|---|
| Success | `#16A34A` | slightly deeper than the current `#10B981` — reads less neon on white |
| Warning | `#D97706` | amber, not yellow |
| Error | `#DC2626` | |
| Info | `#2563EB` | |

**Platform brand colors** (Instagram/X/LinkedIn/etc.) — keep the existing values in
`globals.css`; they're brand-accurate and only ever appear as small badges/icons, never as
surfaces.

### 1.4 Backgrounds
- **Light:** app canvas `slate-50 #F8FAFC`, cards pure white `#FFFFFF`, elevated popovers
  white with shadow. The tiny gap between `#F8FAFC` canvas and `#FFFFFF` cards creates depth
  *without* borders everywhere.
- **Dark:** canvas `#0B0F19` (near-black with a blue undertone, warmer than today's flat
  `#090909`), surface `#131826`, elevated `#1B2233`. Undertoned dark reads more premium than
  pure black and reduces smearing on OLED.

### 1.5 Typography
- **One family: Inter** (already loaded via `next/font`). One quality typeface, used across
  its full weight range, out-performs pairing two mediocre ones.
- Optional display accent for marketing H1 only: keep Inter but at tight tracking; if a
  second face is ever added, use a geometric like **Söhne/General Sans** for hero headlines
  *only*. Don't ship two fonts into the app.
- **Numerics:** enable `font-variant-numeric: tabular-nums` on all metrics/tables so digits
  don't jitter.

**Type scale (1.25 major-third, rem):**
| Token | Size / line | Weight | Use |
|---|---|---|---|
| Display | 48 / 52 | 700 | marketing H1 |
| H1 | 32 / 40 | 700 | page titles |
| H2 | 24 / 32 | 600 | section headers |
| H3 | 20 / 28 | 600 | card titles |
| Body-lg | 18 / 28 | 400 | marketing body |
| Body | 15 / 24 | 400 | **app default** |
| Small | 13 / 20 | 400/500 | secondary, labels |
| Caption | 12 / 16 | 500 | meta, timestamps |

> Note: the current app leans heavily on `text-[10px]`/`[11px]` (see the header user block).
> **Floor app text at 13px, labels at 12px.** Sub-11px fails accessibility and reads cheap.

### 1.6 Iconography
- **Lucide** (already a dependency) — consistent 1.5–2px stroke, rounded joins. Matches the
  minimal register. Use **one icon set only**; never mix filled + outline.
- Sizes: 16 (inline/label), 20 (nav/buttons), 24 (feature/empty-state). Icons inherit
  `currentColor`, default to `slate-400` and shift to `slate-600`/primary on active.

### 1.7 Illustration style
Minimal, geometric, 2-color (indigo + slate) line illustrations with occasional teal
highlight. Used only in: empty states, onboarding, error pages, marketing feature blocks.
**No 3D characters, no stock photography of people at laptops.** Abstract "orbits, nodes,
connections" motif ties to the logo. Keep them flat and light so they load fast.

### 1.8 Buttons
| Variant | Light | Purpose |
|---|---|---|
| **Primary** | `primary-600` bg, white text, `radius-md`; hover `primary-700`; active scale `.98` | the one main action |
| **Secondary** | white bg, `slate-200` border, `slate-900` text; hover `slate-50` | supporting actions |
| **Ghost** | transparent, `slate-600` text; hover `slate-100` | tertiary, toolbar, icon buttons |
| **Destructive** | `error` text + `error/10` hover (ghost); solid red only in confirm dialogs | delete/disconnect |
| **AI** | teal `#0D9488` outline + sparkle icon | signals "AI does this" distinctly from primary |

Heights: sm 32, md 40 (default), lg 48. **Kill the gradient buttons** (`from-primary to-accent`)
in the current sidebar/composer — flat indigo is more premium and passes contrast reliably.

### 1.9 Cards, shadows, borders, spacing, radius
- **Cards:** white surface, `1px slate-200` border **or** shadow — not both. Default to
  border in light, shadow in dark. `radius-lg (16px)`, padding 20–24.
- **Radius scale:** sm 8 / md 12 / lg 16 / xl 24 / full. (Matches current tokens — keep.)
- **Shadows (light, tuned down):**
  `sm 0 1px 2px rgba(15,23,42,.06)` ·
  `md 0 4px 12px rgba(15,23,42,.08)` ·
  `lg 0 12px 32px rgba(15,23,42,.10)`.
  Softer and cooler than the current near-black shadows, which were built for a black canvas.
- **Spacing:** 4px base → 4/8/12/16/24/32/48/64. Section rhythm on marketing: 96–128px.
- **Retire `--shadow-glow`** as a default; glow = neon. Keep one faint glow only behind the
  marketing hero orb.

### 1.10 Light & dark themes
Ship **both**, light as default. Implement as `data-theme` on `<html>` driving the same
token names (so components never hard-code hex — the current code mostly does this correctly
via `var(--color-*)`, which makes theming cheap).

| Token | Light | Dark |
|---|---|---|
| background | `#F8FAFC` | `#0B0F19` |
| surface | `#FFFFFF` | `#131826` |
| surface-elevated | `#FFFFFF` | `#1B2233` |
| border | `#E2E8F0` | `#232A3B` |
| text | `#0F172A` | `#E6E9F0` |
| text-secondary | `#475569` | `#9AA4B8` |
| primary | `#4F46E5` | `#6366F1` (lift for contrast on dark) |

Why light-default: social managers work in daylight, side-by-side with bright social feeds;
an all-black tool creates jarring contrast switching. Dark is essential for night/creator
audiences → make it a real toggle in the top bar + system-preference respect, not an
afterthought.

---

## 2. Landing Page Structure

Order is deliberate: **hook → proof → how → depth → objection-handling → convert.**

| # | Section | Purpose | Key content | CTA |
|---|---|---|---|---|
| 1 | **Nav bar** | orient + always-available convert | Logo, Product/Solutions/Pricing/Resources, "Log in", **Start free** | Start free |
| 2 | **Hero** | one-sentence value + instant demo | H1 "All your social media, handled from one calm place." Sub. Product screenshot/loop of the calendar+composer. Trust line "No card required." | **Start free** + "See it work" (scrolls to demo) |
| 3 | **Social proof strip** | credibility in 3s | Logos of brands/creators + "Trusted by 12,000+ teams" + a stat | — |
| 4 | **Core value (3 pillars)** | what you get | Schedule everywhere · Create with AI · Understand what works — icon + 2 lines each | — |
| 5 | **Feature deep-dive (alternating)** | show the product | 3–4 blocks: Composer, Calendar, Analytics, AI Studio. Real UI, one benefit headline each | contextual "Learn more" |
| 6 | **AI moment** | differentiator | Short interactive-feel section: "Draft a week of posts in 30s" | Try the AI |
| 7 | **Integrations** | "it connects to my stuff" | Grid of platform logos (IG, X, LinkedIn, TikTok, FB, Pinterest, YouTube, Threads) | — |
| 8 | **Testimonials** | trust via peers | 2–3 quotes with face + role, spanning creator→agency | — |
| 9 | **Pricing preview** | reduce friction to /pricing | 3 tiers summarized, "most popular" flagged | Start free / Compare plans |
| 10 | **Final CTA band** | last conversion | Big restatement + single button on a subtle indigo field | **Start free** |
| 11 | **Footer** | SEO + trust + nav | Product/Company/Resources/Legal, socials, status, © | — |

**CTAs:** every band drives to **one** action — "Start free." Secondary links never compete
visually with it.

**Do NOT include** (avoids overwhelm / erodes trust):
- Auto-playing sound or heavy video backgrounds.
- More than one primary CTA style — no "Start free" *and* "Book demo" *and* "Watch" all as
  filled buttons in the hero. (Enterprise "Talk to sales" lives in nav + pricing only.)
- A feature *laundry list* (20 checkmarks). Show 6–8 that matter; the rest live on /features.
- Live-updating fake counters, exit-intent popups, spinning 3D. These read as growth-hacky
  and break the "calm operator" promise.
- Chatbot that opens itself on load.

Existing route: `app/page.tsx`. Redesign against this structure.

---

## 3. User Journey (first visit → active user)

```
Landing ─▶ Sign up ─▶ Onboarding (3 steps) ─▶ Connect accounts ─▶ Compose first post ─▶ Schedule ─▶ Dashboard
                             │                                                                  ▲
                             └────────── workspace auto-created (named after first account) ────┘
```

**Why this order:**
1. **Sign up before onboarding, onboarding before connect.** Capture the account first
   (don't lose them to OAuth friction), *then* set intent, *then* the higher-friction OAuth.
2. **Workspace is auto-created, not asked first.** The current flow risks front-loading
   "create a workspace" — an abstract concept a new user doesn't understand yet. Default one
   silently (name it after them / their first connected handle); expose renaming later.
   Explicit workspace creation is an *agency* need → reveal it after activation.
3. **Compose immediately after connecting.** The activation "aha" is *seeing one post
   scheduled across networks*. Every step before that is overhead; every step is cut to the
   bone. Target: **< 3 minutes to first scheduled post.**
4. **Land on Dashboard**, which now has real content (the post they just scheduled) instead
   of an empty state — the single best thing you can do for retention.

**Onboarding steps (existing route `(onboarding)/onboarding`):**
1. **"What brings you here?"** (creator / business / agency) → tailors defaults + sample
   templates. One screen, skippable.
2. **Connect your first account** — big platform buttons, OAuth. "Connect at least one; add
   the rest anytime." Show a skip → but nudge.
3. **Compose your first post** — pre-filled AI suggestion for their goal, live preview,
   "Schedule" or "Post now." Confetti-free success → route to Dashboard.

Progress bar (1/3) always visible. Every step skippable except it always ends on Dashboard.

---

## 4. Application Navigation

### 4.1 Sidebar (primary nav) — cap at 7 + overflow
Current app has **8 flat items**; that won't scale as billing/team/help arrive. Group:

```
┌─ Orbit  ◇          (logo)
├─ [Workspace switcher ▾]
├─ ✦ New Post               (accent button, always first action)
├─────────────────────────
│  ▪ Dashboard
│  ▪ Composer
│  ▪ Calendar
│  ▪ Analytics
│  ▪ Inbox
│  ▪ AI Studio
│  ▪ More ▾   → Content Planner, Competitors, Media Library
├───────────────────────── (bottom, pinned)
│  ▪ Settings
│  ▪ Help
└─ [User avatar ▾]
```

- **7 visible destinations max** (Miller's law comfort zone). Secondary tools ("Content
  Planner", "Competitors", "Media Library") fold into **More** or live inside their parent
  (Media Library is a tab of Composer *and* a standalone route).
- Collapsible to icon-rail (already implemented — keep). Active item: `primary-50` bg +
  `primary-600` text + 2px left indicator (replace the current translucent violet pill).
- **Settings + Help pinned to the bottom**, visually separated — they're utilities, not
  daily destinations.

### 4.2 Top bar
Left: **global search** (⌘K). Center: empty (breathing room). Right, in order:
**theme toggle · Help (?) · Notifications (bell) · user avatar menu**. Sticky, subtle
bottom border, `surface/85` + blur (already present — keep, retune to light).

### 4.3 Global search (⌘K command palette)
Upgrade the current text-input-that-toasts into a real **command palette**: search posts,
navigate ("go to Calendar"), and actions ("schedule new post"). This is the single highest-
leverage nav upgrade — power users (agencies) live in it. Fuzzy, keyboard-first, grouped
results (Pages / Posts / Actions / Accounts).

### 4.4 Workspace switching
Dropdown at sidebar top (exists). Show workspace name + plan badge + avatar. In the menu:
list workspaces with role, "＋ Create workspace", "Manage workspaces". For agencies with
many clients, add search within the switcher at >6 workspaces.

### 4.5 Notifications
Bell → dropdown panel (exists). Improve: **group by type**, "Mark all read", filter tabs
(All / Mentions / System / Publishing), and a link to a full `/notifications` page for
history. Unread = a small dot, not a pulsing red badge with a count that animates forever
(current `animate-pulse` is distracting — use a static dot, count only if >0).

### 4.6 User profile menu (avatar ▾)
Profile & account · Theme · Keyboard shortcuts · Billing · Refer a friend · Help & docs ·
What's new · **Log out**. (Clerk `UserButton` is wired — extend it or wrap with custom items.)

### 4.7 Mobile navigation
- **Bottom tab bar**, 5 slots: Dashboard · Calendar · **✦ New** (center, elevated) ·
  Analytics · More. Thumb-reachable; the center compose action is the app's core verb.
- Top: hamburger → full workspace/settings drawer; search icon; avatar.
- Composer and Calendar get dedicated mobile layouts (§9), everything else stacks.

---

## 5. Dashboard Design

**Principle: the dashboard answers "what needs me right now?" before "how am I doing?"**
Operational first, analytical second.

**Immediately on login (above the fold):**
1. **Greeting + primary action** — "Good morning, Dipes" · **New Post** button.
2. **"Needs attention" row** — failed posts, expiring account tokens, approvals waiting.
   *Only renders if non-empty.* This is the highest-value widget: it prevents silent failure,
   the #1 trust-killer in this category.
3. **Today / Upcoming queue** — a compact list of what's scheduled next (time · platforms ·
   preview). The operator's daily home base.
4. **One hero metric block** — 3–4 KPIs max (Total reach, Engagement rate, Posts published,
   Followers Δ) as sparklined stat cards. *Not* six charts.

**Show later (scroll / secondary):**
- **Recent performance** — top post this week, a single trend chart with a range toggle.
- **Best-time-to-post** AI nudge.
- **Account health** grid (connected accounts + status).

**Hidden until needed (progressive disclosure):**
- Full analytics (→ Analytics page).
- Per-platform deep metrics (→ click a KPI).
- Team activity feed (agency-only; hidden for solo).
- Draft graveyard, archived posts.

**Reducing cognitive load:**
- **Max ~5 modules** on the default dashboard. Everything else is one click away.
- Consistent card sizing, a 12-col grid, generous gutters.
- Numbers get context (▲ 12% vs last week) not just raw values.
- Empty/first-run: replace each module with a one-line prompt + action ("Nothing scheduled —
  compose your first post").
- Role-aware: solo creators don't see team widgets; agencies see a workspace roll-up.

Existing route: `(dashboard)/dashboard`. Current version likely over-indexes on KPI cards
(neon glass). Rebalance toward the queue + needs-attention.

---

## 6. Complete Page Architecture

Legend: **[✓]** route exists · **[+]** new/needs building.

### Marketing (public)
| Page | Purpose | User | Key components | Key actions | Why |
|---|---|---|---|---|---|
| **Home** [✓] | Convert visitors | Prospect | Hero, feature blocks, pricing preview, footer | Start free | Top of funnel |
| **Features** [+] | Depth for evaluators | Evaluator | Feature sections, comparison table | Start free / demo | SEO + objection handling |
| **Pricing** [+] | Plan selection | Buyer | Tier cards, toggle monthly/yr, FAQ, feature matrix | Choose plan | Purchase decision |
| **Solutions** [+] | Segment landing (creators/agencies/enterprise) | Segment buyer | Tailored copy, testimonials | Start free / Talk to sales | Relevance lifts conversion |
| **Blog / Resources** [+] | SEO, trust | Researcher | Article list, categories | Subscribe | Organic acquisition |
| **Public profile** `/[username]` [✓] | Shareable link-in-bio / proof | Anyone | Avatar, bio, links, latest posts | Follow / visit | Viral surface + creator value |
| **Legal (Privacy/Terms/DPA)** [+] | Compliance/trust | All | Long-form | — | Enterprise gate |

### App (authenticated)
| Page | Purpose | User | Key components | Key actions | Why |
|---|---|---|---|---|---|
| **Dashboard** [✓] | "What needs me" home | All | Needs-attention, queue, KPIs | New post | Daily entry point (§5) |
| **Composer** [✓] | Create + schedule | All | Editor, platform toggles, per-network preview & overrides, media picker, AI assist, schedule/queue picker | Publish / Schedule / Draft | **The core product** |
| **Calendar** [✓] | Plan the schedule | Manager | Month/week/day, drag-drop, filters by account/status | Reschedule, create in slot | Planning surface |
| **Analytics** [✓] | Understand performance | Manager/exec | Charts, per-platform, post table, export | Filter, export report | Prove ROI, retention |
| **Inbox** [✓] | Engage (comments/DMs/mentions) | Community mgr | Unified conversation list, reply pane, assign | Reply, assign, resolve | Closes the loop; retention |
| **AI Studio** [✓] | Generate content/ideas | Creator | Prompt panel, templates, output cards, credits meter | Generate, send to composer | Differentiator |
| **Content Planner** [✓] | Campaigns/pillars/ideas board | Strategist | Kanban of ideas → drafts → scheduled | Move card, convert to post | Higher-level org (agency) |
| **Media Library** [+] | Reusable assets | All | Grid, folders, upload, search, alt-text | Upload, insert | Asset reuse; DAM-lite |
| **Competitors** [✓] | Benchmark | Strategist | Tracked accounts, comparison metrics | Add competitor | Insight edge |
| **Team Management** [✓ `settings/team`] | Roles/approvals | Admin/agency | Member list, roles, invites, approval flows | Invite, set role | Collaboration/enterprise |
| **Settings** [✓] | Configure | All | Section nav: Profile, Accounts, Team, RSS, Developer/API, Notifications, Billing | Save | Table stakes |
| **Accounts (connections)** [✓ `settings/accounts`] | Manage social connections | Admin | Connected list + status, reconnect, add | Connect/disconnect | Health of the whole system |
| **Billing** [✓ `settings/billing`] | Plan & payment | Owner | Current plan, usage (AI credits), invoices, upgrade | Upgrade, update card | Revenue |
| **Notifications** [+] | Alert history | All | Filterable feed | Mark read | Overflow from bell |
| **Help Center** [+] | Self-serve support | All | Search, categories, articles, contact | Search, open ticket | Deflect support, trust |
| **Profile** [✓ via `/[username]` + settings] | Identity | User | Avatar, bio, public URL toggle | Edit | Personalization |
| **Onboarding** [✓] | Activate | New user | 3-step wizard (§3) | Connect, compose | Activation |
| **Auth** (login/sign-up) [✓] | Enter | Prospect/user | Clerk forms | Sign in/up | Gate |

### IA / sitemap
```
Marketing/           App/ (auth)
├─ Home              ├─ Dashboard
├─ Features          ├─ Composer ──── Media Library (tab + route)
├─ Pricing           ├─ Calendar
├─ Solutions/*       ├─ Analytics
├─ Blog/*            ├─ Inbox
├─ /[username]       ├─ AI Studio
├─ Legal/*           ├─ Content Planner
└─ Auth (in/up)      ├─ Competitors
                     ├─ Notifications
                     ├─ Help
                     └─ Settings/
                        ├─ Profile
                        ├─ Accounts (connections)
                        ├─ Team
                        ├─ Notifications prefs
                        ├─ RSS
                        ├─ Developer/API
                        └─ Billing
```

---

## 7. Interface Components (reusable library)

Built as a package (`@socialsphear/ui` already exists — extend it). Each ships with light +
dark, all states (default/hover/active/focus/disabled/loading), and keyboard support.

**Primitives:** Button (5 variants §1.8) · IconButton · Input · Textarea (auto-grow) · Select ·
Combobox · Checkbox · Radio · Switch · Slider · DatePicker · TimePicker · Tag/Chip · Badge ·
Avatar (+ platform overlay) · Tooltip · Divider · Skeleton.

**Composite:**
- **Card** (default / stat / interactive) — §1.9.
- **StatCard** — label, big tabular number, delta ▲▼, sparkline.
- **Table** — sortable headers, sticky header, row hover, selection, pagination, empty state,
  density toggle. Used in Analytics, Team, Media, Billing invoices.
- **Calendar** — month/week/day, drag-drop posts, per-slot "＋", account color-coding.
- **Modal / Dialog** — for focused decisions; blur backdrop; ESC + focus-trap; ≤560px for
  confirms, larger for composer-in-modal.
- **Drawer / Sheet** — right-side for detail (post detail, notification panel); mobile
  bottom sheet.
- **Toast** (Sonner, wired) — success/info/warn/error, ≤2 lines, auto-dismiss, undo action
  where destructive.
- **Popover / Dropdown menu** — workspace switcher, user menu, row actions.
- **Tabs** — settings sections, composer platform preview switch.
- **Command palette (⌘K)** — §4.3.
- **Empty state** — illustration + one-line explainer + single primary action. Every list/
  page has one.
- **Loading** — **skeletons** that mirror final layout (not spinners) for content areas;
  spinner only for button-level / <500ms actions. Progress bar for uploads/OAuth.
- **Charts** — line (trends), bar (compare), donut (share) — 2-color max, tabular tooltips,
  labelled axes, colorblind-safe. Wrap one library (e.g. Recharts/Visx) in themed components.
- **Forms** — label above field, helper text below, inline validation on blur, error in
  `error` color + icon + message, disabled submit until valid, success toast.
- **File upload** — drag-drop zone + click, thumbnail previews, per-file progress bar (store
  already models `progress`), remove, type/size limits shown *before* error.
- **Platform badge / selector** — the multi-select of networks in composer.
- **AI chat panel** — right drawer / panel: message thread, prompt input, streaming
  response, "insert" / "regenerate", credits remaining. Distinct teal accent so users always
  know they're in AI-land.
- **Post preview card** — renders content as it'll appear per network (IG square, X text,
  LinkedIn) — the composer's trust-builder.

---

## 8. Content Prioritization (per key page)

| Page | Show First | Show Later | Don't Show |
|---|---|---|---|
| **Dashboard** | Needs-attention, today's queue, 3–4 KPIs | Trend chart, best-time nudge, account health | Full analytics, per-post deep metrics, archived drafts |
| **Composer** | Text editor, platform toggles, one live preview, Schedule button | Per-network overrides, AI assist, media, first-comment, advanced timing | Raw API params, every platform's every option at once |
| **Calendar** | This month's scheduled posts, view switch, New | Filters by account/status, drafts overlay | Analytics, unrelated account noise |
| **Analytics** | Headline KPIs + one primary trend, date range | Per-platform breakdown, post-level table, export | Vanity metrics with no action, raw event logs |
| **Inbox** | Unread conversations, reply box | Filters, assignment, saved replies | Full CRM history, closed items (collapsed) |
| **AI Studio** | Prompt box + templates, credits left | Output history, tone/length controls | Model internals, token counts |
| **Settings** | The section you clicked | Adjacent sections via side-nav | Every setting on one endless page |
| **Billing** | Current plan + usage + upgrade | Invoice history, payment method | Competitor pricing, downgrade traps |
| **Pricing (mkt)** | 3 tiers + most-popular | FAQ, full feature matrix | 30-row matrix above the fold |

**Reasoning throughline:** *first* = the one decision/action the user came for; *later* =
depth they'll want *after* the first success (progressive disclosure); *don't show* = anything
that adds decisions without adding user value on this screen. Every hidden thing is one
predictable click away — never buried.

---

## 9. Responsive Design

Breakpoints: **mobile < 640 · tablet 640–1024 · laptop 1024–1440 · desktop > 1440.**

| Surface | Desktop / Laptop | Tablet | Mobile |
|---|---|---|---|
| **Shell** | Sidebar + topbar | Collapsed icon-rail sidebar | Bottom tab bar + top drawer (§4.7) |
| **Dashboard** | 12-col, 3–4 KPIs across | 2-col | 1-col stack, queue first |
| **Composer** | 2-pane: editor ∣ live preview | stacked, preview collapsible | single column; preview as swipeable tab; sticky Schedule bar |
| **Calendar** | full month grid, drag-drop | week view default | **agenda/list view** (month grid is unusable on phone) |
| **Analytics** | multi-chart grid | 2-col | 1-col, charts full-width, horizontal-scroll tables |
| **Tables** | full columns | hide low-priority cols | card-per-row layout |
| **Modals** | centered ≤560/larger | centered | full-screen sheets |

Rules: touch targets ≥44px on mobile; drag-drop degrades to tap-to-open + "move to" on
touch; never horizontal-scroll primary content except data tables (with a shadow affordance);
same components, responsive props — not a separate mobile app feel.

---

## 10. UX Principles / Best Practices

- **Accessibility (launch gate):** WCAG 2.2 AA. Text contrast ≥4.5:1 (this is *why* success
  moved off `#10B981` and text off sub-11px). Full keyboard nav + visible focus rings
  (`primary-600` 2px offset). Semantic HTML + ARIA on custom widgets. `prefers-reduced-motion`
  disables non-essential animation. Don't encode meaning in color alone (icons + text on
  status). Respect `prefers-color-scheme`.
- **Performance:** target LCP < 2.5s, INP < 200ms. Route-level code splitting, image
  optimization (`next/image`), skeletons so perceived load is instant, optimistic UI on
  scheduling/likes, virtualize long lists (calendar/inbox/analytics tables).
- **Loading states:** skeletons mirroring layout for content; inline spinner for button
  actions; progress bar for uploads/OAuth; never a full-page spinner after first paint.
- **Empty states:** every one = illustration + explainer + single action (never a blank
  panel). First-run dashboards teach by prompting the next step.
- **Error handling:** human language ("We couldn't reach Instagram — reconnect the account"),
  the *cause* + the *fix*, retry/undo where possible, inline (not modal) for field errors,
  toast for transient, dedicated page for 404/500. Never a raw stack trace.
- **Micro-interactions:** button press `scale .98`, hover elevation, checkmark on success,
  drag ghost on calendar, count-up on stats. All ≤200ms, `ease-out`.
- **Animation:** purposeful only — orientation (drawer slide), continuity (shared element),
  feedback (toast in). Durations 150–250ms. Nothing decorative that delays interaction.
- **User feedback:** every action confirms within 100ms (state change) and completes with a
  toast/inline result. Destructive actions confirm + offer undo.
- **Navigation:** persistent, predictable, breadcrumbs in deep settings, active-state always
  visible, back never dead-ends.
- **Consistency:** one component library, one spacing scale, one icon set, one date format,
  same verb for same action everywhere ("Schedule", not sometimes "Queue").

---

## 11. Competitor Analysis

| Product | Does well | Weakness | Orbit should… |
|---|---|---|---|
| **Buffer** | Dead-simple scheduling, clean UI, great onboarding, honest brand | Shallow analytics, limited engagement/inbox, weak for agencies | **Adopt** the simplicity & onboarding; **beat** on analytics depth + unified inbox |
| **Hootsuite** | Breadth, enterprise features, many integrations | Cluttered, dated, steep learning curve, expensive | **Avoid** the density; be the "Hootsuite power without the mess" |
| **Later** | Visual-first (IG), media/link-in-bio, best-time features | Instagram-centric, weaker text networks | **Adopt** visual calendar + link-in-bio (we have `/[username]`); stay multi-network |
| **Sprout Social** | Polished analytics/reporting, inbox, team workflows | Very expensive, heavy, enterprise-only feel | **Adopt** reporting/approval polish; **beat** on price + approachability |
| **Metricool** | Great analytics value, competitor tracking | Busy UI, inconsistent design | **Adopt** competitor tracking (we have `/competitors`); **beat** on visual clarity |
| **Postiz** | Open-source, modern, AI-forward, dev-friendly | Young, rough edges, thin support | **Adopt** AI-forward + API/dev settings (we have `settings/developer`); **beat** on polish & support |
| **Notion** | Flexible, clean IA, superb empty/onboarding states, ⌘K | Not social-specific | **Adopt** the IA discipline, command palette, calm surfaces |
| **Linear** | Speed, keyboard-first, opinionated minimal design, craft | Not social | **Adopt** the craft bar, keyboard-first, restraint — our north star for *feel* |

**Strategic wedge:** *Buffer's simplicity + Sprout's depth + Linear's craft, at a fair
price.* Positioning line: **"Everything, from one calm place."**

**Patterns to avoid:** Hootsuite's stream-overload homepage; growth-hack dark patterns
(hidden cancel, fake urgency); feature-dumping the nav; per-network tool sprawl.

---

## 12. Final Deliverables Index

1. **Sitemap** — §6 (IA tree).
2. **User-flow diagrams** — §3 (activation spine) + per-page flows implied in §6.
3. **Information architecture** — §6 IA tree + §4 navigation grouping.
4. **Design-system guidelines** — §1 (color/type/space/components tokens) + §7.
5. **Page hierarchy** — §6 tables.
6. **Navigation structure** — §4.
7. **Wireframe recommendations** — content-priority + layout per §5, §8, §9 (build as
   low-fi from the Show-First lists).
8. **Dashboard layout** — §5.
9. **Landing-page structure** — §2.
10. **Onboarding flow** — §3.
11. **UI component library** — §7 (extend `@socialsphear/ui`).
12. **UX best practices** — §10.
13. **Design rationale** — inline "Why" throughout + §0.

---

## Appendix A — `globals.css` token migration (de-neon + light default)

Replace the `:root` block's neon values. Keep variable *names* (components already reference
them), swap *values*, and add a light theme + `data-theme` switch.

```css
/* LIGHT (default) — put on :root */
--color-primary:        #4F46E5;   /* was #8b5cf6 neon violet */
--color-primary-hover:  #4338CA;
--color-primary-light:  #6366F1;
--color-accent:         #0D9488;   /* teal, was electric indigo */
--color-accent-hover:   #0F766E;

--color-background:     #F8FAFC;   /* was #090909 */
--color-surface:        #FFFFFF;
--color-surface-hover:  #F1F5F9;
--color-surface-elevated:#FFFFFF;
--color-border:         #E2E8F0;
--color-border-hover:   #CBD5E1;

--color-text:           #0F172A;
--color-text-secondary: #475569;
--color-text-muted:     #94A3B8;
--color-text-inverse:   #FFFFFF;

--color-success:#16A34A; --color-warning:#D97706; --color-error:#DC2626; --color-info:#2563EB;

/* softer, cooler shadows */
--shadow-sm:0 1px 2px rgba(15,23,42,.06);
--shadow-md:0 4px 12px rgba(15,23,42,.08);
--shadow-lg:0 12px 32px rgba(15,23,42,.10);
--shadow-glow:none;   /* retire the neon glow as a default */
```

```css
/* DARK — [data-theme="dark"] */
[data-theme="dark"]{
  --color-primary:#6366F1; --color-primary-hover:#818CF8; --color-primary-light:#A5B4FC;
  --color-accent:#2DD4BF; --color-accent-hover:#5EEAD4;
  --color-background:#0B0F19; --color-surface:#131826; --color-surface-hover:#1B2233;
  --color-surface-elevated:#1B2233; --color-border:#232A3B; --color-border-hover:#334155;
  --color-text:#E6E9F0; --color-text-secondary:#9AA4B8; --color-text-muted:#64748B;
  --color-text-inverse:#0B0F19;
  --shadow-glow:none;
}
```

Then, in components: replace gradient buttons (`bg-gradient-to-r from-[var(--color-primary)]
to-[var(--color-accent)]`) with flat `bg-[var(--color-primary)]`; drop `.glass` blur on
default cards (keep it only for overlays); raise sub-12px text.

## Appendix B — Naming: resolved

App name is **Orbit** and the code already matches — `OrbitLogo`, `app/layout.tsx` metadata,
and the `orbit-*` persist keys are all consistent. No rename needed. Only cosmetic, optional
loose ends remain:

- The repo folder is `Social Sphear` and the UI package is `@socialsphear/ui`. Neither is
  user-facing, so leave them unless you want internal tidiness (renaming the package = a
  find-replace across imports + `package.json` `name`).
- The orbit mark (ring + orbiting moon) fits the name perfectly — keep it. The de-neon
  palette (Appendix A) is the only visual change the brand needs.
