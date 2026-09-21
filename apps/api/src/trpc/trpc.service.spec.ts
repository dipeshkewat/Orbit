import { describe, expect, test, vi } from "vitest";
import { TrpcService, TrpcContext } from "./trpc.service";

function createContext(
  member: { id: string; role: string } | null,
): TrpcContext {
  const prismaStub = {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: "db-user-id" }),
    },
    teamMember: {
      findFirst: vi.fn().mockResolvedValue(member),
    },
  };

  return {
    userId: "clerk-user-id",
    prisma: prismaStub as unknown as TrpcContext["prisma"],
  };
}

describe("TrpcService workspace authorization", () => {
  const service = new TrpcService();

  test("allows an accepted workspace member", async () => {
    const result = await service.authorizeWorkspace(
      createContext({ id: "member-id", role: "viewer" }),
      "workspace-id",
    );

    expect(result).toEqual({ userId: "db-user-id", role: "viewer" });
  });

  test("denies access when the user is not a workspace member", async () => {
    await expect(
      service.authorizeWorkspace(createContext(null), "workspace-id"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("denies viewer mutations", async () => {
    await expect(
      service.authorizeWorkspaceMutation(
        createContext({ id: "member-id", role: "viewer" }),
        "workspace-id",
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("allows editor mutations", async () => {
    const result = await service.authorizeWorkspaceMutation(
      createContext({ id: "member-id", role: "editor" }),
      "workspace-id",
    );

    expect(result.role).toBe("editor");
  });
});
