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

    const matchingWebhooks = webhooks.filter((w: { events: string[] }) =>
      w.events.includes(eventType) || w.events.includes("*")
    );

    await Promise.all(
      matchingWebhooks.map((webhook) =>
        this.deliverWithRetries(webhook, eventType, payload),
      ),
    );
  }

  /**
   * Deliver an event with up to MAX_ATTEMPTS tries and exponential backoff
   * (1s, 2s, 4s). A delivery succeeds on any 2xx response; 4xx/5xx and
   * network failures are retried. Every attempt is recorded on the final
   * delivery log row.
   */
  private async deliverWithRetries(
    webhook: { id: string; url: string; secretHash: string },
    eventType: string,
    payload: Record<string, any>,
    maxAttempts = 3,
  ) {
    const body = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const signature = crypto
      .createHmac("sha256", webhook.secretHash)
      .update(body)
      .digest("hex");

    let lastError = "";
    let lastCode = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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

        if (response.ok) {
          await prisma.webhookDelivery.create({
            data: {
              webhookId: webhook.id,
              event: eventType,
              payload: JSON.parse(body),
              status: "success",
              responseCode: response.status,
              responseBody: await response.text().catch(() => ""),
              attempts: attempt,
              deliveredAt: new Date(),
            },
          });
          this.logger.log(
            `Webhook ${webhook.id} dispatched ${eventType}: ${response.status} (attempt ${attempt})`,
          );
          return;
        }

        lastCode = response.status;
        lastError = await response.text().catch(() => "");
      } catch (err) {
        lastCode = 0;
        lastError = (err as Error).message;
      }

      // Backoff before the next attempt (skip after the final one).
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
      }
    }

    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: eventType,
        payload: JSON.parse(body),
        status: "failed",
        responseCode: lastCode,
        responseBody: lastError.slice(0, 2000),
        attempts: maxAttempts,
      },
    });

    this.logger.error(
      `Webhook ${webhook.id} dispatch failed after ${maxAttempts} attempts for ${eventType}: ${lastError}`,
    );
  }

  /**
   * List recent deliveries for a workspace's webhook (for the dashboard).
   * Scalar fields only: the JSON payload column is excluded both because
   * the UI never renders it and because Prisma's recursive Json type breaks
   * tRPC inference in the web app's cross-package type import.
   */
  async listDeliveries(workspaceId: string, webhookId: string, limit = 20) {
    const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook || webhook.workspaceId !== workspaceId) {
      throw new Error("Webhook not found");
    }
    return prisma.webhookDelivery.findMany({
      where: { webhookId },
      select: {
        id: true,
        event: true,
        status: true,
        responseCode: true,
        responseBody: true,
        attempts: true,
        deliveredAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
    });
  }
}
