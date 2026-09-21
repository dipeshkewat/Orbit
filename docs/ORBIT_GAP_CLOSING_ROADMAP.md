# Orbit Gap-Closing Roadmap

Status date: 2026-09-21

This roadmap converts the audit into implementation slices. Each slice must have
passing focused tests before the next slice begins. The first milestone is a
production foundation pass because every feature currently depends on trusted
identity and workspace isolation.

## Priority Order

1. **P0 Foundation and publishing vertical slice**
   - Verify Clerk identity at the API boundary and remove placeholder identities.
   - Resolve the authenticated user's database identity and workspace membership server-side.
   - Centralize workspace authorization for tRPC procedures.
   - Make post create, list, update, schedule, and delete database-backed and workspace-scoped.
   - Add the first post lifecycle tests, including cross-workspace denial.
2. **P0 Social account connections and publishing reliability**
   - Implement launch-platform OAuth callbacks and encrypted token storage.
   - Add platform account validation, post jobs, idempotent publishing adapters, retries, and failure recovery.
   - Replace local onboarding connections with server-backed account state.
3. **P0 Media and calendar completion**
   - Add validated private uploads, processing states, platform variants, and workspace-scoped media operations.
   - Connect calendar queries and drag/drop rescheduling to the API with optimistic rollback.
4. **P1 Collaboration**
   - Complete invitations, role permissions, approvals, comments, assignments, notifications, and activity history.
5. **P2 Analytics**
   - Ingest platform metrics, query accurate workspace-scoped data, and ship reporting/export states.
6. **P3 Monetization**
   - Reconcile Stripe subscriptions through verified webhooks, enforce entitlements, meter AI credits, and complete billing recovery.
7. **P4 AI differentiation**
   - Ship provider-backed brand voice, repurposing, multi-channel variants, and performance-based recommendations.
8. **P5 Ecosystem and growth**
   - Complete outbound/inbound webhooks, public API/SDK, content library/templates, CRM-lite, and white-label workflows.

## Delivery Rules

- One vertical slice at a time, with unit and integration coverage for the changed behavior.
- No UI claim is considered shipped until it reads and writes the server-backed contract.
- Every tenant-owned read and mutation must prove workspace membership in the same request path.
- Provider integrations remain behind adapters so local tests do not require live social, Stripe, or AI credentials.
- Do not add Temporal, ClickHouse, or another paid service until the first slice has a trusted database and authorization boundary.

## Current Status

- **P0 foundation and publishing vertical slice:** substantially implemented. Clerk
   identity, workspace authorization, transactional post/job creation, delayed queueing,
   and scoped post operations are live in the API path.
- **P0 social account connections and publishing reliability:** substantially
   implemented for the current Meta/LinkedIn adapter surface. OAuth state is signed and
   one-time through Redis, tokens are encrypted, publisher claims are idempotent, and
   retry/final-failure states are explicit. Live provider integration tests remain.
- **P0 media and calendar:** API foundation implemented. Media tRPC calls now use the
   workspace-scoped R2 service, calendar reads require membership, and rescheduling
   enqueues the publishing job. The web calendar now uses these server-backed procedures
   for valid provisioned workspaces, with explicit loading/error states; demo-only
   workspaces still use local preview data because their IDs are not backend UUIDs.
- **Composer integration:** valid provisioned workspaces now load server accounts, upload
   media through presigned URLs, confirm CDN assets, and create persisted scheduled posts.
   Demo workspaces retain local preview behavior until real workspace provisioning replaces
   the mock auth store.
- **P1 collaboration foundation:** team member listing, invite records, role changes, member
   removal, signed invite acceptance, seat-limit enforcement, approvals, comments, post
   assignments, and workspace activity history are now workspace-scoped server operations.
   Assignment mutations require owner/admin access, validate active members, and atomically
   record audit events. Richer collaboration UI and notification delivery remain pending.
- **P2 analytics:** workspace overview aggregation, platform breakdown, and top-post queries
   now use the real PostgreSQL metrics service through authorized tRPC procedures. The
   analytics dashboard summary cards, monthly reach chart, platform spread, and top-post
   table and CSV export consume those server-backed results. Follower growth and live
   provider metric ingestion remain.

The next active implementation slice is provider metric ingestion, followed by integration
tests against a test database and mocked provider APIs.