import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class MetaOauthService {
  private readonly logger = new Logger(MetaOauthService.name);
  private readonly appId = process.env.META_APP_ID || "";
  private readonly appSecret = process.env.META_APP_SECRET || "";

  /**
   * Generate Facebook OAuth login URL for Facebook Pages & Instagram Business
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    this.logger.log(`Generating Meta OAuth authorization URL for redirectUri: ${redirectUri}`);
    const scopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "instagram_basic",
      "instagram_content_publish",
      "business_management",
    ].join(",");

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: "code",
      state: state || "",
    });

    return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for a short-lived user access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string) {
    this.logger.log("Exchanging code for Meta Access Token...");
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: redirectUri,
      code,
    });

    const res = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`);
    const data = await res.json();

    if (!res.ok || data.error) {
      this.logger.error(`Meta OAuth Token Exchange Error: ${data.error?.message}`);
      throw new Error(data.error?.message || "Failed to exchange authorization code with Meta API");
    }

    return data.access_token as string;
  }

  /**
   * Fetch connected Facebook Pages and Instagram Business Accounts for the user
   */
  async getConnectedAccounts(accessToken: string) {
    this.logger.log("Fetching connected Meta Pages and Instagram Accounts...");
    const url = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,username,picture,access_token,instagram_business_account{id,username,profile_picture_url}&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      this.logger.error(`Meta Accounts Fetch Error: ${data.error?.message}`);
      throw new Error(data.error?.message || "Failed to fetch Facebook Pages & Instagram Accounts");
    }

    return data.data || [];
  }
}
