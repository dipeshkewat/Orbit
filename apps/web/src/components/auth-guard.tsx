"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Sync Zustand state with sandbox cookie
    const hasBypassCookie = document.cookie.includes("sb_bypass=true");
    if (useAuthStore.getState().isAuthenticated && !hasBypassCookie) {
      useAuthStore.getState().logout();
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const isAuthRoute = pathname === "/login";
    const isOnboardingRoute = pathname === "/onboarding";
    const isPublicRoute = pathname === "/";

    if (!isAuthenticated) {
      if (!isAuthRoute && !isPublicRoute) {
        router.replace("/login");
      }
    } else {
      if (isAuthRoute || isOnboardingRoute) {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, pathname, isMounted, router]);

  // Prevent flash of unauthenticated content during hydration
  if (!isMounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-background)]">
        <Sparkles className="h-8 w-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  // Check auth path visibility
  const isAuthRoute = pathname === "/login";
  const isPublicRoute = pathname === "/";

  if (!isAuthenticated && !isAuthRoute && !isPublicRoute) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-background)]">
        <Sparkles className="h-8 w-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
