import { Inject, Injectable } from "@nestjs/common";
import { REDIS_CLIENT } from "../redis/redis.module";
import Redis from "ioredis";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type OAuthStatePayload = {
  workspaceId: string;
  userId: string;
  platform: string;
  redirectUri: string;
  nonce: string;
  expiresAt: number;
};

@Injectable()
export class OAuthStateService {
  private readonly secret: string;
  private readonly ttlSeconds = 600;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    const secret = process.env.OAUTH_STATE_SECRET;
    if (!secret && process.env.NODE_ENV !== "test") {
      throw new Error("OAUTH_STATE_SECRET is required outside test environments");
    }
    this.secret = secret ?? "orbit-test-oauth-state-secret";
  }

  async createState(payload: Omit<OAuthStatePayload, "nonce" | "expiresAt">): Promise<string> {
    const statePayload: OAuthStatePayload = {
      ...payload,
      nonce: randomUUID(),
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    };
    const encodedPayload = this.encode(statePayload);
    const signature = this.sign(encodedPayload);
    await this.redis.set(this.key(statePayload.nonce), encodedPayload, "EX", this.ttlSeconds, "NX");
    return `${encodedPayload}.${signature}`;
  }

  async consumeState(state: string, expectedPlatform: string): Promise<OAuthStatePayload> {
    const separator = state.lastIndexOf(".");
    if (separator <= 0) {
      throw new Error("Invalid OAuth state");
    }

    const encodedPayload = state.slice(0, separator);
    const receivedSignature = state.slice(separator + 1);
    const expectedSignature = this.sign(encodedPayload);
    const received = Buffer.from(receivedSignature);
    const expected = Buffer.from(expectedSignature);
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      throw new Error("Invalid OAuth state signature");
    }

    const payload = this.decode(encodedPayload);
    if (payload.platform !== expectedPlatform || payload.expiresAt <= Date.now()) {
      throw new Error("Expired or mismatched OAuth state");
    }

    const stored = await this.redis.getdel(this.key(payload.nonce));
    if (stored !== encodedPayload) {
      throw new Error("OAuth state was already used or is unknown");
    }
    return payload;
  }

  private key(nonce: string): string {
    return `orbit:oauth-state:${nonce}`;
  }

  private sign(value: string): string {
    return createHmac("sha256", this.secret).update(value).digest("base64url");
  }

  private encode(payload: OAuthStatePayload): string {
    return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  }

  private decode(value: string): OAuthStatePayload {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!this.isPayload(parsed)) {
      throw new Error("Invalid OAuth state payload");
    }
    return parsed;
  }

  private isPayload(value: unknown): value is OAuthStatePayload {
    if (!value || typeof value !== "object") {
      return false;
    }
    const payload = value as Record<string, unknown>;
    return (
      typeof payload.workspaceId === "string" &&
      typeof payload.userId === "string" &&
      typeof payload.platform === "string" &&
      typeof payload.redirectUri === "string" &&
      typeof payload.nonce === "string" &&
      typeof payload.expiresAt === "number"
    );
  }
}