import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(async (callback: (transaction: typeof prismaMock) => unknown) => callback(prismaMock)),
  post: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  teamMember: {
    findFirst: vi.fn(),
  },
  activityLog: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@orbit/db", () => ({
  prisma: prismaMock,
}));

import { PostsService } from "./posts.service";

describe("PostsService collaboration flow", () => {
  const service = new PostsService({
    schedulePost: vi.fn(),
    cancelScheduledPost: vi.fn(),
  } as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("addComment creates a workspace-scoped post comment", async () => {
    prismaMock.post.findFirst.mockResolvedValue({ id: "post-1", workspaceId: "workspace-1" });
    prismaMock.activityLog.create.mockResolvedValue({
      id: "comment-1",
      workspaceId: "workspace-1",
      userId: "user-1",
      action: "post.comment.added",
      entityType: "post",
      entityId: "post-1",
      metadata: { text: "Looks good." },
    });

    await expect(
      service.addComment("workspace-1", "post-1", "user-1", "Looks good."),
    ).resolves.toMatchObject({
      action: "post.comment.added",
      metadata: { text: "Looks good." },
    });

    expect(prismaMock.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workspaceId: "workspace-1",
        userId: "user-1",
        action: "post.comment.added",
        entityType: "post",
        entityId: "post-1",
        metadata: { text: "Looks good." },
      }),
    });
  });

  test("getComments only returns comments for the matching workspace and post", async () => {
    prismaMock.activityLog.findMany.mockResolvedValue([
      {
        id: "comment-1",
        action: "post.comment.added",
        metadata: { text: "Thanks." },
        createdAt: new Date(),
        user: { name: "Alex", email: "alex@orbit.com" },
      },
    ]);

    await expect(service.getComments("workspace-1", "post-1")).resolves.toHaveLength(1);
    expect(prismaMock.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: "workspace-1",
          entityType: "post",
          entityId: "post-1",
          action: "post.comment.added",
        }),
      }),
    );
  });

  test("assignPost rejects users who are not active workspace members", async () => {
    prismaMock.post.findFirst.mockResolvedValue({ id: "post-1" });
    prismaMock.teamMember.findFirst.mockResolvedValue(null);

    await expect(
      service.assignPost("workspace-1", "post-1", "user-2", "user-1"),
    ).rejects.toThrow("active workspace member");
    expect(prismaMock.post.update).not.toHaveBeenCalled();
  });

  test("assignPost updates the post and records the assignment", async () => {
    prismaMock.post.findFirst.mockResolvedValue({ id: "post-1" });
    prismaMock.teamMember.findFirst.mockResolvedValue({ userId: "user-2" });
    prismaMock.post.update.mockResolvedValue({ id: "post-1", assignedToId: "user-2" });
    prismaMock.activityLog.create.mockResolvedValue({ id: "activity-1" });

    await expect(
      service.assignPost("workspace-1", "post-1", "user-2", "user-1"),
    ).resolves.toMatchObject({ assignedToId: "user-2" });
    expect(prismaMock.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "post.assigned",
        metadata: { assigneeId: "user-2" },
      }),
    });
  });
});
