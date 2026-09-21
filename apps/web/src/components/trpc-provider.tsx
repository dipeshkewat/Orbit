"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useAuth } from "@clerk/nextjs";
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  // Ensure QueryClient is instantiated once per component lifecycle
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: process.env.NEXT_PUBLIC_API_URL 
            ? `${process.env.NEXT_PUBLIC_API_URL}/trpc`
            : "http://localhost:3001/trpc",
          async headers() {
            const token = await getToken();
            return {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
