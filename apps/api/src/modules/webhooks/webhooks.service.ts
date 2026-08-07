import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";
import { prisma } from "@orbit/db";

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  /**
   * Register a new outbound webhook for a workspace
   */
  async createWebhook(workspaceId: string, data: { url: string; events: string[] }) {
    // Generate HMAC secret
    const secret = crypto.randomBytes(32).toString("hex");
    const secretHash = crypto.createHash("sha256").update(secret).digest("hex");

    const webhook = await prisma.webhook.create({
      data: {
        workspaceId,
        url: data.url,
        events: data.events,
        secretHash,
        isActive: true,
      },
    });

    // Return secret only once at creation time
    return {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      secret, // shown only once
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
    };
  }

  /**
   * List webhooks for a workspace (secret is NOT returned)
   */
  async listWebhooks(workspaceId: string) {
    return prisma.webhook.findMany({
      where: { workspaceId },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(workspaceId: string, webhookId: string) {
    const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook || webhook.workspaceId !== workspaceId) {
      throw new Error("Webhook not found");
    }
    await prisma.webhook.delete({ where: { id: webhookId } });
    return { success: true };
  }

  /**
   * Dispatch an event to all matching webhooks for a workspace.
   * Signs the payload with HMAC-SHA256 for verification.
   */
  async dispatchEvent(workspaceId: string, eventType: string, payload: Record<string, any>) {
    const webhooks = await prisma.webhook.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
    });

    const matchingWebhooks = webhooks.filter((w) =>
      (w.events as string[]).includes(eventType) || (w.events as string[]).includes("*")
    );

    for (const webhook of matchingWebhooks) {
      const body = JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      });

      const signature = crypto
        .createHmac("sha256", webhook.secretHash)
        .update(body)
        .digest("hex");

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Orbit-Signature": `sha256=${signature}`,
            "X-Orbit-Event": eventType,
          },
          body,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event: eventType,
            payload: JSON.parse(body),
            status: "success",
            responseCode: response.status,
            responseBody: await response.text().catch(() => ""),
            attempts: 1,
            deliveredAt: new Date(),
          },
        });

        this.logger.log(`Webhook ${webhook.id} dispatched ${eventType}: ${response.status}`);
      } catch (err) {
        await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event: eventType,
            payload: JSON.parse(body),
            status: "failed",
            responseCode: 0,
            responseBody: (err as Error).message,
            attempts: 1,
          },
        });

        this.logger.error(
          `Webhook ${webhook.id} dispatch failed for ${eventType}: ${(err as Error).message}`
        );
      }
    }
  }
}
