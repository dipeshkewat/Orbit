export function canScheduleApproval(approvalStatus: string): boolean {
  return approvalStatus !== "pending" && approvalStatus !== "rejected";
}
