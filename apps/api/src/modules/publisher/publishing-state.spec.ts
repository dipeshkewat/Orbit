import { describe, expect, test } from "vitest";
import { isFinalAttempt, resolvePostStatus } from "./publishing-state";

describe("publishing state policy", () => {
  test("identifies the final BullMQ attempt", () => {
    expect(isFinalAttempt(0, 3)).toBe(false);
    expect(isFinalAttempt(2, 3)).toBe(true);
    expect(isFinalAttempt(4, 0)).toBe(true);
  });

  test("keeps a post retrying while any job can retry", () => {
    expect(resolvePostStatus(["published", "retrying"], true)).toBe("retrying");
  });

  test("fails permanently when all jobs are terminal failures", () => {
    expect(resolvePostStatus(["published", "failed"], false)).toBe("failed");
  });

  test("publishes only when every job is published", () => {
    expect(resolvePostStatus(["published", "published"], false)).toBe("published");
  });
});