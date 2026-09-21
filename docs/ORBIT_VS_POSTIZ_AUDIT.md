# Orbit vs Postiz Gap Audit

Status date: 2026-09-21

This audit compares the gap inventory in `ORBIT_POSTIZ_GAP_CLOSING_BRIEF.md` with
behavior currently present in the Orbit repository. A route, Prisma model, or
tRPC procedure is marked **partial** when its surface exists but the behavior is
mocked, local-only, incomplete, or not safe for production. A planning document
or schema by itself is not evidence that a capability is shipped.

## Core Product Modules

| Item | Orbit status (missing / partial / present) | Where it lives in Orbit today (if partial) | What "done" looks like for Orbit | Notes |
|---|---|---|---|---|
| Full content calendar UX | partial | `apps/web/src/app/(dashboard)/calendar`; `useCalendarStore` in `apps/web/src/lib/store.ts` | Month, week, day, agenda/mobile views; workspace-scoped data; filters; drag/drop with optimistic rollback; bulk actions and empty/loading/error states | Store-backed sample posts exist. Production query and reliable rescheduling are not established. |
| Publishing engine with production states | partial | `Post` and `PostJob` models in `packages/db/prisma/schema.prisma`; posts tRPC router; scheduler/publisher module directories | Validated state machine from draft through terminal success/failure, one idempotent job per platform, audit trail, retry/dead-letter behavior, and user-readable recovery | Schema enums are represented as strings; `create` returns a stub and no publishing adapter is evidenced. |
| Deeper automation/orchestration | missing | `apps/api/src/modules/scheduler` and `publisher` are registered in `app.module.ts` | Running BullMQ queues plus Temporal workflows for delayed, recurring, token-refresh, and multi-step publishing with versioning | Architecture docs describe Temporal, but no verified workflow implementation is present in the inspected surface. |
| Analytics/reporting pipeline | partial | `apps/web/src/app/(dashboard)/analytics`; analytics tRPC router; `PostMetric` schema model | Ingest platform metrics asynchronously, store snapshots, query by workspace/date/platform, render accurate reports, and export generated data | Router returns dummy metrics and a mock CSV URL; ClickHouse wiring is explicitly deferred in code. |
| Team workflows | partial | `TeamMember` model; workspace service; team settings UI; `approvalStatus` on `Post` | Invite/accept flow, role enforcement, approval queue, comments, assignment, notifications, and immutable activity history | Member CRUD exists in service code, but authorization and end-to-end approval behavior are not demonstrated. |
| Media processing pipeline | partial | `MediaFile` model; media tRPC router; media module; composer media state | Content/magic-byte validation, private upload, processing jobs, platform variants, CDN delivery, cleanup, and processing/error states | Upload and confirm procedures return mock URLs; media library query is not workspace-scoped. |
| Webhook/event system | partial | Webhook models; developer settings UI; webhooks module; webhook event schemas | Verified inbound webhooks, signed outbound delivery, retries/backoff, deduplication, delivery history, and secret rotation | UI stores keys/webhooks locally and does not establish a server-backed delivery system. |
| Public API ecosystem | partial | `PublicApiModule`; developer settings route; API key/webhook models | Versioned REST API with authenticated workspace context, scoped resources, pagination, rate limits, docs, SDK, and revocation/usage tracking | Developer UI generates random local tokens; no verified server persistence or public controller contract. |

## Operational Modules

| Item | Orbit status (missing / partial / present) | Where it lives in Orbit today (if partial) | What "done" looks like for Orbit | Notes |
|---|---|---|---|---|
| Product-scale background workers | partial | Redis module; scheduler/publisher modules; BullMQ described in `files/roadmap_content.txt` | Running worker processes with explicit queues, concurrency, retries, idempotency keys, dead-letter handling, and graceful shutdown | Module registration exists, but queue consumers and production execution are not evidenced. |
| Health/diagnostics for jobs | missing | No verified operational dashboard or queue health route | Queue metrics, failed-job inspection, retry/replay controls, alerts, correlation IDs, and operator runbook | Roadmap mentions Bull Board, but no implementation evidence was found. |
| Integration health checks and reconnect flows | partial | Social account model/status; connected accounts settings route; social accounts module | Real OAuth callbacks, encrypted tokens, proactive refresh, expiry detection, reconnect CTA, and scheduled-post suspension rules | UI/status concepts exist; `ClerkGuard` and tRPC auth are placeholders, and OAuth behavior is not verified. |

## Business / Monetization Modules

| Item | Orbit status (missing / partial / present) | Where it lives in Orbit today (if partial) | What "done" looks like for Orbit | Notes |
|---|---|---|---|---|
| Pricing tiers with feature gating | partial | `PlanSchema`/`PLAN_LIMITS` in `packages/types`; billing router; billing settings UI | Server-side plan checks on channels, seats, posts, AI, and API usage with consistent upgrade errors | Plan data is present, but billing procedures return mock values and enforcement is not shown. |
| AI credit usage tracking and enforcement | partial | `AiCredit` model; auth store credit counters; AI Studio; AI router | Atomic workspace ledger, monthly reset, plan allowance, idempotent charge/refund semantics, and server enforcement | Current UI deducts local credits; API returns a fixed `creditsRemaining` and uses `any` in the AI router. |
| Invoicing, receipts, trial conversion | missing | Billing route/model fields and mock checkout procedure | Stripe-backed subscription lifecycle, webhook reconciliation, invoices/receipts, trials, failed-payment states, and customer-visible recovery | No verified Stripe webhook or invoice implementation. |
| Team seats and usage tracking | partial | `TeamMember`; plan limits; team settings route | Enforced seat limits, per-workspace usage, invite lifecycle, and clear limit/revocation behavior | Membership storage exists; limits and invite delivery are not proven end to end. |
| Agency/white-label account support | partial | Agency plan values; design/roadmap references; workspace model | Client workspaces, agency-level administration, branded previews/reports, isolation, and plan enforcement | Naming and plan scaffolding exist; no complete white-label workflow is evidenced. |
| Customer portal and account lifecycle | partial | Billing settings page; billing router | Upgrade, downgrade, cancel, pause, renewal, payment-method management, and post-cancellation access rules | UI exists but returns mock subscription/checkout data. |

## Publishing Features

| Item | Orbit status (missing / partial / present) | Where it lives in Orbit today (if partial) | What "done" looks like for Orbit | Notes |
|---|---|---|---|---|
| Multi-platform publishing | partial | Composer/onboarding UI; `Post`/`PostJob` schema; platform types | Real adapters for launch platforms, per-account jobs, platform validation, result URLs, and partial-failure handling | UI and schema support multiple platforms; no production adapter path is verified. |
| Delayed publishing with timezone awareness | partial | `scheduledAt` fields; onboarding scheduling; schedule tRPC procedure | Store UTC plus user timezone, validate future times/DST, show local time, and enqueue reliably | Current onboarding uses `new Date` and the API accepts timestamps without workspace authorization. |
| Recurring campaigns | partial | `isRecurring` and `recurringRule` on `Post`; roadmap references recurring workflow | Validated recurrence rules, timezone/DST semantics, generated instances, cancellation/edit policy, and idempotent workflow | Schema placeholder exists; no running recurrence implementation is evidenced. |
| Thread / carousel / story flows | missing | Platform/content fields are generic; no dedicated workflow found | Platform-specific ordered media/text items, validation, preview, publish sequencing, and recovery | Generic overrides are insufficient to prove these flows. |
| Platform-specific adaptation and media checks | partial | `platformOverrides`; platform character limits; media variants in schema | Validate content/media against each target API before scheduling and show actionable per-platform fixes | Character limits exist; actual validation and media inspection are not connected to publishing. |
| Queue prioritization / boosting | missing | No verified priority field or queue policy | Explicit priority rules, fair scheduling, operator visibility, and plan-aware limits | Not present in the inspected schema/router surface. |

## Collaboration Features

| Item | Orbit status (missing / partial / present) | Where it lives in Orbit today (if partial) | What "done" looks like for Orbit | Notes |
|---|---|---|---|---|
| Approval workflow | partial | `approvalStatus`/`approvalNote`; team UI; roadmap | Submit, approve/reject, required role checks, scheduling gate, reason history, and notifications | Data fields exist; server-side gate and complete review path are not verified. |
| Comments on drafts | missing | No comment model or confirmed UI found | Threaded workspace-scoped comments, mentions, resolution, notifications, and audit events | Not represented in the inspected Prisma schema. |
| Post assignment | missing | No assignment field or confirmed procedure found | Assign/reassign posts to members with permission checks and visible ownership | Not represented in current inspected data model. |
| Role-based permissions beyond basic roles | partial | `TeamRoleSchema`; workspace service | Central permission matrix enforced on every mutation and query, with tests for cross-role denial | Role strings and member methods exist, but route authorization is incomplete. |
| Activity feed and audit trail | partial | `ActivityLog` model | Append-only, workspace-scoped audit entries for publishing, billing, membership, and content changes; searchable feed | Model exists; broad write coverage and UI are not evidenced. |

## AI Features

| Item | Orbit status (missing / partial / present) | Where it lives in Orbit today (if partial) | What "done" looks like for Orbit | Notes |
|---|---|---|---|---|
| Brand-voice generation with approval | partial | `BrandVoiceExample` model; AI Studio; `trainBrandVoice` router procedure | Store examples safely, retrieve relevant voice context, generate drafts, meter credits, and require approval before publishing | Procedure returns `{ success: true }`; no embedding or model pipeline is evidenced. |
| Draft generation with approval step | partial | AI Studio local generation; composer store; approval fields | Generated output becomes an editable draft, records provenance/cost, and follows normal review/scheduling gates | Current AI Studio generates deterministic local text and deducts local state. |
| Content repurposing across channels | missing | Platform selection and overrides only | Transform one source into validated, editable channel variants while preserving source attribution and cost | No dedicated repurposing contract or service found. |
| Multi-channel variation generation | partial | `generateCaption` input accepts multiple platforms | Generate genuinely platform-specific variants, enforce limits, and allow per-channel approval/editing | Current API returns templated mock captions. |
| AI hashtags, hooks, and CTAs | partial | AI Studio hashtag UI; `suggestHashtags` procedure | Provider-backed, relevant, cached, workspace-aware suggestions with credit accounting and editable insertion | Router returns a fixed list; hook/CTA are not distinct capabilities. |
| Performance-based optimization suggestions | missing | Analytics and AI concepts exist separately | Use historical workspace metrics to suggest timing/content changes with evidence and explainability | No implemented cross-module recommendation path found. |

## Analytics Features

| Item | Orbit status (missing / partial / present) | Where it lives in Orbit today (if partial) | What "done" looks like for Orbit | Notes |
|---|---|---|---|---|
| Per-post performance | partial | Post metrics schema; analytics page/router | Ingest and display time-series metrics per post/platform with source timestamps and failure states | Router returns hard-coded values. |
| Channel-level performance | partial | Account metrics router; analytics page | Workspace-scoped channel comparisons, follower/engagement trends, and date filters | Router returns fixed history and ignores input values. |
| Engagement attribution | missing | Generic metric fields only | Attribute engagement to post/platform/time period with documented aggregation semantics | No attribution model or query implementation is evidenced. |
| Best-posting-time analysis | partial | `suggestBestTime` procedure; UI references | Compute recommendations from sufficient workspace history, timezone, confidence, and outcome feedback | Procedure returns fixed dates. |
| Team-facing dashboard reporting | partial | Dashboard/analytics routes; workspace model | Role-aware dashboards, saved/exportable reports, client-safe views, and accurate empty/error states | UI surfaces exist; server-backed reporting is incomplete. |

## Growth Features

| Item | Orbit status (missing / partial / present) | Where it lives in Orbit today (if partial) | What "done" looks like for Orbit | Notes |
|---|---|---|---|---|
| Lead capture | partial | Marketing landing page forms/copy surface | Validated consent-aware capture, persistence, confirmation, abuse controls, and CRM handoff | Marketing UI is present, but a server-backed lead workflow was not verified. |
| Lightweight CRM / audience relationship tracking | missing | No audience/lead model found in inspected schema | Contacts, source, relationship status, workspace scope, import/export, and privacy controls | Not represented in current inspected data model. |
| Content library with tagging/reuse | partial | `MediaFile` model; media library procedure/UI surface | Searchable reusable assets and posts with tags, folders, permissions, lifecycle, and workspace filtering | Media list exists but is unscoped and upload behavior is mocked. |
| Saved templates and campaign frameworks | partial | Content Planner route/store concepts; composer | Reusable validated templates, campaign structure, duplication, ownership, and team access | UI concepts exist; persisted backend contract is not established. |

## User-Facing Flow Gaps

| Item | Orbit status (missing / partial / present) | Where it lives in Orbit today (if partial) | What "done" looks like for Orbit | Notes |
|---|---|---|---|---|
| Onboarding to first active publishing account | partial | `apps/web/src/app/(onboarding)/onboarding/page.tsx` | Real signup, auto-created workspace, OAuth connect, account health, and recoverable progress | Current login/signup and account connection paths are simulated/local. |
| First-run workspace setup | partial | Onboarding step 1; workspace service | Server-created workspace, slug validation, owner membership, defaults, and retry-safe resume | UI creates local state; backend service lacks complete request authorization. |
| First post creation | partial | Onboarding step 3; composer; posts router | Persisted draft with media/platform validation and authenticated creator/workspace context | Onboarding calls local store; API create returns a stub. |
| Scheduled post review | partial | Calendar/dashboard UI; schedule router | Review exact target accounts, local time, approvals, media checks, and final confirmation | Visual surfaces exist; backend contract is incomplete. |
| Post failure recovery | partial | Notification/store concepts; post status fields | Clear cause, per-platform status, retry/reconnect/edit actions, audit trail, and idempotent retry | No verified publisher or retry path. |
| Reconnect-token flow | partial | Social account status fields; accounts settings route | OAuth reauthorization, token replacement, validation, notifications, and preservation of queued content | Placeholder auth/OAuth prevents production use. |
| Reactivation after disconnect | missing | Account status field only | Safe reconnect/reactivation, scheduled-post policy, user confirmation, and no duplicate publishing | No complete flow found. |

## Team Flow Gaps

| Item | Orbit status (missing / partial / present) | Where it lives in Orbit today (if partial) | What "done" looks like for Orbit | Notes |
|---|---|---|---|---|
| Invite, accept, join workspace | partial | Workspace service invite method; team settings UI | Signed invite token, email delivery, acceptance identity binding, expiry, and workspace-scoped membership | Service creates placeholder users and no complete acceptance flow is evidenced. |
| Role assignment | partial | `updateMemberRole`; team UI | Authorized owner/admin mutation, validated roles, seat limits, audit event, and cache invalidation | Method checks workspace ID but caller authorization is not shown. |
| Approve post | partial | Approval fields/UI concepts | Role-checked approval/rejection with reason, schedule gate, notification, and history | Fields exist; complete mutation flow is not verified. |
| Review published content | partial | Calendar/dashboard and metrics concepts | Team can inspect published result, platform URLs, media, metrics, and audit context | No confirmed server-backed published review path. |
| Resolve failed publishing | partial | Post/post-job failure fields and notification concepts | Per-platform diagnosis, retry/reconnect/edit, permissions, and resolution history | No production publisher/retry flow found. |
| Account ownership transitions | missing | Workspace owner/team models | Transfer ownership with confirmation, role transition, billing implications, and audit trail | No transfer procedure or UI found. |

## Revenue Flow Gaps

| Item | Orbit status (missing / partial / present) | Where it lives in Orbit today (if partial) | What "done" looks like for Orbit | Notes |
|---|---|---|---|---|
| Pricing selection | partial | Marketing pricing data; billing `getPlans`; billing page | Server-controlled plan catalog, entitlements, localized currency/terms, and conversion tracking | Static plan data exists; checkout is mocked. |
| Trial conversion | missing | Plan fields and roadmap only | Trial start/end, reminders, conversion, cancellation, and access policy driven by Stripe webhooks | No verified lifecycle implementation. |
| Upgrade/downgrade | partial | Billing UI and `createCheckout` | Stripe-backed proration and entitlement updates, confirmation, and rollback/error states | Router returns a mock checkout URL. |
| Usage warnings | partial | Local AI credit counter and plan limits | Server-calculated thresholds, notifications, blocking behavior, and workspace-scoped usage | UI warning concept exists; server enforcement is absent. |
| Billing failure handling | missing | Billing model IDs only | Webhook-driven past-due state, retries, user alerts, grace period, and downgrade policy | No verified Stripe webhook path. |

## Support / Reliability Flow Gaps

| Item | Orbit status (missing / partial / present) | Where it lives in Orbit today (if partial) | What "done" looks like for Orbit | Notes |
|---|---|---|---|---|
| Failed job retry flow | partial | Post status schema; scheduler/publisher module names | Authorized retry action, idempotency, backoff/dead-letter handling, and visible outcome | No verified worker or retry implementation. |
| Clear error-reason display | partial | Notification text/store; `errorMessage` fields | Sanitized platform-specific explanation with cause, next action, and correlation ID | UI can display local messages; production error contract is not established. |
| Team alerting for broken integrations | partial | Notifications module; notification store; account status fields | Real-time/email alerts, grouping, acknowledgement, reconnect links, and workspace scoping | Notification surfaces exist, but delivery is not verified. |
| Connected-account health status | partial | Social account status model and settings UI | Scheduled health checks, token expiry/revocation detection, platform error classification, and reconnect flow | Data shape exists; checks and refresh workflow are not evidenced. |

## Immediate Launch Blockers

1. Authentication is not production-ready: the Clerk guard and tRPC context accept placeholder/mock identities, while the web client sends a placeholder bearer token.
2. Critical API mutations are not workspace-authorized. Several update/delete/media queries use only entity IDs or omit workspace filters, creating a cross-tenant data-leak risk.
3. Core publishing is not connected to real platform adapters, workers, retries, or audit-state transitions.
4. User-facing login, signup, OAuth connections, onboarding, AI generation, analytics, billing, media upload, API keys, and webhooks include local simulations or mock responses.
5. There is no evidence of the required passing unit/integration/E2E test suite; the roadmap still marks every milestone as “Not Started.”
6. The inspected code already violates the stated no-`any` rule in the AI router and has raw errors/unvalidated authorization paths that must be addressed before launch.

## Audit Conclusion

Orbit has a useful product shell, a broad schema outline, shared Zod vocabulary, and
route-level UI coverage. It is not yet a production platform: the highest-value
surfaces are mostly prototypes around a not-yet-trusted auth, persistence, and
publishing core. The default implementation order in the brief remains appropriate,
but P0 should begin with an infrastructure/security foundation pass that makes one
workspace-scoped publishing slice real end to end before expanding feature breadth.