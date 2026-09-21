"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const token = searchParams.get("token") ?? "";
  const workspaceId = searchParams.get("workspaceId") ?? "";
  const acceptMutation = trpc.workspace.acceptInvite.useMutation();

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const isValidInput = useMemo(() => {
    return Boolean(token && workspaceId && workspaceId.length > 0);
  }, [token, workspaceId]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      const next = `/login?redirectUrl=${encodeURIComponent(`/accept-invite?token=${encodeURIComponent(token)}&workspaceId=${encodeURIComponent(workspaceId)}`)}`;
      router.replace(next);
      return;
    }

    if (!isValidInput) {
      setStatus("error");
      return;
    }

    acceptMutation.mutate(
      { workspaceId, token },
      {
        onSuccess: () => {
          setStatus("success");
          toast.success("Workspace invite accepted.");
          setTimeout(() => router.replace("/dashboard"), 1200);
        },
        onError: (error) => {
          setStatus("error");
          toast.error(error.message || "The invite could not be accepted.");
        },
      },
    );
  }, [acceptMutation, isLoaded, isSignedIn, isValidInput, router, token, workspaceId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        {status === "success" ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Invite accepted</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Welcome aboard. You will be redirected to your dashboard shortly.
              </p>
            </div>
          </div>
        ) : status === "error" ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-500">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Invitation unavailable</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                This invite link is missing, expired, or linked to a different account.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 w-full rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-text-inverse)]"
            >
              Go to dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Accepting invite…</h1>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {user?.emailAddresses?.[0]?.emailAddress ?? "Checking your account..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
