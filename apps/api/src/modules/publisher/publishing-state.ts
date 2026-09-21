export type PublishingOutcome = "published" | "retrying" | "failed";

export function isFinalAttempt(attemptsMade: number, maxAttempts: number): boolean {
  return attemptsMade + 1 >= Math.max(1, maxAttempts);
}

export function resolvePostStatus(
  jobStatuses: readonly string[],
  hasRetryableFailure: boolean,
): PublishingOutcome {
  if (jobStatuses.length > 0 && jobStatuses.every((status) => status === "published")) {
    return "published";
  }
  return hasRetryableFailure ? "retrying" : "failed";
}
