"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { OrbitLogo } from "@/components/logo";
import { useRouter } from "next/navigation";
import {
  Shield,
  Sparkles,
  ArrowRight,
  Terminal,
  Cpu
} from "lucide-react";

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
      login(email, name);
      setIsLoading(false);
      router.push("/onboarding");
    }, 800);
  };

  const handleDemoAccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      document.cookie = "sb_bypass=true; path=/; max-age=86400";
      login("demo@orbit.com", "Demo User");
      useAuthStore.getState().setOnboardingStep(1);
      setIsLoading(false);
      router.push("/dashboard");
    }, 500);
  };

  return (
    <div className="relative min-h-screen bg-[#fafafa] text-[#18181b] font-sans flex items-center justify-center p-6 overflow-hidden">
      {/* Background Grid Pattern (zinc-200 lines) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Production Dashboard Grid */}
      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Brand & Terminal Diagnostics */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8 p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <OrbitLogo size={16} className="text-[#18181b] shrink-0" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#71717a]">SYSTEM STATUS // SECURE</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold uppercase tracking-tighter leading-none text-[#18181b] select-none">
              ORBIT
              <span className="block text-[#71717a]">
                CAMPAIGN CONSOLE
              </span>
            </h1>
            
            <p className="text-sm text-[#71717a] max-w-[480px] leading-relaxed">
              Autonomous campaign execution system. Setup overrides, monitor schedules, audit benchmarks, and compile analytics from a minimal, unified dashboard.
            </p>
          </div>

          {/* Diagnostic Console Box (Clean Light Slate Box) */}
          <div className="border border-[#e4e4e7] bg-[#ffffff] p-5 rounded-[12px] space-y-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between border-b border-[#e4e4e7] pb-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#18181b]">
                <Terminal className="h-3.5 w-3.5 text-[#18181b]" />
                System Diagnostic logs
              </div>
              <span className="text-[9px] text-[#71717a] font-bold">NODE: ss_core_prod</span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-[#71717a]">
              <p className="flex items-center gap-2 text-[#18181b]">
                <span className="text-[#a1a1aa]">●</span> [SYS_INIT] Loading database schema drivers... OK.
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#a1a1aa]">●</span> [AUTH] Active session hooks connected to Clerk guards.
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#a1a1aa]">●</span> [SCHEDULER] BullMQ processor active on post_publish.
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#a1a1aa]">●</span> [AI] Google Gemini 1.5 wrapper interface online.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Login Console Wrapper */}
        <div className="lg:col-span-5 flex items-center justify-center">
          {/* Flat Minimal Card Wrapper matching Reference Style */}
          <div className="w-full bg-[#ffffff] border border-[#e4e4e7] p-8 rounded-[16px] shadow-[0_10px_30px_rgba(0,0,0,0.04)] space-y-6">
            
            {/* Box Title */}
            <div className="space-y-1 border-b border-[#e4e4e7] pb-4">
              <h3 className="text-base font-bold uppercase tracking-wider text-[#18181b] flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-[#18181b]" />
                Access Portal
              </h3>
              <p className="text-[10px] text-[#71717a] uppercase font-bold tracking-wider">Operator Credentials Requested</p>
            </div>

            {/* Form Input Cards */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#71717a] mb-1.5">
                  Operator Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#ffffff] border border-[#e4e4e7] text-xs text-[#18181b] placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#18181b] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#71717a] mb-1.5">
                  Operator Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#ffffff] border border-[#e4e4e7] text-xs text-[#18181b] placeholder:text-[#a1a1aa] focus:outline-none focus:border-[#18181b] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#27272a] text-[#ffffff] text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-[8px] transition-all disabled:opacity-50"
              >
                {isLoading ? "Validating Session..." : "Initialize Dashboard"}
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </form>

            {/* Console Divider */}
            <div className="flex items-center justify-between text-[9px] text-[#a1a1aa] font-bold">
              <span className="w-1/4 border-b border-[#e4e4e7]" />
              <span className="uppercase tracking-wider">Demo Access</span>
              <span className="w-1/4 border-b border-[#e4e4e7]" />
            </div>

            {/* Demo Sandbox Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDemoAccess}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[8px] border border-[#e4e4e7] bg-[#ffffff] hover:bg-[#f4f4f5] text-[10px] font-bold uppercase tracking-wider text-[#18181b] transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#71717a]" />
                Quick Sandbox
              </button>
              <button
                type="button"
                onClick={handleDemoAccess}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[8px] border border-[#e4e4e7] bg-[#ffffff] hover:bg-[#f4f4f5] text-[10px] font-bold uppercase tracking-wider text-[#18181b] transition-colors"
              >
                <Shield className="h-3.5 w-3.5 text-[#71717a]" />
                Secure Bypass
              </button>
            </div>

            {/* Footer specs */}
            <div className="pt-2 text-center text-[9px] text-[#a1a1aa] font-bold uppercase tracking-wider">
              Connections log details for auditing metrics.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
