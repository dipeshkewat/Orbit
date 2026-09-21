import { z } from "zod";

// ─── Platform Enum ────────────────────────────────────────────
export const PlatformSchema = z.enum([
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "tiktok",
  "pinterest",
  "youtube",
  "google_business",
  "threads",
  "bluesky",
]);
export type Platform = z.infer<typeof PlatformSchema>;

// ─── Post Status ──────────────────────────────────────────────
export const PostStatusSchema = z.enum([
  "draft",
  "scheduled",
  "queued",
  "publishing",
  "published",
  "retrying",
  "failed",
  "cancelled",
]);
export type PostStatus = z.infer<typeof PostStatusSchema>;

// ─── Approval Status ─────────────────────────────────────────
export const ApprovalStatusSchema = z.enum([
  "none",
  "pending",
  "approved",
  "rejected",
]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

// ─── Team Roles ──────────────────────────────────────────────
export const TeamRoleSchema = z.enum(["owner", "admin", "editor", "viewer"]);
export type TeamRole = z.infer<typeof TeamRoleSchema>;

// ─── Invite Status ───────────────────────────────────────────
export const InviteStatusSchema = z.enum(["pending", "accepted", "expired"]);
export type InviteStatus = z.infer<typeof InviteStatusSchema>;

// ─── Social Account Status ───────────────────────────────────
export const AccountStatusSchema = z.enum([
  "active",
  "expiring",
  "disconnected",
  "error",
]);
export type AccountStatus = z.infer<typeof AccountStatusSchema>;

// ─── Plan Tiers ──────────────────────────────────────────────
export const PlanSchema = z.enum([
  "free",
  "creator",
  "pro",
  "agency",
  "enterprise",
]);
export type Plan = z.infer<typeof PlanSchema>;

// ─── Plan Limits ─────────────────────────────────────────────
export const PLAN_LIMITS: Record<
  Plan,
  {
    channels: number;
    teamMembers: number;
    aiCredits: number;
    apiRequestsPerMin: number;
  }
> = {
  free: { channels: 3, teamMembers: 1, aiCredits: 20, apiRequestsPerMin: 0 },
  creator: {
    channels: 10,
    teamMembers: 3,
    aiCredits: 200,
    apiRequestsPerMin: 100,
  },
  pro: {
    channels: 25,
    teamMembers: Infinity,
    aiCredits: 1000,
    apiRequestsPerMin: 500,
  },
  agency: {
    channels: 100,
    teamMembers: Infinity,
    aiCredits: 5000,
    apiRequestsPerMin: 2000,
  },
  enterprise: {
    channels: Infinity,
    teamMembers: Infinity,
    aiCredits: Infinity,
    apiRequestsPerMin: Infinity,
  },
};

// ─── AI Tone ─────────────────────────────────────────────────
export const AiToneSchema = z.enum([
  "professional",
  "casual",
  "witty",
  "inspirational",
  "educational",
]);
export type AiTone = z.infer<typeof AiToneSchema>;

// ─── Character Limits per Platform ───────────────────────────
export const PLATFORM_CHAR_LIMITS: Record<Platform, number> = {
  instagram: 2200,
  facebook: 63206,
  twitter: 280,
  linkedin: 3000,
  tiktok: 2200,
  pinterest: 500,
  youtube: 5000,
  google_business: 1500,
  threads: 500,
  bluesky: 300,
};

// ─── Post Creation Schema ────────────────────────────────────
export const CreatePostSchema = z.object({
  workspaceId: z.string().uuid(),
  content: z.string().min(1, "Content is required"),
  platforms: z.array(PlatformSchema).min(1, "Select at least one platform"),
  socialAccountIds: z.array(z.string().uuid()).min(1),
  scheduledAt: z.string().datetime().optional(),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  platformOverrides: z
    .record(PlatformSchema, z.object({ content: z.string() }))
    .optional()
    .default({}),
});
export type CreatePostInput = z.infer<typeof CreatePostSchema>;

// ─── AI Caption Request Schema ───────────────────────────────
export const GenerateCaptionSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  platforms: z.array(PlatformSchema).min(1),
  tone: AiToneSchema,
  language: z.string().default("en"),
  includeHashtags: z.boolean().default(true),
  brandVoice: z.boolean().default(false),
});
export type GenerateCaptionInput = z.infer<typeof GenerateCaptionSchema>;

// ─── Webhook Event Types ─────────────────────────────────────
export const WebhookEventSchema = z.enum([
  "post.scheduled",
  "post.published",
  "post.failed",
  "post.cancelled",
  "account.token_expiring",
  "account.disconnected",
  "approval.requested",
  "approval.approved",
  "approval.rejected",
]);
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// ─── API Standard Response ───────────────────────────────────
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    request_id: string;
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
  };
  meta: {
    request_id: string;
    timestamp: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Pagination ──────────────────────────────────────────────
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});
export type PaginationInput = z.infer<typeof PaginationSchema>;

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  totalCount?: number;
}
