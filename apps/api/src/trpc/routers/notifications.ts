import { z } from "zod";
import { TrpcService } from "../trpc.service";

export function createNotificationsRouter(trpc: TrpcService) {
  return trpc.router({
    list: trpc.protectedProcedure.query(async () => {
      return [
        {
          id: "not_1",
          title: "Post Published Successfully",
          body: "Your post to Instagram and LinkedIn was published on schedule.",
          read: false,
          createdAt: new Date(),
        },
      ];
    }),

    markRead: trpc.protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        return { success: true, id: input.id };
      }),

    markAllRead: trpc.protectedProcedure.mutation(async () => {
      return { success: true };
    }),
  });
}
