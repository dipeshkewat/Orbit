import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@socialsphear/db";
import type { SocialAccount } from "@prisma/client";
import { TokenEncryptionService } from "./token-encryption.service";

@Injectable()
export class SocialAccountsService {
  constructor(private readonly encryptionService: TokenEncryptionService) {}

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
    metadata?: any;
  }) {
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
    });

    // Decrypt and return safe metadata (omit access/refresh tokens)
    return accounts.map((acc: SocialAccount) => ({
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
    const account = await prisma.socialAccount.findUnique({
      where: { id },
    });

    if (!account || account.workspaceId !== workspaceId) {
      throw new NotFoundException(`Social account not found`);
    }

    await prisma.socialAccount.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Retrieve decrypted access token for execution
   */
  async getDecryptedAccessToken(id: string): Promise<string> {
    const account = await prisma.socialAccount.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Social account not found`);
    }

    return this.encryptionService.decrypt(Buffer.from(account.accessToken));
  }

  /**
   * Retrieve decrypted refresh token if available
   */
  async getDecryptedRefreshToken(id: string): Promise<string | null> {
    const account = await prisma.socialAccount.findUnique({
      where: { id },
    });

    if (!account || !account.refreshToken) {
      return null;
    }

    return this.encryptionService.decrypt(Buffer.from(account.refreshToken));
  }

  /**
   * Update token health status
   */
  async updateAccountStatus(id: string, status: "active" | "expiring" | "disconnected" | "error") {
    return prisma.socialAccount.update({
      where: { id },
      data: { status },
    });
  }
}
