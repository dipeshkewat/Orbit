"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const onboardingStep = useAuthStore((state) => state.onboardingStep);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const isAuthRoute = pathname === "/login";
    const isOnboardingRoute = pathname === "/onboarding";

    if (!isAuthenticated) {
      if (!isAuthRoute) {
        router.replace("/login");
      }
    } else {
      if (onboardingStep > 0) {
        if (!isOnboardingRoute) {
          router.replace("/onboarding");
        }
      } else {
        if (isAuthRoute || isOnboardingRoute) {
          router.replace("/");
        }
      }
    }
  }, [isAuthenticated, onboardingStep, pathname, isMounted, router]);

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
  const isOnboardingRoute = pathname === "/onboarding";

  if (!isAuthenticated && !isAuthRoute) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-background)]">
        <Sparkles className="h-8 w-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && onboardingStep > 0 && !isOnboardingRoute) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-background)]">
        <Sparkles className="h-8 w-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
