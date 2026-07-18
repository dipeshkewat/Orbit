import { z } from "zod";
import { TrpcService } from "../trpc.service";
import { PlanSchema } from "@socialsphear/types";

export function createBillingRouter(trpc: TrpcService) {
  return trpc.router({
    getPlans: trpc.publicProcedure.query(async () => {
      return [
        { id: "free", name: "Free", price: 0, channels: 3, aiCredits: 20 },
        { id: "creator", name: "Creator", price: 19, channels: 10, aiCredits: 200 },
        { id: "pro", name: "Pro", price: 49, channels: 25, aiCredits: 1000 },
        { id: "agency", name: "Agency", price: 99, channels: 100, aiCredits: 5000 },
      ];
    }),

    getSubscription: trpc.protectedProcedure.query(async () => {
      return {
        plan: "free",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    }),

    createCheckout: trpc.protectedProcedure
      .input(
        z.object({
          planId: PlanSchema,
        })
      )
      .mutation(async ({ input }) => {
        void input;
        return {
          checkoutUrl: "https://checkout.stripe.com/pay/mock_cs_live_session",
        };
      }),

    cancelSubscription: trpc.protectedProcedure.mutation(async () => {
      return { success: true };
    }),
  });
}
