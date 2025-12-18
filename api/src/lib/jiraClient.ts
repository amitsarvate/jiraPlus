type Logger = {
  warn: (data: Record<string, unknown>, message: string) => void;
  info?: (data: Record<string, unknown>, message: string) => void;
};

export type JiraClientOptions = {
  accessToken: string;
  cloudId: string;
  apiVersion?: "2" | "3";
  baseUrl?: string;
  maxRetries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  logger?: Logger;
};

export class JiraClientError extends Error {
  status: number;
  url: string;
  body?: string;

  constructor(status: number, url: string, body?: string) {
    super(`Jira request failed (${status})`);
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export class JiraClient {
  private accessToken: string;
  private baseUrl: string;
  private maxRetries: number;
  private minDelayMs: number;
  private maxDelayMs: number;
  private timeoutMs: number;
  private logger?: Logger;

  constructor(options: JiraClientOptions) {
    const apiVersion = options.apiVersion ?? "3";
    const baseUrl =
      options.baseUrl ??
      `https://api.atlassian.com/ex/jira/${options.cloudId}/rest/api/${apiVersion}`;

    this.accessToken = options.accessToken;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.maxRetries = options.maxRetries ?? 4;
    this.minDelayMs = options.minDelayMs ?? 500;
    this.maxDelayMs = options.maxDelayMs ?? 8000;
    this.timeoutMs = options.timeoutMs ?? 20000;
    this.logger = options.logger;
  }

  async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T | undefined> {
    const url = this.buildUrl(path);
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
    }
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const method = init.method ?? (init.body ? "POST" : "GET");
    const response = await this.fetchWithRetry(url, {
      ...init,
      method,
      headers
    });

    if (response.status === 204) {
      return undefined;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    const text = await response.text();
    return text as unknown as T;
  }

  private buildUrl(path: string): string {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}${normalized}`;
  }

  private async fetchWithRetry(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const { signal, cancel } = withTimeout(this.timeoutMs);

      try {
        const response = await fetch(url, { ...init, signal });
        cancel();

        if (response.ok) {
          return response;
        }

        if (shouldRetry(response.status)) {
          const delayMs = computeRetryDelay(
            response,
            attempt,
            this.minDelayMs,
            this.maxDelayMs
          );
          this.logger?.warn(
            { status: response.status, url, attempt, delayMs },
            "Retrying Jira request after retryable response"
          );
          if (attempt < this.maxRetries) {
            await sleep(delayMs);
            continue;
          }
        }

        const bodyText = await response.text();
        throw new JiraClientError(response.status, url, bodyText);
      } catch (err) {
        cancel();
        lastError = err;

        if (attempt < this.maxRetries) {
          const delayMs = jitterDelay(
            Math.min(this.maxDelayMs, this.minDelayMs * 2 ** attempt)
          );
          this.logger?.warn(
            { url, attempt, delayMs, err: serializeError(err) },
            "Retrying Jira request after network error"
          );
          await sleep(delayMs);
          continue;
        }

        throw err;
      }
    }

    throw lastError;
  }
}

function shouldRetry(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function computeRetryDelay(
  response: Response,
  attempt: number,
  minDelayMs: number,
  maxDelayMs: number
): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const parsed = Number.parseInt(retryAfter, 10);
    if (!Number.isNaN(parsed)) {
      return clamp(parsed * 1000, minDelayMs, maxDelayMs);
    }
    const retryDate = Date.parse(retryAfter);
    if (!Number.isNaN(retryDate)) {
      const delta = retryDate - Date.now();
      return clamp(delta, minDelayMs, maxDelayMs);
    }
  }

  const rateLimitReset = response.headers.get("x-rate-limit-reset");
  if (rateLimitReset) {
    const resetSeconds = Number.parseInt(rateLimitReset, 10);
    if (!Number.isNaN(resetSeconds)) {
      const delta = resetSeconds * 1000 - Date.now();
      return clamp(delta, minDelayMs, maxDelayMs);
    }
  }

  const baseDelay = Math.min(maxDelayMs, minDelayMs * 2 ** attempt);
  return jitterDelay(baseDelay);
}

function jitterDelay(baseDelay: number): number {
  return Math.max(0, baseDelay + Math.floor(Math.random() * 250));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function withTimeout(timeoutMs: number): {
  signal: AbortSignal;
  cancel: () => void;
} {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timeout)
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message };
  }
  return { value: err };
}
