import { Injectable } from "@nestjs/common";
import { Platform } from "@orbit/types";
import { LinkedInOauthService } from "./linkedin-oauth.service";
import { MetaOauthService } from "./meta-oauth.service";
import { OAuthStateService } from "./oauth-state.service";
import { SocialAccountsService } from "./social-accounts.service";

@Injectable()
export class OAuthConnectionService {
  constructor(
    private readonly stateService: OAuthStateService,
    private readonly socialAccounts: SocialAccountsService,
    private readonly metaOauth: MetaOauthService,
    private readonly linkedInOauth: LinkedInOauthService,
  ) {}

  getAuthorizationUrl(platform: Platform, redirectUri: string, state: string): string {
    if (platform === "linkedin") {
      return this.linkedInOauth.getAuthorizationUrl(redirectUri, state);
    }
    if (platform === "facebook" || platform === "instagram") {
      return this.metaOauth.getAuthorizationUrl(redirectUri, state);
    }
    throw new Error("OAuth is not available for this platform yet");
  }

  async complete(
    platform: Platform,
    code: string,
    redirectUri: string | undefined,
    state: string,
    expectedWorkspaceId?: string,
    expectedUserId?: string,
  ) {
    const statePayload = await this.stateService.consumeState(state, platform);
    if (
      (expectedWorkspaceId && statePayload.workspaceId !== expectedWorkspaceId) ||
      (expectedUserId && statePayload.userId !== expectedUserId)
    ) {
      throw new Error("OAuth state does not match the request");
    }
    const effectiveRedirectUri = redirectUri ?? statePayload.redirectUri;
    if (statePayload.redirectUri !== effectiveRedirectUri) {
      throw new Error("OAuth redirect URI does not match the request");
    }
    if (platform === "linkedin") {
      const token = await this.linkedInOauth.exchangeCodeForToken(code, effectiveRedirectUri);
      const profile = await this.linkedInOauth.getProfile(token.accessToken);
      return [
        await this.socialAccounts.connectAccount({
          workspaceId: statePayload.workspaceId,
          platform,
          platformUserId: profile.sub,
          username: profile.name,
          displayName: profile.name,
          avatarUrl: profile.picture,
          accessToken: token.accessToken,
          expiresInSeconds: token.expiresIn,
        }),
      ];
    }

    if (platform !== "facebook" && platform !== "instagram") {
      throw new Error("OAuth is not available for this platform yet");
    }

    const accessToken = await this.metaOauth.exchangeCodeForToken(code, effectiveRedirectUri);
    const accounts = await this.metaOauth.getConnectedAccounts(accessToken);
    const connected = await Promise.all(
      accounts.flatMap((account) => {
        if (platform === "facebook" && account.id && account.accessToken) {
          return [
            this.socialAccounts.connectAccount({
              workspaceId: statePayload.workspaceId,
              platform,
              platformUserId: account.id,
              username: account.username ?? account.name ?? account.id,
              displayName: account.name,
              accessToken: account.accessToken,
            }),
          ];
        }

        const instagram = account.instagramBusinessAccount;
        if (platform === "instagram" && instagram?.id && account.accessToken) {
          return [
            this.socialAccounts.connectAccount({
              workspaceId: statePayload.workspaceId,
              platform,
              platformUserId: instagram.id,
              username: instagram.username ?? instagram.id,
              avatarUrl: instagram.profilePictureUrl,
              accessToken: account.accessToken,
            }),
          ];
        }
        return [];
      }),
    );
    if (connected.length === 0) {
      throw new Error("No eligible social accounts were found");
    }
    return connected;
  }
}