import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import Stripe from "stripe";
import { prisma } from "@socialsphear/db";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      this.logger.warn("STRIPE_SECRET_KEY not set. Billing operations will be mocked.");
    }
    this.stripe = new Stripe(stripeKey || "sk_test_mock", {
      apiVersion: "2025-02-24.acacia",
    });
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
   * Handle Stripe webhook events (checkout.session.completed, subscription updates, etc.)
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

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspaceId;
        const planId = session.metadata?.planId;
        if (workspaceId && planId) {
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
              plan: planId,
              stripeSubscriptionId: (session.subscription as string) || null,
            },
          });
          this.logger.log(`Workspace ${workspaceId} upgraded to plan: ${planId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const ws = await prisma.workspace.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (ws) {
          const status = sub.status === "active" ? ws.plan : "free";
          await prisma.workspace.update({
            where: { id: ws.id },
            data: { plan: status },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as Stripe.Subscription;
        const wsDeleted = await prisma.workspace.findFirst({
          where: { stripeSubscriptionId: deletedSub.id },
        });
        if (wsDeleted) {
          await prisma.workspace.update({
            where: { id: wsDeleted.id },
            data: { plan: "free", stripeSubscriptionId: null },
          });
          this.logger.log(`Workspace ${wsDeleted.id} downgraded to free (subscription cancelled)`);
        }
        break;
      }

      default:
        this.logger.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  /**
   * Get current subscription status for a workspace
   */
  async getSubscriptionStatus(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) throw new BadRequestException("Workspace not found");

    return {
      plan: workspace.plan,
      stripeCustomerId: workspace.stripeCustomerId,
      stripeSubscriptionId: workspace.stripeSubscriptionId,
    };
  }
}
