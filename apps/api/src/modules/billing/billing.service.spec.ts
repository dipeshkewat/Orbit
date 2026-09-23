import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  workspace: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  webhookEvent: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  aiCredit: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@orbit/db", () => ({
  prisma: prismaMock,
}));

vi.mock("stripe", () => {
  const stripeInstance = {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
    subscriptions: {
      retrieve: vi.fn(),
      update: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn((payload, signature, _secret) => {
        // Mimic signature verification: reject a mismatched signature.
        if (signature !== "sig_ok") {
          throw new Error("No signatures found matching the expected signature");
        }
        return JSON.parse(payload.toString());
      }),
    },
  };
  const Stripe = vi.fn(() => stripeInstance);
  // Preserve static types used by the service (e.g. Stripe.Event).
  return { default: Stripe };
});

import { BillingService, resolvePlanFromPriceId } from "./billing.service";
import { EntitlementService } from "./entitlement.service";

/**
 * buildEvent creates a fake Stripe event whose `data.object` satisfies the
 * narrow subset of the Stripe types the handlers actually read. The casts
 * mirror how untyped webhook payloads arrive in production.
 */
function buildEvent(type: string, object: unknown): { id: string; type: string; data: { object: unknown } } {
  return { id: `evt_${Math.random().toString(36).slice(2)}`, type, data: { object } };
}

describe("resolvePlanFromPriceId", () => {
  test("maps configured price env vars to plans", () => {
    process.env.STRIPE_PRICE_PRO = "price_pro_live";
    expect(resolvePlanFromPriceId("price_pro_live")).toBe("pro");
    delete process.env.STRIPE_PRICE_PRO;
  });

  test("falls back to free for unknown or missing price ids", () => {
    expect(resolvePlanFromPriceId("price_unknown")).toBe("free");
    expect(resolvePlanFromPriceId(null)).toBe("free");
  });
});

describe("BillingService webhook reconciliation", () => {
  const entitlements = new EntitlementService();
  const service = new BillingService(entitlements);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("rejects payloads with an invalid signature", async () => {
    await expect(
      service.handleWebhookEvent(Buffer.from("{}"), "sig_bad"),
    ).rejects.toMatchObject({ response: { statusCode: 400 } });

    expect(prismaMock.webhookEvent.create).not.toHaveBeenCalled();
  });

  test("is idempotent: a replayed event is skipped entirely", async () => {
    prismaMock.webhookEvent.findUnique.mockResolvedValue({ id: "1", eventId: "evt_x" });

    const event = buildEvent("customer.subscription.updated", {});
    await service.handleWebhookEvent(Buffer.from(JSON.stringify(event)), "sig_ok");

    expect(prismaMock.workspace.update).not.toHaveBeenCalled();
    // No second record is created.
    expect(prismaMock.webhookEvent.create).not.toHaveBeenCalled();
  });

  test("checkout.session.completed activates the plan from subscription price", async () => {
    prismaMock.webhookEvent.findUnique.mockResolvedValue(null);
    prismaMock.workspace.update.mockResolvedValue({});
    // The service re-derives the plan from the subscription's price line.
    const { default: Stripe } = await import("stripe");
    const instance = (Stripe as unknown as ReturnType<typeof vi.fn>)();
    (instance.subscriptions.retrieve as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sub_123",
      items: { data: [{ price: { id: "price_creator_mock" } }] },
    });

    const event = buildEvent("checkout.session.completed", {
      metadata: { workspaceId: "ws-1", planId: "creator" },
      subscription: "sub_123",
    });

    await service.handleWebhookEvent(Buffer.from(JSON.stringify(event)), "sig_ok");

    expect(prismaMock.workspace.update).toHaveBeenCalledWith({
      where: { id: "ws-1" },
      data: expect.objectContaining({ plan: "creator" }),
    });
  });

  test("customer.subscription.deleted downgrades the workspace to free", async () => {
    prismaMock.webhookEvent.findUnique.mockResolvedValue(null);
    prismaMock.workspace.findFirst.mockResolvedValue({
      id: "ws-1",
      plan: "pro",
      stripeSubscriptionId: "sub_123",
    });
    prismaMock.workspace.update.mockResolvedValue({});

    const event = buildEvent("customer.subscription.deleted", { id: "sub_123" });
    await service.handleWebhookEvent(Buffer.from(JSON.stringify(event)), "sig_ok");

    expect(prismaMock.workspace.update).toHaveBeenCalledWith({
      where: { id: "ws-1" },
      data: { plan: "free", stripeSubscriptionId: null },
    });
  });

  test("invoice.payment_succeeded reconciles the AI credit ledger", async () => {
    prismaMock.webhookEvent.findUnique.mockResolvedValue(null);
    prismaMock.workspace.findFirst.mockResolvedValue({ id: "ws-1", plan: "pro" });
    // EntitlementService resolves the plan via workspace.findUnique.
    prismaMock.workspace.findUnique.mockResolvedValue({ id: "ws-1", plan: "pro" });
    prismaMock.aiCredit.findUnique.mockResolvedValue({
      id: "ledger-1",
      creditsUsed: 120,
      planAllowance: 200,
    });
    prismaMock.aiCredit.update.mockResolvedValue({});

    const event = buildEvent("invoice.payment_succeeded", { customer: "cus_123" });
    await service.handleWebhookEvent(Buffer.from(JSON.stringify(event)), "sig_ok");

    expect(prismaMock.aiCredit.update).toHaveBeenCalledWith({
      where: { id: "ledger-1" },
      data: { planAllowance: 1000 }, // pro allowance
    });
  });

  test("invoice.payment_failed keeps the paid plan during the grace window", async () => {
    prismaMock.webhookEvent.findUnique.mockResolvedValue(null);
    prismaMock.workspace.findFirst.mockResolvedValue({
      id: "ws-1",
      plan: "pro",
      stripeCustomerId: "cus_123",
    });

    const event = buildEvent("invoice.payment_failed", { customer: "cus_123" });
    await service.handleWebhookEvent(Buffer.from(JSON.stringify(event)), "sig_ok");

    // Grace period: plan must NOT be downgraded, subscription untouched.
    expect(prismaMock.workspace.update).not.toHaveBeenCalled();
  });

  test("records the event id only after handlers succeed", async () => {
    prismaMock.webhookEvent.findUnique.mockResolvedValue(null);
    // No workspace found → handler is a no-op success → still recorded.
    prismaMock.workspace.findFirst.mockResolvedValue(null);

    const event = buildEvent("invoice.payment_succeeded", { customer: "cus_missing" });
    await service.handleWebhookEvent(Buffer.from(JSON.stringify(event)), "sig_ok");

    expect(prismaMock.webhookEvent.create).toHaveBeenCalledWith({
      data: { eventId: event.id, eventType: "invoice.payment_succeeded" },
    });
  });

  test("does not record the event when a handler throws (so Stripe retries)", async () => {
    prismaMock.webhookEvent.findUnique.mockResolvedValue(null);
    prismaMock.workspace.findFirst.mockRejectedValue(new Error("db down"));

    const event = buildEvent("invoice.payment_succeeded", { customer: "cus_123" });

    await expect(
      service.handleWebhookEvent(Buffer.from(JSON.stringify(event)), "sig_ok"),
    ).rejects.toThrow("db down");

    expect(prismaMock.webhookEvent.create).not.toHaveBeenCalled();
  });
});
