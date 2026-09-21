# P0 Foundation Design Note

## Goal

Turn the post path into the first trustworthy Orbit vertical slice: an authenticated
user can create and manage posts only inside a workspace where they are a member.
Scheduling records a real lifecycle state and returns the updated post. Publishing
workers and platform adapters remain the next P0 slice; this note deliberately does
not pretend that scheduling alone publishes to a social network.

## Schema and Ownership

- Use the existing `User`, `Workspace`, `TeamMember`, `Post`, and `PostJob` models.
- Resolve a Clerk subject to `User.clerkId`; do not trust a client-supplied user ID.
- Authorize every post operation through an existing `TeamMember` row for the target workspace.
- Keep all post reads and mutations filtered by `workspaceId` in the same Prisma query.
- Use explicit Prisma `select`/`include` projections for list and calendar responses.
- No schema migration is required for this first slice unless implementation reveals a missing constraint.

## API Surface

The existing tRPC names remain stable:

- `posts.create`
- `posts.getByWorkspace`
- `posts.getCalendar`
- `posts.update`
- `posts.delete`
- `posts.schedule`
- `posts.duplicate`

Each procedure follows this order: Zod input validation, authenticated identity
resolution, workspace membership/role authorization, service operation, typed output.
Entity-not-found and cross-workspace access use the same non-disclosing not-found
error where appropriate. Mutations return the updated entity rather than a success
boolean.

## UI States

The existing composer and calendar may continue rendering local data during the
transition, but the first integration must explicitly support loading, error, empty,
and success states. A failed mutation must leave the local draft/calendar unchanged
or roll back an optimistic change. The UI must not display a successful schedule toast
until the API has returned the persisted post.

## Tests

- Authenticated member can create a post in their workspace.
- Authenticated member can read only posts from their workspace.
- A member cannot update, delete, duplicate, or schedule a post from another workspace.
- An unauthenticated request is rejected before Prisma access.
- Scheduling returns the persisted post with `status: "scheduled"` and the requested timestamp.
- Invalid UUIDs, dates, empty content, and unsupported platform values are rejected by Zod.

## Deferred From This Note

Real Clerk token verification, OAuth callbacks, token encryption, BullMQ/Temporal
workers, platform API calls, media processing, analytics ingestion, and Stripe
reconciliation are separate slices. They must not be represented as successful mock
responses in the P0 implementation.