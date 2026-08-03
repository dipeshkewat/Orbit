"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { OrbitLogo } from "@/components/logo";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, Eye, EyeOff, Check } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const demoLogin = useAuthStore((state) => state.demoLogin);
  const setOnboardingStep = useAuthStore((state) => state.setOnboardingStep);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordChecks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains a number", met: /\d/.test(password) },
    { label: "Contains a letter", met: /[a-zA-Z]/.test(password) },
  ];

  const allChecksMet = passwordChecks.every((c) => c.met);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !password || !allChecksMet) return;
    setIsLoading(true);

    setTimeout(() => {
      document.cookie = "sb_bypass=true; path=/; max-age=86400";
      login(email, name);
      setOnboardingStep(1); // new user -> start onboarding
      setIsLoading(false);
      router.push("/onboarding");
    }, 600);
  };

  const handleDemoAccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      demoLogin();
      setIsLoading(false);
      router.push("/dashboard");
    }, 400);
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
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[var(--color-primary)]">
              <OrbitLogo size={24} className="text-[var(--color-text-inverse)]" />
            </div>
          </Link>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Start managing your social media with Orbit
            </p>
          </div>
        </div>

        {/* Signup card */}
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

            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength indicators */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2 text-xs">
                      <Check
                        className={`h-3 w-3 ${check.met ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}`}
                      />
                      <span className={check.met ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !allChecksMet}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-inverse)] text-sm font-semibold py-3 px-4 rounded-[var(--radius-md)] transition-colors disabled:opacity-50"
            >
              {isLoading ? "Creating account…" : "Create account"}
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
            Try the demo instantly
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            By creating an account, you agree to Orbit&apos;s Terms &amp; Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
