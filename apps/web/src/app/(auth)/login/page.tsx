"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { OrbitLogo } from "@/components/logo";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setIsLoading(true);
    setTimeout(() => {
      document.cookie = "sb_bypass=true; path=/; max-age=86400";
      login(email, name);
      useAuthStore.getState().setOnboardingStep(0);
      setIsLoading(false);
      router.push("/dashboard");
    }, 800);
  };

  const handleDemoAccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      document.cookie = "sb_bypass=true; path=/; max-age=86400";
      login("demo@orbit.com", "Demo User");
      useAuthStore.getState().setOnboardingStep(0);
      setIsLoading(false);
      router.push("/dashboard");
    }, 500);
  };

  return (
    <div className="relative min-h-screen bg-[var(--color-background)] text-[var(--color-text)] font-sans flex items-center justify-center p-6 overflow-hidden">
      {/* Subtle ambient orb */}
      <div
        className="glow-bg"
        style={{
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "50%",
          height: "40%",
          backgroundColor: "rgba(99,102,241,0.08)",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo + brand */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[var(--color-primary)]"
          >
            <OrbitLogo size={24} className="text-white" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Sign in to Orbit</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Manage all your social media from one place
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold py-3 px-4 rounded-[var(--radius-md)] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Signing in…" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-muted)]">or</span>
            <span className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          {/* Demo access */}
          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-hover)] hover:bg-[var(--color-border)] text-sm font-medium text-[var(--color-text)] transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
            Try the demo
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[var(--color-text-muted)] mt-6">
          By continuing, you agree to Orbit's Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
