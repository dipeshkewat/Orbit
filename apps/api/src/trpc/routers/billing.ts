import { z } from "zod";
import { TrpcService } from "../trpc.service";
import { PlanSchema } from "@orbit/types";
import { BillingService } from "../../modules/billing/billing.service";
import { EntitlementService } from "../../modules/billing/entitlement.service";

const WorkspaceInput = z.object({ workspaceId: z.string().uuid() });

const DEFAULT_APP_URL = process.env.APP_URL || "http://localhost:3000";

/**
 * Billing router — the only place clients interact with subscription state.
 * All plan mutations flow through Stripe (checkout / portal / webhooks);
 * clients can never set `plan` directly. Every procedure authorizes the
 * caller against the workspace before touching billing state.
 */
export function createBillingRouter(
  trpc: TrpcService,
  billingService: BillingService,
  entitlementService: EntitlementService
) {
  return trpc.router({
    getPlans: trpc.publicProcedure.query(async () => {
      return [
        { id: "free", name: "Free", price: 0, channels: 3, aiCredits: 20 },
        { id: "creator", name: "Creator", price: 19, channels: 10, aiCredits: 200 },
        { id: "pro", name: "Pro", price: 49, channels: 25, aiCredits: 1000 },
        { id: "agency", name: "Agency", price: 99, channels: 100, aiCredits: 5000 },
      ];
    }),

    getSubscription: trpc.protectedProcedure
      .input(WorkspaceInput)
      .query(async ({ ctx, input }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return billingService.getSubscriptionStatus(input.workspaceId);
      }),

    getUsage: trpc.protectedProcedure
      .input(WorkspaceInput)
      .query(async ({ ctx, input }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        const ledger = await entitlementService.getOrCreateCreditLedger(input.workspaceId);
        return {
          month: ledger.month,
          creditsUsed: ledger.creditsUsed,
          creditsRemaining: Math.max(0, ledger.planAllowance - ledger.creditsUsed),
          planAllowance: ledger.planAllowance,
        };
      }),

    createCheckout: trpc.protectedProcedure
      .input(
        WorkspaceInput.extend({
          planId: PlanSchema,
          successUrl: z.string().url().optional(),
          cancelUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);

        // Free plan has nothing to buy; send it to the portal for management.
        if (input.planId === "free") {
          const portalUrl = await billingService.createPortalSession(
            input.workspaceId,
            input.successUrl || `${DEFAULT_APP_URL}/settings/billing`
          );
          return { checkoutUrl: portalUrl, mode: "portal" as const };
        }

        const checkoutUrl = await billingService.createCheckoutSession(
          input.workspaceId,
          input.planId,
          input.successUrl ||
            `${DEFAULT_APP_URL}/settings/billing?upgraded=1`,
          input.cancelUrl ||
            `${DEFAULT_APP_URL}/settings/billing?canceled=1`
        );
        return { checkoutUrl, mode: "checkout" as const };
      }),

    createPortal: trpc.protectedProcedure
      .input(
        WorkspaceInput.extend({
          returnUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        const portalUrl = await billingService.createPortalSession(
          input.workspaceId,
          input.returnUrl || `${DEFAULT_APP_URL}/settings/billing`
        );
        return { portalUrl };
      }),

    cancelSubscription: trpc.protectedProcedure
      .input(WorkspaceInput)
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        await billingService.cancelSubscription(input.workspaceId);
        return { success: true };
      }),
  });
}
