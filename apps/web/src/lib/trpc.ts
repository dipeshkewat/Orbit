import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../api/src/trpc/trpc.router";

/**
 * React hooks wrapper for type-safe tRPC client.
 * Uses AppRouter type definition from NestJS backend.
 */
export const trpc = createTRPCReact<AppRouter>();
