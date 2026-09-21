import { describe, expect, test } from "vitest";
import { canScheduleApproval } from "./approval-policy";

describe("post approval scheduling policy", () => {
  test("allows posts with no approval workflow", () => {
    expect(canScheduleApproval("none")).toBe(true);
  });

  test("allows approved posts", () => {
    expect(canScheduleApproval("approved")).toBe(true);
  });

  test("blocks pending and rejected posts", () => {
    expect(canScheduleApproval("pending")).toBe(false);
    expect(canScheduleApproval("rejected")).toBe(false);
  });
});