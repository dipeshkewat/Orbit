import { Injectable, ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { prisma } from "@orbit/db";
import { PLAN_LIMITS, Plan } from "@orbit/types";

/**
 * Central server-side entitlement enforcement for workspace plans.
 *
 * Every plan-gated mutation (connecting channels, inviting seats, spending
 * AI credits) must pass through this service so limits come from the
 * workspace's persisted plan — never from client-supplied values.
 */
@Injectable()
export class EntitlementService {
  private static readonly PAID_PLANS: Plan[] = ["creator", "pro", "agency", "enterprise"];

  /**
   * Resolve the workspace's plan, throwing when it does not exist.
   */
  async getWorkspacePlan(workspaceId: string): Promise<Plan> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { plan: true },
    });
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID '${workspaceId}' not found`);
    }
    return (PLAN_LIMITS[workspace.plan as Plan] ? workspace.plan : "free") as Plan;
  }

  /**
   * Enforce the channel (connected social account) limit before connecting
   * another platform account. Counts active accounts server-side.
   */
  async assertCanConnectChannel(workspaceId: string): Promise<void> {
    const plan = await this.getWorkspacePlan(workspaceId);
    const limit = PLAN_LIMITS[plan].channels;

    const accountCount = await prisma.socialAccount.count({
      where: { workspaceId, status: "active" },
    });

    if (accountCount >= limit) {
      throw new ConflictException(
        `Plan '${plan}' is limited to ${limit} connected channel${limit === 1 ? "" : "s"}. ` +
          `Upgrade to connect more.`,
      );
    }
  }

  /**
   * Enforce the team seat limit before creating another accepted membership.
   * Counts accepted members server-side (pending invites do not consume seats).
   */
  async assertCanInviteSeat(workspaceId: string, additionalSeats = 1): Promise<void> {
    const plan = await this.getWorkspacePlan(workspaceId);
    const limit = PLAN_LIMITS[plan].teamMembers;

    if (!Number.isFinite(limit)) {
      return;
    }

    const memberCount = await prisma.teamMember.count({
      where: { workspaceId, inviteStatus: "accepted" },
    });

    if (memberCount + additionalSeats > limit) {
      throw new ConflictException(
        `Plan '${plan}' is limited to ${limit} team member${limit === 1 ? "" : "s"}. ` +
          `Upgrade to add more seats.`,
      );
    }
  }

  /**
   * Get-or-create the current-month AiCredit ledger row and reconcile the
   * plan allowance against the workspace's current plan. When the plan
   * changed mid-month (upgrade), the allowance is raised; on downgrade the
   * stored allowance is kept for the rest of the period so workspaces keep
   * what they paid for until the month resets.
   */
  async getOrCreateCreditLedger(workspaceId: string) {
    const plan = await this.getWorkspacePlan(workspaceId);
    const month = AiCreditLedger.currentMonth();
    // Enterprise limits are Infinity — the DB column is Int, so clamp to a
    // sentinel that behaves identically for any realistic usage.
    const rawAllowance = PLAN_LIMITS[plan].aiCredits;
    const allowance = Number.isFinite(rawAllowance) ? rawAllowance : Number.MAX_SAFE_INTEGER;

    const existing = await prisma.aiCredit.findUnique({
      where: { workspaceId_month: { workspaceId, month } },
    });

    if (!existing) {
      try {
        return await prisma.aiCredit.create({
          data: { workspaceId, month, creditsUsed: 0, planAllowance: allowance },
        });
      } catch {
        // Concurrent creation — re-read the losing winner.
        const created = await prisma.aiCredit.findUnique({
          where: { workspaceId_month: { workspaceId, month } },
        });
        if (!created) {
          throw new Error(`Failed to create AI credit ledger for workspace ${workspaceId}`);
        }
        return created;
      }
    }

    if (allowance > existing.planAllowance) {
      return prisma.aiCredit.update({
        where: { id: existing.id },
        data: { planAllowance: allowance },
      });
    }

    return existing;
  }

  /**
   * Atomically reserve AI credits against the current ledger using a
   * conditional update (compare-and-set on creditsUsed). Returns the
   * remaining balance after the reservation.
   *
   * The where-clause encodes the whole affordability check so two concurrent
   * generations cannot both pass a stale read-modify-write.
   */
  async consumeAiCredits(
    workspaceId: string,
    cost: number,
  ): Promise<{ creditsUsed: number; creditsRemaining: number }> {
    if (cost <= 0) {
      throw new Error("AI credit cost must be positive");
    }

    const ledger = await this.getOrCreateCreditLedger(workspaceId);

    const result = await prisma.aiCredit.updateMany({
      where: {
        id: ledger.id,
        creditsUsed: { lte: ledger.planAllowance - cost },
      },
      data: { creditsUsed: { increment: cost } },
    });

    if (result.count !== 1) {
      throw new ForbiddenException(
        `Insufficient AI credits. Used: ${ledger.creditsUsed}/${ledger.planAllowance}. Required: ${cost}. ` +
          `Upgrade your plan or wait for the monthly reset.`,
      );
    }

    const creditsUsed = ledger.creditsUsed + cost;
    return {
      creditsUsed,
      creditsRemaining: Math.max(0, ledger.planAllowance - creditsUsed),
    };
  }

  /**
   * Refund previously reserved credits when an operation fails after
   * reservation (e.g. the provider call errored). Clamps at zero.
   */
  async refundAiCredits(workspaceId: string, cost: number): Promise<void> {
    if (cost <= 0) return;
    const month = AiCreditLedger.currentMonth();
    await prisma.aiCredit.updateMany({
      where: { workspaceId, month, creditsUsed: { gte: cost } },
      data: { creditsUsed: { decrement: cost } },
    });
  }

  /**
   * Whether the workspace's plan unlocks a given feature flag-style gate.
   * Used for plan-tiered features (white-label reports, bulk CSV, etc.).
   */
  async assertFeature(feature: "whiteLabelReports" | "bulkCsvScheduling" | "apiAccess", workspaceId: string): Promise<void> {
    const plan = await this.getWorkspacePlan(workspaceId);
    const allowed: Record<string, Plan[]> = {
      whiteLabelReports: ["agency", "enterprise"],
      bulkCsvScheduling: ["pro", "agency", "enterprise"],
      apiAccess: ["pro", "agency", "enterprise"],
    };
    if (!allowed[feature].includes(plan)) {
      throw new ForbiddenException(
        `Feature '${feature}' requires the ${allowed[feature].join(" or ")} plan.`,
      );
    }
  }

  /**
   * Convenience gate used by billing flows: only paid plans can start a
   * portal session (free workspaces have nothing to manage).
   */
  static isPaidPlan(plan: string): boolean {
    return EntitlementService.PAID_PLANS.includes(plan as Plan);
  }
}

/** Month key helpers kept separate for easy testing. */
export const AiCreditLedger = {
  currentMonth(now: Date = new Date()): string {
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  },
};
