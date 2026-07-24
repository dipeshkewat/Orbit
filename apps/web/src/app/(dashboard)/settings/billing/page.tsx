"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import {
  CreditCard,
  Zap,
  CheckCircle,
  ExternalLink,
  Coins,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["3 Social Channels", "1 Workspace Seat", "20 Monthly AI Credits", "Post Scheduling"]
  },
  {
    id: "creator",
    name: "Creator",
    price: "$19",
    period: "month",
    features: ["10 Social Channels", "3 Workspace Seats", "200 Monthly AI Credits", "AI Caption Generator", "Best Time scheduling"],
    popular: true
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "month",
    features: ["25 Social Channels", "Unlimited Workspace Seats", "1,000 Monthly AI Credits", "AI Image Generation (Flux)", "Bulk CSV Scheduler", "Outbound Developer Webhooks"]
  },
  {
    id: "agency",
    name: "Agency",
    price: "$99",
    period: "month",
    features: ["100 Social Channels", "Unlimited Seats", "5,000 Monthly AI Credits", "White-Label PDF Reports", "Dedicated API rate limit", "SLA Priority Support"]
  }
];

export default function SettingsBillingPage() {
  const workspace = useAuthStore((state) => {
    const active = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
    return active || state.workspaces[0];
  });

  const [isLoadingPlan, setIsLoadingPlan] = useState<string | null>(null);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const handleSimulateCheckout = (planId: string) => {
    if (workspace.plan === planId) {
      toast.info(`Already subscribed to the ${planId} plan`);
      return;
    }

    setIsLoadingPlan(planId);
    setTimeout(() => {
      // Update plan in Zustand
      useAuthStore.setState((state) => {
        const limits: Record<string, number> = { free: 20, creator: 200, pro: 1000, agency: 5000 };
        return {
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? { ...w, plan: planId as any, aiCreditsLimit: limits[planId] || 20, aiCreditsUsed: 0 }
              : w
          )
        };
      });
      setIsLoadingPlan(null);
      toast.success(`Upgraded workspace successfully to: ${planId.toUpperCase()}!`);
    }, 800);
  };

  const handleSimulatePortal = () => {
    setIsLoadingPortal(true);
    setTimeout(() => {
      setIsLoadingPortal(false);
      toast.success("Redirected to Stripe Customer Billing Portal!");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage subscriptions, invoices, and visual pricing details.
        </p>
      </div>

      {/* Tab bar header */}
      <div className="flex gap-1.5 border-b border-[var(--color-border)] pb-3 overflow-x-auto">
        <Link href="/settings" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
          General
        </Link>
        <Link href="/settings/accounts" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
          Connected Accounts
        </Link>
        <Link href="/settings/team" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
          Team Members
        </Link>
        <Link href="/settings/billing" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-[var(--color-surface-hover)] text-[var(--color-text)]">
          Billing & Plans
        </Link>
        <Link href="/settings/developer" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text(--color-text-secondary)">
          Developer API
        </Link>
      </div>

      {/* Subscription Info Header Card */}
      <div className="glass rounded-[var(--radius-lg)] p-5 grid gap-4 sm:grid-cols-3 items-center">
        <div>
          <span className="block text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Active Workspace Plan</span>
          <span className="text-xl font-extrabold capitalize text-[var(--color-primary-light)] mt-1 block flex items-center gap-1.5">
            <ShieldCheck className="h-5 w-5 text-[var(--color-success)]" />
            {workspace.plan} Tier
          </span>
        </div>

        <div>
          <span className="block text-xs uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Monthly AI Credits</span>
          <span className="text-sm font-semibold text-[var(--color-text-secondary)] mt-1 block flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-[var(--color-accent)]" />
            {workspace.aiCreditsLimit - workspace.aiCreditsUsed} left ({workspace.aiCreditsUsed}/{workspace.aiCreditsLimit} used)
          </span>
        </div>

        <div className="sm:text-right">
          <button
            onClick={handleSimulatePortal}
            disabled={isLoadingPortal || workspace.plan === "free"}
            className="inline-flex items-center justify-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-xs font-semibold text-[var(--color-text-secondary)] px-4 py-2.5 rounded-[var(--radius-md)] disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4" />
            Stripe Portal
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Pricing Grid */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">Subscription pricing plans</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isActive = workspace.plan === plan.id;
            const isUpgrading = isLoadingPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`glass rounded-[var(--radius-lg)] p-5 flex flex-col justify-between relative ${
                  plan.popular ? "ring-2 ring-[var(--color-primary)]" : ""
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{plan.name}</span>
                    <div className="flex items-baseline mt-1.5">
                      <span className="text-3xl font-extrabold text-[var(--color-text)]">{plan.price}</span>
                      <span className="text-xs text-[var(--color-text-muted)] ml-1">/ {plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 pt-2 text-xs text-[var(--color-text-secondary)] font-medium">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-[var(--color-success)] shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSimulatePlan(plan.id)}
                  disabled={!!isLoadingPlan}
                  className={`w-full text-xs font-bold py-2.5 rounded-[var(--radius-md)] mt-6 transition-all ${
                    isActive
                      ? "bg-[var(--color-success)]/10 border border-[var(--color-success)] text-[var(--color-success)]"
                      : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] active:scale-95"
                  }`}
                >
                  {isActive ? "Active Plan" : isUpgrading ? "Upgrading..." : "Select Plan"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  function handleSimulatePlan(id: string) {
    handleSimulateCheckout(id);
  }
}
