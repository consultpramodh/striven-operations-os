import { StrivenTokenManager } from "./auth.js";
import { StrivenHttpError } from "./errors.js";
import { ApiMeter } from "./metrics.js";

type ReadMethod = "GET" | "POST";

interface RequestOptions {
  method: ReadMethod;
  path: string;
  body?: unknown;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class StrivenReadOnlyClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokens: StrivenTokenManager,
    private readonly meter: ApiMeter,
  ) {}

  async get<T>(path: string): Promise<T> {
    return this.request<T>({ method: "GET", path });
  }

  async search<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const pathname = new URL(path, this.baseUrl).pathname;
    if (!/\/search$/i.test(pathname)) {
      throw new Error(`Stage 0 blocked POST to non-search endpoint: ${pathname}`);
    }
    return this.request<T>({ method: "POST", path, body });
  }

  private async request<T>(options: RequestOptions, attempt = 1): Promise<T> {
    const token = await this.tokens.getAccessToken();
    const url = new URL(options.path, this.baseUrl);
    const startedAt = Date.now();

    const response = await fetch(url, {
      method: options.method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const retryAfterRaw = response.headers.get("retry-after");
    const retryAfterSeconds = retryAfterRaw ? Number.parseInt(retryAfterRaw, 10) : undefined;

    this.meter.record({
      at: new Date().toISOString(),
      method: options.method,
      path: url.pathname,
      status: response.status,
      durationMs: Date.now() - startedAt,
      attempt,
      ...(Number.isFinite(retryAfterSeconds) ? { retryAfterSeconds } : {}),
    });

    if (response.status === 401 && attempt === 1) {
      this.tokens.invalidate();
      return this.request<T>(options, attempt + 1);
    }

    if (
      response.status === 429 &&
      attempt === 1 &&
      retryAfterSeconds !== undefined &&
      Number.isFinite(retryAfterSeconds) &&
      retryAfterSeconds >= 0 &&
      retryAfterSeconds <= 60
    ) {
      await sleep(retryAfterSeconds * 1000);
      return this.request<T>(options, attempt + 1);
    }

    if (!response.ok) {
      const safeBody = await response.text();
      throw new StrivenHttpError(
        `Striven request failed with HTTP ${response.status}: ${safeBody}`,
        response.status,
        options.method,
        url.pathname,
        retryAfterSeconds,
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    return (await response.text()) as T;
  }
}
