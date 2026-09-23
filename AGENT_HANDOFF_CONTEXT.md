# Orbit Agent Handoff Context

## 1) Project identity

This repo is the Orbit monorepo for a production-style social media orchestration platform. The platform is intended to support workspace-based publishing, team collaboration, analytics, media handling, AI workflows, and billing.

Primary workspace root:
- Orbit/

Monorepo shape:
- Orbit/apps/web — Next.js app for the dashboard UI
- Orbit/apps/api — NestJS API and background workers
- Orbit/packages/db — Prisma schema and database layer
- Orbit/packages/* — shared packages (UI, AI, config, types, etc.)

## 2) Mission and current state

The project is no longer a static mock UI. It has been built toward a real SaaS product with workspace isolation, scheduled publishing, encrypted tokens, analytics storage, collaboration flows, and server-backed dashboard data.

Current best estimate:
- Overall product completion: ~95%
- Remaining work: launch hardening only — live sandbox verification (Stripe, providers, embeddings), observability, and operational runbooks

The authoritative roadmap is:
- Orbit/docs/ORBIT_GAP_CLOSING_ROADMAP.md

The roadmap explicitly states that provider metric ingestion, monetization, AI differentiation, and ecosystem features are all implemented; only launch hardening remains.

## 3) Important constraints and delivery rules

The following rules were used throughout implementation and must continue to guide future work:

1. Tenant security matters more than feature breadth.
   - Every tenant-owned read and mutation must enforce workspace membership.
   - No cross-workspace access is allowed.

2. Provider integrations remain behind adapters.
   - Keep all platform-specific logic isolated so tests can run without live credentials.

3. One vertical slice at a time.
   - Implement each roadmap slice with focused tests before moving forward.

4. Do not rely on mocks for the business contract.
   - UI actions must read/write real server-backed data when real workspace IDs are used.

5. The architecture is intended to be production-oriented but not fully launched yet.
   - The codebase is closer to a real SaaS platform than a demo, but it still needs final hardening and late-stage operational work.

## 4) What is already implemented

### 4.1 Foundation and workspace identity

Implemented in API and workspace layers:
- Clerk-backed auth context at the API boundary
- Workspace membership validation
- Workspace-scoped access checks used by tRPC procedures
- Database-backed workspace ownership and team membership flow
- Auth middleware and authorization path for protected procedures

Key files:
- Orbit/apps/api/src/trpc/trpc.service.ts
- Orbit/apps/api/src/trpc/trpc.router.ts
- Orbit/apps/api/src/modules/workspace/workspace.service.ts
- Orbit/apps/api/src/modules/auth/clerk.guard.ts

Notes:
- The project is structured around server-side auth + workspace authorization, not client-only demo state.
- Demo workspace behavior still exists in a few UI flows, but valid provisioned workspaces should read/write real backend data.

### 4.2 Posts, scheduling, and publishing lifecycle

The post domain is implemented as database-backed and workspace-scoped.

Implemented behavior:
- Create/list/update/delete posts within workspace scope
- Schedule delayed publication through BullMQ
- Publish jobs create per-platform post jobs
- Idempotent publishing and retry states
- Final failure states and failure recovery logic
- Notification events for publish outcomes

Key files:
- Orbit/apps/api/src/modules/posts/posts.service.ts
- Orbit/apps/api/src/modules/scheduler/post-scheduler.service.ts
- Orbit/apps/api/src/modules/scheduler/scheduler.module.ts
- Orbit/apps/api/src/modules/publisher/publisher.processor.ts
- Orbit/apps/api/src/modules/publisher/publishing-state.ts

Important behavior:
- Scheduling is queue-based with a post_publish queue
- A post can be published to multiple platforms through per-platform PostJob records
- The publish worker resolves matching platform adapters, decrypts tokens, calls the provider, and updates job status

### 4.3 Social account integration and encrypted tokens

Social account connection logic is live and uses encrypted token storage.

Implemented behavior:
- OAuth state handling and callback flow
- Account upsert for connected social accounts
- Encrypted access/refresh token storage
- Token refresh status tracking
- Workspace-scoped social account listing and disconnect logic

Key files:
- Orbit/apps/api/src/modules/social-accounts/social-accounts.service.ts
- Orbit/apps/api/src/modules/social-accounts/oauth-connection.service.ts
- Orbit/apps/api/src/modules/social-accounts/oauth-state.service.ts
- Orbit/apps/api/src/modules/social-accounts/meta-oauth.service.ts
- Orbit/apps/api/src/modules/social-accounts/linkedin-oauth.service.ts
- Orbit/apps/api/src/modules/social-accounts/token-encryption.service.ts

Important notes:
- Access tokens are stored as encrypted Bytea in Prisma.
- Decryption occurs on demand only when a provider publish action needs to execute.

### 4.4 Publishing adapters

The platform has adapter implementations for common social platforms.

Implemented adapters:
- LinkedInPublisher
- InstagramPublisher
- TwitterPublisher
- FacebookPublisher
- TikTokPublisher

Key files:
- Orbit/apps/api/src/modules/publisher/adapters/platform-publisher.interface.ts
- Orbit/apps/api/src/modules/publisher/adapters/linkedin.publisher.ts
- Orbit/apps/api/src/modules/publisher/adapters/instagram.publisher.ts
- Orbit/apps/api/src/modules/publisher/adapters/twitter.publisher.ts
- Orbit/apps/api/src/modules/publisher/adapters/facebook.publisher.ts
- Orbit/apps/api/src/modules/publisher/adapters/tiktok.publisher.ts

Important notes:
- These adapters follow a consistent publish result contract with success, platformPostId, platformUrl, and errorMessage.
- The system is intentionally designed so provider-specific logic is insulated behind these adapters.

### 4.5 Analytics foundation

This slice is substantially implemented and is a major milestone.

Implemented behavior:
- Real PostgreSQL metrics aggregation
- Workspace-level overview analytics
- Platform breakdown analytics
- Time-series analytics
- Top-post analysis
- CSV export generation
- Workspace-scoped protections via tRPC auth

Key files:
- Orbit/apps/api/src/modules/analytics/analytics.service.ts
- Orbit/apps/api/src/trpc/routers/analytics.ts
- Orbit/apps/web/src/app/(dashboard)/analytics/page.tsx
- Orbit/packages/db/prisma/schema.prisma

Important notes:
- Analytics queries use PostMetric rows in Prisma and aggregate by workspace and date range.
- The export format is CSV-based and is built from stored platform metrics.
- The project has already moved beyond placeholder metrics.

### 4.6 Collaboration foundation

Collaboration is implemented at the server layer and includes the core workspace/group workflow.

Implemented features:
- Team member listing and membership validation
- Invite records and acceptance flow
- Role changes and permission checks
- Seat-limit enforcement
- Approvals, assignment, comments, activity history
- Workspace activity logging

Key files:
- Orbit/apps/api/src/trpc/routers/posts.ts
- Orbit/apps/api/src/modules/workspace/workspace.service.ts
- Orbit/packages/db/prisma/schema.prisma

Important notes:
- Assignment mutations require suitable roles and validate active member membership.
- Activity logging is already part of the data model and service flow.

### 4.7 Media and calendar foundation

Media and schedule integration are partially complete and functional in the backend.

Implemented behavior:
- Workspace-scoped media operations
- Presigned upload flow and CDN asset confirmation
- Calendar query integration
- Rescheduling via API and queue re-enqueue paths

Key files:
- Orbit/apps/api/src/trpc/routers/media.ts
- Orbit/apps/api/src/modules/media/...
- Orbit/apps/api/src/modules/posts/posts.service.ts

Important notes:
- Demo workspaces still behave differently when they are not backed by real DB UUIDs.
- Real provisioned workspace flows are intended to be server-backed.

### 4.8 Browser preview and config fix

A critical startup issue was resolved in the web app.

Problem:
- The app initially failed in local dev preview because Next.js/Turbopack workspace-root inference was misconfigured.

Fix:
- Switched the web app to use webpack-based dev execution so the app could launch reliably in the current environment.

Relevant files:
- Orbit/apps/web/package.json
- Orbit/apps/web/next.config.ts

Verification result:
- Local preview rendered successfully after the fix.

## 5) What is still missing / remaining

### 5.1 Provider metric ingestion (implemented 2026-09-23, live-provider verification remains)

The ingestion pipeline is now implemented end to end with mocked-provider tests:
- Worker processor for the analytics_ingest queue (resolve PostJob, require published status, decrypt token, fetch, upsert).
- Provider-specific metric fetch adapters for Instagram, LinkedIn, X/Twitter, Facebook, and TikTok behind a shared PlatformMetricFetcher contract with normalized PlatformMetrics and explicit retryable/non-retryable failure semantics.
- PostMetric upsert through AnalyticsService.recordPostMetrics with engagement-rate normalization.

Files:
- Orbit/apps/api/src/modules/analytics/analytics-ingest.processor.ts
- Orbit/apps/api/src/modules/analytics/adapters/platform-metric-fetcher.interface.ts
- Orbit/apps/api/src/modules/analytics/adapters/{instagram,linkedin,twitter,facebook,tiktok}-metrics.fetcher.ts
- Tests: Orbit/apps/api/src/modules/analytics/analytics-ingest.processor.spec.ts (16 mocked-provider tests)

What remains for this slice:
- Verification against live provider APIs (sandbox credentials) or recorded HTTP fixtures per platform.
- Optional: follower-growth/account-level snapshot ingestion (account_snapshots equivalent) still has no ingestion path.

### 5.2 Monetization and billing (implemented 2026-09-23, live Stripe verification remains)

The monetization slice is implemented end to end with mocked-Stripe tests:
- Central entitlement service: server-side plan limits (channels, seats, AI credits) resolved from the workspace's persisted plan — never client input. Includes atomic compare-and-set credit consumption, refund-on-failure, and mid-month upgrade/downgrade allowance reconciliation.
- Stripe reconciliation: price→plan mapping from env-configured price IDs, idempotent event processing backed by a WebhookEvent ledger (replays are no-ops; handler failures are not recorded so Stripe retries), checkout activation trusting the subscription's real price over metadata, subscription lifecycle sync (active/trialing/past_due/canceled), invoice payment success → AI ledger refresh, payment failure → 7-day grace period with downgrade driven by Stripe's lifecycle.
- Billing router: real checkout/portal/cancel sessions, subscription status and AI usage queries, all behind workspace authorization (query) / mutation-role (mutation) checks. Clients can never set `plan` directly.
- AI credit race fixed: generateCaption/generateImage now reserve credits atomically via the entitlement service and refund them when the provider call fails (previously a read-modify-write that two concurrent requests could both pass).
- Seat limits hardened: previously only free-plan invites were limited and invite *acceptance* bypassed the count entirely; now both invite creation and acceptance enforce the plan's seat budget for all plans, and channel limits are enforced for new account connections (re-connects stay allowed).

Files:
- Orbit/apps/api/src/modules/billing/entitlement.service.ts (+ spec)
- Orbit/apps/api/src/modules/billing/billing.service.ts (+ spec, webhook reconciliation)
- Orbit/apps/api/src/trpc/routers/billing.ts (real Stripe-backed operations)
- Orbit/apps/api/src/modules/ai/ai.service.ts (atomic credit reservation + refund)
- Orbit/apps/api/src/modules/{workspace,social-accounts}/*.service.ts (entitlement gates)
- Orbit/packages/db/prisma/schema.prisma (WebhookEvent idempotency model; run `prisma db push` before deploying)

What remains for this slice:
- Verification with live Stripe test keys (checkout, portal, webhook signature) — code paths are covered by mocked-Stripe tests.
- Stripe Customer Portal configuration and webhook endpoint registration in the Stripe dashboard.
- Optional: proration handling for mid-cycle plan switches (currently portal-driven).

### 5.3 AI differentiation (implemented 2026-09-23, live embedding verification remains)

- Brand voice: examples embedded (OpenAI text-embedding-3-small with deterministic local fallback in @orbit/ai) and persisted to pgvector via parameterized raw SQL (the vector column is Prisma-Unsupported). Retrieval ranks by cosine distance (<=>) with recency fallback.
- Content repurposing: AiDifferentiationService.repurposePost turns any workspace post into platform-optimized variants, conditioned on retrieved brand voice; JSON parse failure falls back to truncated source.
- Performance recommendations: getRecommendations aggregates 30 days of PostMetrics, ranks platforms by engagement rate, and returns concrete actions; graceful onboarding response when no data.
- The AI tRPC router previously returned hardcoded mocks — it now wires the real AiService and AiDifferentiationService with workspace authorization and atomic credit metering on every generation.

Files:
- Orbit/packages/ai/src/embeddings.ts (+ re-export in index.ts; run `pnpm build` in packages/ai after pulling)
- Orbit/apps/api/src/modules/ai/ai-differentiation.service.ts (+ spec)
- Orbit/apps/api/src/trpc/routers/ai.ts (real implementations)

What remains for this slice:
- Verify embedding quality with a real OPENAI_API_KEY (fallback embeddings are consistent but crude).

### 5.4 Ecosystem and growth features (implemented 2026-09-23)

- Outbound webhooks: HMAC-SHA256 signed, event-filtered, concurrent dispatch with 3-attempt exponential backoff (1s/2s) and per-attempt delivery logging; new deliveries listing endpoint. The publish lifecycle now emits post.published, post.published_all, and post.failed events (non-blocking).
- Public API: existing REST v1 controllers (posts, social-accounts, analytics, workspace) now sit behind a plan-aware ApiRateLimitGuard (PLAN_LIMITS.apiRequestsPerMin via Redis sliding window, standard rate-limit headers, fail-open on Redis outage).
- API key management: platform router mints sk_live_… keys (SHA-256 hashed, raw key shown once), lists, and revokes them; API access gated to pro/agency/enterprise via assertFeature.
- Content templates: new ContentTemplate Prisma model (workspace-private + global defaults with usageCount); list/create/delete/use exposed through the platform router, plus an idempotent global seed library (`pnpm --filter @orbit/db db:seed:templates`).
- White-label reports: gated behind agency/enterprise entitlement.
- Dashboard UI: the developer settings page is now backed by the real platform router (API keys with show-once copy, webhooks with per-webhook delivery-log viewer); a new Templates settings page covers the template library. Procedure names in the platform router are flat (webhooksList, apiKeysCreate, templatesList) to keep AppRouter inference shallow for the web app's cross-package type import.

Files:
- Orbit/apps/api/src/modules/webhooks/webhooks.service.ts (+ spec, retries)
- Orbit/apps/api/src/modules/public-api/api-rate-limit.guard.ts, public-api.module.ts
- Orbit/apps/api/src/trpc/routers/platform.ts
- Orbit/packages/db/prisma/schema.prisma (ContentTemplate) + prisma/seed-templates.ts
- Orbit/apps/web/src/app/(dashboard)/settings/developer/page.tsx (real backend)
- Orbit/apps/web/src/app/(dashboard)/settings/templates/page.tsx (new)

### 5.4 Ecosystem and growth features

These are later-stage product features and not yet the priority.

Planned work:
- Webhooks
- Public API and SDK exposure
- Content library / templates
- CRM-lite workflows
- White-label features

### 5.5 Production hardening status

Done (2026-09-23):
- Request correlation IDs (X-Request-ID middleware, honored from upstream) + structured access logging with latency; LOG_FORMAT=json for log shippers.
- Fixed the pre-existing analytics dashboard type error (AnalyticsSeriesPoint made platform-shape tolerant).
- Ecosystem dashboard UI wired to the real backend (developer + templates pages).

Still needed before a real launch:
- Live sandbox verification: Stripe test mode (checkout, portal, webhook signature), provider metric fetchers, embedding quality with real keys.
- End-to-end DB validation against a real PostgreSQL (prisma db push for WebhookEvent + ContentTemplate).
- Queue dead-letter alerting and operational runbooks.
- Permission validation coverage across all mutation paths (audit-level).

## 6) Key architectural patterns to preserve

### 6.1 Queue architecture

BullMQ is used with multiple named queues:
- post_schedule
- post_publish
- post_notify
- analytics_ingest
- token_refresh
- media_process

The important queue behavior:
- post_publish handles actual social publication
- analytics_ingest is intentionally scheduled after successful publish to collect engagement stats

### 6.2 Workspace authorization pattern

Every protected route must call an authorization function before acting on workspace-scoped data.

Pattern:
- use trpc.authorizeWorkspace(...) for reads
- use trpc.authorizeWorkspaceMutation(...) for writes

This pattern is essential and should be preserved for all future API work.

### 6.3 Adapter pattern

Provider integrations should stay behind platform-specific adapters and not leak raw social API logic into generic service code.

This is important for:
- testability
- platform swapping
- provider-specific failure handling

### 6.4 Data-model-first engineering

The database schema in Prisma defines the source of truth for much of the SaaS logic.

Core models of interest:
- User
- Workspace
- TeamMember
- SocialAccount
- Post
- PostJob
- MediaFile
- PostMetric
- ActivityLog

## 7) Important implementation decisions already made

- Clerk auth is treated as the identity source.
- Workspaces are treated as the security boundary.
- Social account access tokens are encrypted before persistence.
- Post publication is asynchronous via queue workers.
- Analytics is stored in the DB and not left as client-side mock data.
- Browser preview issues were resolved by switching the web app away from the problematic Turbopack dev mode.

## 8) Verification history

Latest verified evidence (2026-09-23):
- Command run:
  `cd "F:\Projects\ORRR\Orbit\apps\api"; pnpm vitest run`
- Result:
  - 9 test files passed
  - 45 tests passed
  - 0 failed
- `npx tsc --noEmit` in apps/api is clean.

This confirms the analytics service, the new ingest processor, and all metric fetcher adapters are green alongside the existing suites.

## 9) What the next agent should do next

The next agent should continue with the following priorities in order:

1. Live sandbox verification: Stripe test mode (checkout, portal, webhook signature), provider metric fetchers, and embedding quality with real keys.
2. Deploy prerequisites: `prisma db push` (WebhookEvent, ContentTemplate), `pnpm --filter @orbit/db db:seed:templates`, `pnpm build` in packages/ai.
3. Operational hardening: queue dead-letter alerting, dashboards, and runbooks.

## 10) Short operational summary

If another coding agent needs the shortest possible summary, use this:

Orbit is a real monorepo SaaS platform with workspace-bound backend auth, encrypted social tokens, scheduled publishing, analytics ingestion, team collaboration, Stripe-backed billing with plan entitlements, AI brand voice/repurposing/recommendations, signed outbound webhooks with retries, a rate-limited public REST API, content templates (seeded global library + dashboard UI), and request-correlated structured logging. The app is feature-complete and roughly 97% done — remaining work is live sandbox verification and operational hardening. Preserve the workspace-scoping and adapter patterns, and enforce entitlements through the EntitlementService.
