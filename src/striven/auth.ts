interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface CachedToken {
  accessToken: string;
  refreshToken: string | undefined;
  expiresAtMs: number;
}

const EXPIRY_SKEW_MS = 60_000;

export class StrivenTokenManager {
  private cached: CachedToken | undefined;

  constructor(
    private readonly baseUrl: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  invalidate(): void {
    this.cached = undefined;
  }

  async getAccessToken(): Promise<string> {
    if (this.cached && Date.now() + EXPIRY_SKEW_MS < this.cached.expiresAtMs) {
      return this.cached.accessToken;
    }

    if (this.cached?.refreshToken) {
      try {
        return await this.refresh(this.cached.refreshToken);
      } catch {
        this.cached = undefined;
      }
    }

    return this.acquire();
  }

  private tokenUrl(): URL {
    return new URL("/accesstoken", this.baseUrl);
  }

  private async acquire(): Promise<string> {
    const authorization = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      ClientId: this.clientId,
    });

    const response = await fetch(this.tokenUrl(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    return this.consumeTokenResponse(response);
  }

  private async refresh(refreshToken: string): Promise<string> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const response = await fetch(this.tokenUrl(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    return this.consumeTokenResponse(response);
  }

  private async consumeTokenResponse(response: Response): Promise<string> {
    if (!response.ok) {
      const safeBody = await response.text();
      throw new Error(`Striven token request failed with HTTP ${response.status}: ${safeBody}`);
    }

    const token = (await response.json()) as TokenResponse;
    if (!token.access_token || !Number.isFinite(token.expires_in)) {
      throw new Error("Striven token response is missing access_token or expires_in");
    }

    this.cached = {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAtMs: Date.now() + token.expires_in * 1000,
    };

    return token.access_token;
  }
}
