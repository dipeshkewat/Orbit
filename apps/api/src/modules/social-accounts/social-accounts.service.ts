import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@orbit/db";
import type { Prisma } from "@prisma/client";
import { TokenEncryptionService } from "./token-encryption.service";
import { EntitlementService } from "../billing/entitlement.service";

@Injectable()
export class SocialAccountsService {
  constructor(
    private readonly encryptionService: TokenEncryptionService,
    private readonly entitlements: EntitlementService,
  ) {}

  /**
   * Save a newly connected social media account with encrypted tokens
   */
  async connectAccount(data: {
    workspaceId: string;
    platform: string;
    platformUserId: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    accessToken: string;
    refreshToken?: string;
    expiresInSeconds?: number;
    metadata?: Prisma.InputJsonValue;
  }) {
    // Enforce the plan's channel limit for *new* connections; re-connecting
    // an existing account must stay allowed even when the plan is full.
    const existingAccount = await prisma.socialAccount.findUnique({
      where: {
        workspaceId_platform_platformUserId: {
          workspaceId: data.workspaceId,
          platform: data.platform,
          platformUserId: data.platformUserId,
        },
      },
      select: { id: true },
    });
    if (!existingAccount) {
      await this.entitlements.assertCanConnectChannel(data.workspaceId);
    }

    const encryptedAccessToken = new Uint8Array(this.encryptionService.encrypt(data.accessToken));
    const encryptedRefreshToken = data.refreshToken
      ? new Uint8Array(this.encryptionService.encrypt(data.refreshToken))
      : null;

    const tokenExpiresAt = data.expiresInSeconds
      ? new Date(Date.now() + data.expiresInSeconds * 1000)
      : null;

    const account = await prisma.socialAccount.upsert({
      where: {
        workspaceId_platform_platformUserId: {
          workspaceId: data.workspaceId,
          platform: data.platform,
          platformUserId: data.platformUserId,
        },
      },
      update: {
        username: data.username,
        displayName: data.displayName ?? data.username,
        avatarUrl: data.avatarUrl,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        status: "active",
        metadata: data.metadata ?? {},
      },
      create: {
        workspaceId: data.workspaceId,
        platform: data.platform,
        platformUserId: data.platformUserId,
        username: data.username,
        displayName: data.displayName ?? data.username,
        avatarUrl: data.avatarUrl,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt,
        status: "active",
        metadata: data.metadata ?? {},
      },
    });

    return {
      id: account.id,
      platform: account.platform,
      username: account.username,
      status: account.status,
    };
  }

  /**
   * List all accounts connected to a workspace
   */
  async listAccounts(workspaceId: string) {
    const accounts = await prisma.socialAccount.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        tokenExpiresAt: true,
        createdAt: true,
      },
    });

    // Decrypt and return safe metadata (omit access/refresh tokens)
    return accounts.map((acc) => ({
      id: acc.id,
      platform: acc.platform,
      username: acc.username,
      displayName: acc.displayName,
      avatarUrl: acc.avatarUrl,
      status: acc.status,
      tokenExpiresAt: acc.tokenExpiresAt,
      createdAt: acc.createdAt,
    }));
  }

  /**
   * Disconnect a social account from a workspace
   */
  async disconnectAccount(workspaceId: string, id: string) {
    const account = await prisma.socialAccount.findFirst({
      where: { id, workspaceId },
    });

    if (!account || account.workspaceId !== workspaceId) {
      throw new NotFoundException(`Social account not found`);
    }

    const disconnected = await prisma.socialAccount.update({
      where: { id },
      data: { status: "disconnected" },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        tokenExpiresAt: true,
        createdAt: true,
      },
    });

    return disconnected;
  }

  /**
   * Retrieve decrypted access token for execution
   */
  async getDecryptedAccessToken(workspaceId: string, id: string): Promise<string> {
    const account = await prisma.socialAccount.findFirst({
      where: { id, workspaceId },
    });

    if (!account) {
      throw new NotFoundException(`Social account not found`);
    }

    return this.encryptionService.decrypt(Buffer.from(account.accessToken));
  }

  /**
   * Retrieve decrypted refresh token if available
   */
  async getDecryptedRefreshToken(workspaceId: string, id: string): Promise<string | null> {
    const account = await prisma.socialAccount.findFirst({
      where: { id, workspaceId },
    });

    if (!account || !account.refreshToken) {
      return null;
    }

    return this.encryptionService.decrypt(Buffer.from(account.refreshToken));
  }

  /**
   * Update token health status
   */
  async updateAccountStatus(workspaceId: string, id: string, status: "active" | "expiring" | "disconnected" | "error") {
    const account = await prisma.socialAccount.findFirst({
      where: { id, workspaceId },
      select: { id: true },
    });
    if (!account) {
      throw new NotFoundException("Social account not found");
    }

    return prisma.socialAccount.update({
      where: { id: account.id },
      data: { status },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        tokenExpiresAt: true,
        createdAt: true,
      },
    });
  }
}
