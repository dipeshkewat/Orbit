import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  teamMember: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  workspace: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@orbit/db", () => ({
  prisma: prismaMock,
}));

import { WorkspaceService } from "./workspace.service";
import { EntitlementService } from "../billing/entitlement.service";

describe("WorkspaceService invite acceptance", () => {
  const service = new WorkspaceService(new EntitlementService());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("acceptInvite upgrades a pending invite to an accepted workspace membership", async () => {
    const token = service.createInviteToken("workspace-123", "alex@orbit.com");

    // Seat enforcement reads the workspace plan before accepting.
    prismaMock.workspace.findUnique.mockResolvedValue({ plan: "free" });
    prismaMock.teamMember.count.mockResolvedValue(0);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "real-user-id",
      clerkId: "clerk-123",
      email: "alex@orbit.com",
      name: "Alex",
    });

    prismaMock.teamMember.findFirst
      .mockResolvedValueOnce({
        id: "member-1",
        workspaceId: "workspace-123",
        userId: "placeholder-user-id",
        inviteEmail: "alex@orbit.com",
        inviteStatus: "pending",
        role: "editor",
      })
      .mockResolvedValueOnce(null);

    prismaMock.teamMember.update.mockResolvedValue({
      id: "member-1",
      workspaceId: "workspace-123",
      userId: "real-user-id",
      inviteStatus: "accepted",
      joinedAt: new Date(),
    });

    await expect(service.acceptInvite("workspace-123", token, "clerk-123")).resolves.toMatchObject({
      success: true,
      workspaceId: "workspace-123",
      memberId: "member-1",
    });

    expect(prismaMock.teamMember.update).toHaveBeenCalledWith({
      where: { id: "member-1" },
      data: expect.objectContaining({
        userId: "real-user-id",
        inviteStatus: "accepted",
        joinedAt: expect.any(Date),
      }),
    });
  });

  test("acceptInvite rejects a token whose email does not match the signed-in user", async () => {
    const token = service.createInviteToken("workspace-123", "alex@orbit.com");

    prismaMock.user.findUnique.mockResolvedValue({
      id: "real-user-id",
      clerkId: "clerk-123",
      email: "other@orbit.com",
      name: "Other",
    });

    await expect(service.acceptInvite("workspace-123", token, "clerk-123")).rejects.toMatchObject({
      response: {
        statusCode: 403,
      },
    });
  });

  test("inviteMember blocks new invites when a free workspace has reached its seat limit", async () => {
    prismaMock.workspace.findUnique.mockResolvedValue({ plan: "free" });
    prismaMock.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "owner-id", email: "owner@orbit.com" });
    prismaMock.teamMember.findUnique.mockResolvedValue(null);
    prismaMock.teamMember.count.mockResolvedValue(1);

    await expect(service.inviteMember("workspace-123", "new@orbit.com", "editor")).rejects.toMatchObject({
      response: {
        statusCode: 409,
      },
    });
  });
});
