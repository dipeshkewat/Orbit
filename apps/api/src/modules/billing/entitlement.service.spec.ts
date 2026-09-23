import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  workspace: {
    findUnique: vi.fn(),
  },
  socialAccount: {
    count: vi.fn(),
  },
  teamMember: {
    count: vi.fn(),
  },
  aiCredit: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock("@orbit/db", () => ({
  prisma: prismaMock,
}));

import { EntitlementService } from "./entitlement.service";

describe("EntitlementService", () => {
  const service = new EntitlementService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWorkspacePlan", () => {
    test("throws NotFound for an unknown workspace", async () => {
      prismaMock.workspace.findUnique.mockResolvedValue(null);

      await expect(service.getWorkspacePlan("ws-1")).rejects.toMatchObject({
        response: { statusCode: 404 },
      });
    });

    test("falls back to free when the stored plan value is not recognized", async () => {
      prismaMock.workspace.findUnique.mockResolvedValue({ plan: "galactic" });

      await expect(service.getWorkspacePlan("ws-1")).resolves.toBe("free");
    });
  });

  describe("assertCanConnectChannel", () => {
    test("blocks connecting when the plan's channel budget is exhausted", async () => {
      prismaMock.workspace.findUnique.mockResolvedValue({ plan: "free" });
      prismaMock.socialAccount.count.mockResolvedValue(3); // free limit = 3

      await expect(service.assertCanConnectChannel("ws-1")).rejects.toMatchObject({
        response: { statusCode: 409 },
      });
    });

    test("allows connecting under the limit", async () => {
      prismaMock.workspace.findUnique.mockResolvedValue({ plan: "creator" });
      prismaMock.socialAccount.count.mockResolvedValue(9); // creator limit = 10

      await expect(service.assertCanConnectChannel("ws-1")).resolves.toBeUndefined();
    });
  });

  describe("assertCanInviteSeat", () => {
    test("blocks invites once accepted members reach the plan limit", async () => {
      prismaMock.workspace.findUnique.mockResolvedValue({ plan: "free" }); // limit 1
      prismaMock.teamMember.count.mockResolvedValue(1);

      await expect(service.assertCanInviteSeat("ws-1")).rejects.toMatchObject({
        response: { statusCode: 409 },
      });
    });

    test("skips the count entirely for plans with unlimited seats", async () => {
      prismaMock.workspace.findUnique.mockResolvedValue({ plan: "pro" }); // Infinity

      await expect(service.assertCanInviteSeat("ws-1")).resolves.toBeUndefined();
      expect(prismaMock.teamMember.count).not.toHaveBeenCalled();
    });
  });

  describe("consumeAiCredits", () => {
    test("atomically reserves credits and reports the remaining balance", async () => {
      prismaMock.workspace.findUnique.mockResolvedValue({ plan: "creator" });
      prismaMock.aiCredit.findUnique.mockResolvedValue({
        id: "ledger-1",
        creditsUsed: 95,
        planAllowance: 200,
      });
      prismaMock.aiCredit.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.consumeAiCredits("ws-1", 5);

      expect(result).toEqual({ creditsUsed: 100, creditsRemaining: 100 });
      // The affordability check must be encoded in the where-clause, not
      // trusted from a prior read.
      expect(prismaMock.aiCredit.updateMany).toHaveBeenCalledWith({
        where: { id: "ledger-1", creditsUsed: { lte: 195 } },
        data: { creditsUsed: { increment: 5 } },
      });
    });

    test("rejects with 403 when the conditional update loses the race", async () => {
      prismaMock.workspace.findUnique.mockResolvedValue({ plan: "free" });
      prismaMock.aiCredit.findUnique.mockResolvedValue({
        id: "ledger-1",
        creditsUsed: 18,
        planAllowance: 20,
      });
      prismaMock.aiCredit.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.consumeAiCredits("ws-1", 5)).rejects.toMatchObject({
        response: { statusCode: 403 },
      });
      // Nothing was deducted.
      expect(prismaMock.aiCredit.update).not.toHaveBeenCalled();
    });

    test("recovers when concurrent ledger creation loses the unique race", async () => {
      prismaMock.workspace.findUnique.mockResolvedValue({ plan: "free" });
      prismaMock.aiCredit.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "ledger-2", creditsUsed: 0, planAllowance: 20 });
      prismaMock.aiCredit.create.mockRejectedValue(
        new Error("Unique constraint failed on ai_credits"),
      );
      prismaMock.aiCredit.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.consumeAiCredits("ws-1", 1);

      expect(result.creditsUsed).toBe(1);
      expect(prismaMock.aiCredit.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: "ledger-2" }) }),
      );
    });
  });

  describe("refundAiCredits", () => {
    test("decrements usage without going negative", async () => {
      await service.refundAiCredits("ws-1", 5);

      expect(prismaMock.aiCredit.updateMany).toHaveBeenCalledWith({
        where: { workspaceId: "ws-1", month: expect.any(String), creditsUsed: { gte: 5 } },
        data: { creditsUsed: { decrement: 5 } },
      });
    });

    test("is a no-op for non-positive costs", async () => {
      await service.refundAiCredits("ws-1", 0);

      expect(prismaMock.aiCredit.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("getOrCreateCreditLedger", () => {
    test("raises the stored allowance when the workspace upgraded mid-month", async () => {
      prismaMock.workspace.findUnique.mockResolvedValue({ plan: "pro" });
      prismaMock.aiCredit.findUnique.mockResolvedValue({
        id: "ledger-1",
        creditsUsed: 40,
        planAllowance: 200,
      });
      prismaMock.aiCredit.update.mockResolvedValue({
        id: "ledger-1",
        creditsUsed: 40,
        planAllowance: 1000,
      });

      const ledger = await service.getOrCreateCreditLedger("ws-1");

      expect(prismaMock.aiCredit.update).toHaveBeenCalledWith({
        where: { id: "ledger-1" },
        data: { planAllowance: 1000 },
      });
      expect(ledger.planAllowance).toBe(1000);
    });

    test("keeps the paid allowance on downgrade until the month resets", async () => {
      prismaMock.workspace.findUnique.mockResolvedValue({ plan: "free" });
      prismaMock.aiCredit.findUnique.mockResolvedValue({
        id: "ledger-1",
        creditsUsed: 40,
        planAllowance: 1000,
      });

      const ledger = await service.getOrCreateCreditLedger("ws-1");

      expect(prismaMock.aiCredit.update).not.toHaveBeenCalled();
      expect(ledger.planAllowance).toBe(1000);
    });
  });
});
