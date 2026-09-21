import { describe, expect, test, vi } from "vitest";
import Redis from "ioredis";
import { OAuthStateService } from "./oauth-state.service";

function createRedisStub() {
  const values = new Map<string, string>();
  return {
    set: vi.fn(async (key: string, value: string) => {
      values.set(key, value);
      return "OK";
    }),
    getdel: vi.fn(async (key: string) => {
      const value = values.get(key) ?? null;
      values.delete(key);
      return value;
    }),
  } as unknown as Redis;
}

describe("OAuthStateService", () => {
  test("creates and consumes a state once", async () => {
    const service = new OAuthStateService(createRedisStub());
    const state = await service.createState({
      workspaceId: "workspace-id",
      userId: "user-id",
      platform: "linkedin",
      redirectUri: "https://app.example.com/oauth/callback/linkedin",
    });

    await expect(service.consumeState(state, "linkedin")).resolves.toMatchObject({
      workspaceId: "workspace-id",
      userId: "user-id",
      platform: "linkedin",
    });
    await expect(service.consumeState(state, "linkedin")).rejects.toThrow(
      "OAuth state was already used or is unknown",
    );
  });

  test("rejects a tampered signature", async () => {
    const service = new OAuthStateService(createRedisStub());
    const state = await service.createState({
      workspaceId: "workspace-id",
      userId: "user-id",
      platform: "instagram",
      redirectUri: "https://app.example.com/oauth/callback/instagram",
    });

    const tampered = `${state.slice(0, -1)}${state.endsWith("a") ? "b" : "a"}`;
    await expect(service.consumeState(tampered, "instagram")).rejects.toThrow(
      "Invalid OAuth state signature",
    );
  });

  test("rejects a state for a different platform", async () => {
    const service = new OAuthStateService(createRedisStub());
    const state = await service.createState({
      workspaceId: "workspace-id",
      userId: "user-id",
      platform: "facebook",
      redirectUri: "https://app.example.com/oauth/callback/facebook",
    });

    await expect(service.consumeState(state, "instagram")).rejects.toThrow(
      "Expired or mismatched OAuth state",
    );
  });
});
