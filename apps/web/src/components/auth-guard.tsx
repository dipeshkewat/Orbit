"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/accept-invite"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setIsMounted(true));
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!isAuthenticated && !isPublicRoute(pathname)) {
      // Unauthenticated user trying to access protected route
      router.replace("/login");
    } else if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
      // Authenticated user on auth pages -> send to dashboard
      router.replace("/dashboard");
    }
  }, [isAuthenticated, pathname, isMounted, router]);

  // Prevent flash during hydration
  if (!isMounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-background)]">
        <Sparkles className="h-8 w-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  // Block rendering of protected content for unauthenticated users
  if (!isAuthenticated && !isPublicRoute(pathname)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-background)]">
        <Sparkles className="h-8 w-8 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
