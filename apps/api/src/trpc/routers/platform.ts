import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { TrpcService } from "../trpc.service";
import { prisma } from "@orbit/db";
import { EntitlementService } from "../../modules/billing/entitlement.service";
import { WebhooksService } from "../../modules/webhooks/webhooks.service";

const WebhookEventList = z.array(z.string().min(1)).min(1);

/**
 * Platform router — P5 ecosystem features. Procedure names are intentionally
 * flat (webhooksCreate instead of webhooks.create) to keep the AppRouter
 * type shallow for the web app's cross-package type inference.
 *
 *  - Outbound webhook management (+ delivery logs)
 *  - API key management for the public REST API
 *  - Content templates (workspace-private + global defaults)
 *  - White-label reports (agency/enterprise gate)
 */
export function createPlatformRouter(
  trpc: TrpcService,
  entitlements: EntitlementService,
  webhooksService: WebhooksService,
) {
  return trpc.router({
    // ── Webhooks ──────────────────────────────────────────────────
    webhooksCreate: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          url: z.string().url(),
          events: WebhookEventList,
        })
      )
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        return webhooksService.createWebhook(input.workspaceId, {
          url: input.url,
          events: input.events,
        });
      }),

    webhooksList: trpc.protectedProcedure
      .input(z.object({ workspaceId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return webhooksService.listWebhooks(input.workspaceId);
      }),

    webhooksDelete: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          webhookId: z.string().uuid(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        return webhooksService.deleteWebhook(input.workspaceId, input.webhookId);
      }),

    webhooksDeliveries: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          webhookId: z.string().uuid(),
          limit: z.number().int().min(1).max(100).default(20),
        })
      )
      .query(async ({ ctx, input }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return webhooksService.listDeliveries(
          input.workspaceId,
          input.webhookId,
          input.limit,
        );
      }),

    // ── API keys ──────────────────────────────────────────────────
    apiKeysCreate: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          name: z.string().min(1).max(100),
          expiresInDays: z.number().int().min(1).max(365).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        // API access is a paid-plan feature.
        await entitlements.assertFeature("apiAccess", input.workspaceId);

        // sk_live_<24 random bytes hex>; only the hash is persisted.
        const rawKey = `sk_live_${randomBytes(24).toString("hex")}`;
        const keyHash = createHash("sha256").update(rawKey).digest("hex");
        const keyPrefix = rawKey.slice(0, 12);

        const apiKey = await prisma.apiKey.create({
          data: {
            workspaceId: input.workspaceId,
            name: input.name,
            keyPrefix,
            keyHash,
            expiresAt: input.expiresInDays
              ? new Date(Date.now() + input.expiresInDays * 86400000)
              : null,
          },
        });

        // The raw key is returned exactly once — it cannot be recovered.
        return {
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix,
          key: rawKey,
          expiresAt: apiKey.expiresAt,
          createdAt: apiKey.createdAt,
        };
      }),

    apiKeysList: trpc.protectedProcedure
      .input(z.object({ workspaceId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return prisma.apiKey.findMany({
          where: { workspaceId: input.workspaceId },
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            lastUsedAt: true,
            expiresAt: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });
      }),

    apiKeysRevoke: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          keyId: z.string().uuid(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        const key = await prisma.apiKey.findUnique({ where: { id: input.keyId } });
        if (!key || key.workspaceId !== input.workspaceId) {
          throw new Error("API key not found");
        }
        await prisma.apiKey.update({
          where: { id: input.keyId },
          data: { isActive: false },
        });
        return { success: true };
      }),

    // ── Content templates ─────────────────────────────────────────
    templatesList: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          category: z.string().min(1).optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return prisma.contentTemplate.findMany({
          where: {
            OR: [{ workspaceId: input.workspaceId }, { workspaceId: null }],
            ...(input.category ? { category: input.category } : {}),
          },
          orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
        });
      }),

    templatesCreate: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          name: z.string().min(1).max(120),
          description: z.string().max(500).optional(),
          category: z.string().min(1).max(40).default("general"),
          content: z.string().min(1),
          platforms: z.array(z.string()).default([]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        return prisma.contentTemplate.create({
          data: {
            workspaceId: input.workspaceId,
            name: input.name,
            description: input.description,
            category: input.category,
            content: input.content,
            platforms: input.platforms,
          },
        });
      }),

    templatesDelete: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          templateId: z.string().uuid(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        const template = await prisma.contentTemplate.findUnique({
          where: { id: input.templateId },
        });
        if (!template || template.workspaceId !== input.workspaceId) {
          throw new Error("Template not found");
        }
        await prisma.contentTemplate.delete({ where: { id: input.templateId } });
        return { success: true };
      }),

    templatesUse: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          templateId: z.string().uuid(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        const template = await prisma.contentTemplate.findFirst({
          where: {
            id: input.templateId,
            OR: [{ workspaceId: input.workspaceId }, { workspaceId: null }],
          },
        });
        if (!template) {
          throw new Error("Template not found");
        }
        return prisma.contentTemplate.update({
          where: { id: template.id },
          data: { usageCount: { increment: 1 } },
        });
      }),

    // ── White-label reports (agency/enterprise) ────────────────────
    whiteLabelReport: trpc.protectedProcedure
      .input(z.object({ workspaceId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        // Gate first — eligible plans only.
        await entitlements.assertFeature("whiteLabelReports", input.workspaceId);
        return { eligible: true };
      }),
  });
}
