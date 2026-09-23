import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as crypto from "crypto";

const prismaMock = vi.hoisted(() => ({
  webhook: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  webhookDelivery: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock("@orbit/db", () => ({
  prisma: prismaMock,
}));

import { WebhooksService } from "./webhooks.service";

describe("WebhooksService dispatch", () => {
  const service = new WebhooksService();
  const secret = "a".repeat(64);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("signs the payload with HMAC-SHA256 of the webhook secret", async () => {
    prismaMock.webhook.findMany.mockResolvedValue([
      { id: "wh-1", url: "https://hooks.example/x", events: ["post.published"], secretHash: secret },
    ]);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve("ok") });
    vi.stubGlobal("fetch", fetchMock);
    prismaMock.webhookDelivery.create.mockResolvedValue({});

    await service.dispatchEvent("ws-1", "post.published", { postId: "p1" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://hooks.example/x");
    const body = init.body as string;
    const expectedSig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(init.headers["X-Orbit-Signature"]).toBe(`sha256=${expectedSig}`);
  });

  test("retries on failure with backoff and records the final attempt count", async () => {
    prismaMock.webhook.findMany.mockResolvedValue([
      { id: "wh-1", url: "https://hooks.example/x", events: ["*"], secretHash: secret },
    ]);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve("boom") })
      .mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve("ok") });
    vi.stubGlobal("fetch", fetchMock);
    prismaMock.webhookDelivery.create.mockResolvedValue({});

    const pending = service.dispatchEvent("ws-1", "post.published", {});
    // Advance past the 1s backoff between attempt 1 and 2.
    await vi.runAllTimersAsync();
    await pending;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(prismaMock.webhookDelivery.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "success", attempts: 2 }),
    });
  });

  test("records a failed delivery after exhausting all attempts", async () => {
    prismaMock.webhook.findMany.mockResolvedValue([
      { id: "wh-1", url: "https://hooks.example/x", events: ["*"], secretHash: secret },
    ]);
    const fetchMock = vi.fn().mockRejectedValue(new Error("connection refused"));
    vi.stubGlobal("fetch", fetchMock);
    prismaMock.webhookDelivery.create.mockResolvedValue({});

    const pending = service.dispatchEvent("ws-1", "post.published", {});
    await vi.runAllTimersAsync();
    await pending;

    expect(fetchMock).toHaveBeenCalledTimes(3); // maxAttempts default
    expect(prismaMock.webhookDelivery.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "failed",
        attempts: 3,
        responseBody: expect.stringContaining("connection refused"),
      }),
    });
  });

  test("skips webhooks that do not subscribe to the event type", async () => {
    prismaMock.webhook.findMany.mockResolvedValue([
      { id: "wh-1", url: "https://hooks.example/x", events: ["post.failed"], secretHash: secret },
    ]);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await service.dispatchEvent("ws-1", "post.published", {});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(prismaMock.webhookDelivery.create).not.toHaveBeenCalled();
  });

  test("dispatches to matching webhooks concurrently", async () => {
    prismaMock.webhook.findMany.mockResolvedValue([
      { id: "wh-1", url: "https://a.example", events: ["*"], secretHash: secret },
      { id: "wh-2", url: "https://b.example", events: ["*"], secretHash: secret },
    ]);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: () => Promise.resolve("") });
    vi.stubGlobal("fetch", fetchMock);
    prismaMock.webhookDelivery.create.mockResolvedValue({});

    const pending = service.dispatchEvent("ws-1", "post.published", {});
    await vi.runAllTimersAsync();
    await pending;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
