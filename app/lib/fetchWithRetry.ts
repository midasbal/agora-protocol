/**
 * fetchWithRetry — Resilient HTTP wrapper with exponential backoff.
 *
 * Used by all Locus API routes to handle transient network errors
 * and beta-environment instability without hard-failing the trade.
 */

interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before the first retry (default: 500) */
  initialDelayMs?: number;
  /** Backoff multiplier applied after each retry (default: 2) */
  backoffFactor?: number;
  /** Maximum delay cap in ms (default: 8000) */
  maxDelayMs?: number;
  /** HTTP status codes that should NOT be retried (e.g. 400, 401) */
  nonRetryableStatuses?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 500,
  backoffFactor: 2,
  maxDelayMs: 8000,
  nonRetryableStatuses: [400, 401, 403, 404, 422],
};

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelayMs;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const response = await fetch(url, init);

      // If response is OK or a non-retryable client error, return immediately
      if (response.ok || opts.nonRetryableStatuses.includes(response.status)) {
        return response;
      }

      // Server error (5xx) — eligible for retry
      if (attempt < opts.maxRetries) {
        console.warn(
          `[fetchWithRetry] Attempt ${attempt + 1}/${opts.maxRetries + 1} failed with status ${response.status} for ${url}. Retrying in ${delay}ms ...`
        );
        await sleep(delay);
        delay = Math.min(delay * opts.backoffFactor, opts.maxDelayMs);
        continue;
      }

      // Final attempt failed — return the response as-is
      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < opts.maxRetries) {
        console.warn(
          `[fetchWithRetry] Attempt ${attempt + 1}/${opts.maxRetries + 1} threw for ${url}: ${lastError.message}. Retrying in ${delay}ms ...`
        );
        await sleep(delay);
        delay = Math.min(delay * opts.backoffFactor, opts.maxDelayMs);
      }
    }
  }

  throw lastError ?? new Error(`fetchWithRetry: All ${opts.maxRetries + 1} attempts failed for ${url}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
