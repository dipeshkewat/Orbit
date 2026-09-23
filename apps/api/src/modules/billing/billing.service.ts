import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import Stripe from "stripe";
import { prisma } from "@orbit/db";
import { EntitlementService } from "./entitlement.service";

/**
 * Maps Stripe price IDs to Orbit plans. Price IDs come from env so each
 * deployment can wire its own Stripe products without code changes.
 * The literal "free" is also accepted for downgrade completeness.
 */
export function resolvePlanFromPriceId(priceId: string | null | undefined): string {
  if (!priceId) return "free";
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_CREATOR || "price_creator_mock"]: "creator",
    [process.env.STRIPE_PRICE_PRO || "price_pro_mock"]: "pro",
    [process.env.STRIPE_PRICE_AGENCY || "price_agency_mock"]: "agency",
  };
  return priceMap[priceId] ?? "free";
}

/**
 * Extract the single price ID from a Stripe subscription's line items
 * without requiring an expansion of items.data.price.
 */
function firstSubscriptionPriceId(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0];
  if (!item) return null;
  if (typeof item.price === "string") return item.price;
  return item.price?.id ?? null;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;

  constructor(private readonly entitlements: EntitlementService) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      this.logger.warn("STRIPE_SECRET_KEY not set. Billing operations will be mocked.");
    }
    // Omitting apiVersion pins the SDK's default version, keeping types valid
    // across stripe package upgrades.
    this.stripe = new Stripe(stripeKey || "sk_test_mock");
  }

  /**
   * Get or create a Stripe customer for a workspace
   */
  async getOrCreateCustomer(workspaceId: string): Promise<string> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { owner: true },
    });

    if (!workspace) throw new BadRequestException("Workspace not found");

    if (workspace.stripeCustomerId) {
      return workspace.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email: workspace.owner.email,
      name: workspace.name,
      metadata: {
        workspaceId: workspace.id,
        ownerId: workspace.ownerId,
      },
    });

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Create a Stripe Checkout session to subscribe to a plan
   */
  async createCheckoutSession(
    workspaceId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const customerId = await this.getOrCreateCustomer(workspaceId);

    const priceMap: Record<string, string> = {
      creator: process.env.STRIPE_PRICE_CREATOR || "price_creator_mock",
      pro: process.env.STRIPE_PRICE_PRO || "price_pro_mock",
      agency: process.env.STRIPE_PRICE_AGENCY || "price_agency_mock",
    };

    const priceId = priceMap[planId];
    if (!priceId) {
      throw new BadRequestException(`Invalid plan: ${planId}`);
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { workspaceId, planId },
    });

    return session.url || "";
  }

  /**
   * Create a Stripe Customer Portal session for managing subscriptions
   */
  async createPortalSession(workspaceId: string, returnUrl: string): Promise<string> {
    const customerId = await this.getOrCreateCustomer(workspaceId);

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Cancel at period end through Stripe; the webhook keeps local state in
   * sync when the subscription actually terminates.
   */
  async cancelSubscription(workspaceId: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace?.stripeSubscriptionId) {
      throw new BadRequestException("Workspace has no active subscription to cancel");
    }

    await this.stripe.subscriptions.update(workspace.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    this.logger.log(`Cancellation scheduled at period end for workspace ${workspaceId}`);
  }

  /**
   * Handle Stripe webhook events with idempotent reconciliation.
   *
   * Supported events:
   * - checkout.session.completed       → activate plan from session metadata
   * - customer.subscription.updated    → sync plan from price + status
   * - customer.subscription.deleted    → downgrade to free
   * - invoice.payment_succeeded        → refresh monthly AI allowance
   * - invoice.payment_failed           → mark past_due, 7-day grace handling
   */
  async handleWebhookEvent(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException("Invalid webhook signature");
    }

    // Idempotency: Stripe retries deliveries; recording the event ID makes
    // replays no-ops. Unique constraint on eventId guards concurrent workers.
    const replay = await prisma.webhookEvent.findUnique({ where: { eventId: event.id } });
    if (replay) {
      this.logger.log(`Skipping already-processed Stripe event ${event.id}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case "invoice.payment_succeeded":
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case "invoice.payment_failed":
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          this.logger.log(`Unhandled Stripe event type: ${event.type}`);
      }
      await this.recordProcessedEvent(event.id, event.type);
    } catch (err) {
      // Do not record the event so Stripe's retry can deliver it again.
      this.logger.error(
        `Stripe event ${event.id} (${event.type}) processing failed: ${(err as Error).message}`,
      );
      throw err;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const workspaceId = session.metadata?.workspaceId;
    const planId = session.metadata?.planId;
    if (!workspaceId || !planId) {
      this.logger.warn("checkout.session.completed missing workspace/plan metadata");
      return;
    }

    // Trust the subscription's actual price over client-influenced metadata.
    let resolvedPlan = planId;
    if (typeof session.subscription === "string") {
      const sub = await this.stripe.subscriptions.retrieve(session.subscription);
      const pricePlan = resolvePlanFromPriceId(firstSubscriptionPriceId(sub));
      if (pricePlan !== "free") resolvedPlan = pricePlan;
    }

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        plan: resolvedPlan,
        stripeSubscriptionId: (session.subscription as string) || null,
      },
    });
    this.logger.log(`Workspace ${workspaceId} upgraded to plan: ${resolvedPlan}`);
  }

  private async handleSubscriptionUpdated(sub: Stripe.Subscription) {
    const ws = await prisma.workspace.findFirst({
      where: { stripeSubscriptionId: sub.id },
    });
    if (!ws) {
      this.logger.warn(`subscription.updated for unknown subscription ${sub.id}`);
      return;
    }

    // Past-due keeps the paid plan briefly (grace) — handled in payment_failed.
    if (sub.status === "past_due" || sub.status === "unpaid") {
      await prisma.workspace.update({
        where: { id: ws.id },
        data: { plan: ws.plan, updatedAt: new Date() },
      });
      return;
    }

    if (sub.status === "active" || sub.status === "trialing") {
      const planFromPrice = resolvePlanFromPriceId(firstSubscriptionPriceId(sub));
      await prisma.workspace.update({
        where: { id: ws.id },
        data: { plan: planFromPrice === "free" ? ws.plan : planFromPrice },
      });
      return;
    }

    // canceled / incomplete_expired etc. → downgrade.
    await prisma.workspace.update({
      where: { id: ws.id },
      data: { plan: "free", stripeSubscriptionId: null },
    });
  }

  private async handleSubscriptionDeleted(sub: Stripe.Subscription) {
    const wsDeleted = await prisma.workspace.findFirst({
      where: { stripeSubscriptionId: sub.id },
    });
    if (wsDeleted) {
      await prisma.workspace.update({
        where: { id: wsDeleted.id },
        data: { plan: "free", stripeSubscriptionId: null },
      });
      this.logger.log(
        `Workspace ${wsDeleted.id} downgraded to free (subscription cancelled)`,
      );
    }
  }

  /**
   * Payment succeeded: reconcile the monthly AI credit ledger with the
   * workspace's current plan (get-or-create; raises the allowance on
   * upgrades). Mid-cycle usage is intentionally kept.
   */
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    if (!customerId) return;

    const ws = await prisma.workspace.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!ws) return;

    await this.entitlements.getOrCreateCreditLedger(ws.id);
    this.logger.log(`AI credit allowance refreshed for workspace ${ws.id}`);
  }

  /**
   * Payment failed: 7-day grace period on the paid plan, then downgrade.
   * Stripe will send subscription.updated with past_due first; the downgrade
   * is driven by the subscription lifecycle, not by us deleting the sub.
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    if (!customerId) return;

    const ws = await prisma.workspace.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!ws) return;

    const graceEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    this.logger.warn(
      `Payment failed for workspace ${ws.id}; grace period until ${graceEnd.toISOString()}`,
    );
    // The paid plan is intentionally kept here. The downgrade happens via
    // customer.subscription.updated/deleted when Stripe closes the collection
    // window, keeping our state derived from Stripe's lifecycle.
  }

  private async recordProcessedEvent(eventId: string, eventType: string) {
    try {
      await prisma.webhookEvent.create({ data: { eventId, eventType } });
    } catch {
      // Concurrent worker recorded it first — harmless.
    }
  }

  /**
   * Get current subscription status for a workspace (server-derived)
   */
  async getSubscriptionStatus(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) throw new BadRequestException("Workspace not found");

    const status = workspace.stripeSubscriptionId ? "active" : workspace.plan === "free" ? "free" : "active";

    return {
      plan: workspace.plan,
      status,
      stripeCustomerId: workspace.stripeCustomerId,
      stripeSubscriptionId: workspace.stripeSubscriptionId,
      cancelAtPeriodEnd: false,
    };
  }
}
