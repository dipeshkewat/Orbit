import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class LinkedInOauthService {
  private readonly logger = new Logger(LinkedInOauthService.name);
  private readonly clientId = process.env.LINKEDIN_CLIENT_ID || "";
  private readonly clientSecret = process.env.LINKEDIN_CLIENT_SECRET || "";

  /**
   * Generate LinkedIn OAuth 2.0 authorization URL
   */
  getAuthorizationUrl(redirectUri: string, state?: string): string {
    this.logger.log(`Generating LinkedIn OAuth authorization URL for redirectUri: ${redirectUri}`);
    const scopes = ["openid", "profile", "w_member_social", "email"].join(" ");

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      state: state || "orbit_linkedin_state",
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Exchange authorization code for LinkedIn Access Token
   */
  async exchangeCodeForToken(code: string, redirectUri: string) {
    this.logger.log("Exchanging code for LinkedIn Access Token...");
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri,
    });

    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      this.logger.error(`LinkedIn OAuth Token Exchange Error: ${data.error_description || data.error}`);
      throw new Error(data.error_description || "Failed to exchange authorization code with LinkedIn API");
    }

    return {
      accessToken: data.access_token as string,
      expiresIn: data.expires_in as number,
    };
  }

  /**
   * Fetch connected LinkedIn User Profile (Person URN)
   */
  async getProfile(accessToken: string) {
    this.logger.log("Fetching LinkedIn user profile info...");
    const res = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      this.logger.error(`LinkedIn Profile Fetch Error: ${JSON.stringify(data)}`);
      throw new Error("Failed to fetch LinkedIn user profile");
    }

    return {
      sub: data.sub as string, // LinkedIn Person ID (e.g. urn:li:person:xxx or ID)
      name: data.name as string,
      email: data.email as string,
      picture: data.picture as string | undefined,
    };
  }
}
