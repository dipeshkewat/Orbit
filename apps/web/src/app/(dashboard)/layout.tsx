"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@socialsphear/ui";
import { OrbitLogo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette, CommandPaletteTrigger } from "@/components/command-palette";
import { useAuthStore, useNotificationStore } from "@/lib/store";
import {
  LayoutDashboard,
  Calendar,
  PenSquare,
  BarChart3,
  Inbox,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  Plus,
  LogOut,
  Building,
  User,
  X,
  Brain,
  HelpCircle,
  MoreHorizontal,
  Users,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Twitter,
  Github,
} from "lucide-react";
import { toast } from "sonner";
import { SignedIn, SignedOut, UserButton, SignInButton, ClerkLoaded, useClerk } from "@clerk/nextjs";

/* ─── Primary Navigation ─── */
const PRIMARY_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/composer", label: "Composer", icon: PenSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/ai-studio", label: "AI Studio", icon: Sparkles },
] as const;

const MORE_NAV = [
  { href: "/content-planner", label: "Content Planner", icon: Brain },
  { href: "/competitors", label: "Competitors", icon: Users },
] as const;

const PINNED_NAV = [
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const MOBILE_TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/composer", label: "New Post", icon: Plus, accent: true },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-xs font-semibold transition-all",
        isActive
          ? "bg-[#111318] text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
        collapsed && "justify-center px-2",
      )}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? label : undefined}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-gray-500")} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const workspaces = useAuthStore((state) => state.workspaces);
  const activeWorkspaceId = useAuthStore((state) => state.activeWorkspaceId);
  const setWorkspace = useAuthStore((state) => state.setWorkspace);
  const createWorkspace = useAuthStore((state) => state.createWorkspace);

  const [showWsDropdown, setShowWsDropdown] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [showNewWsModal, setShowNewWsModal] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const moreChildActive = MORE_NAV.some((item) => isActive(item.href));
  const moreExpanded = moreOpen || moreChildActive;

  const handleCreateWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    createWorkspace(newWsName);
    toast.success(`Workspace "${newWsName}" created!`);
    setNewWsName("");
    setShowNewWsModal(false);
  };

  const { signOut } = useClerk();

  const handleLogout = async () => {
    document.cookie = "sb_bypass=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    try {
      await signOut();
    } catch {
      // Ignore
    }
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col border-r border-gray-200 bg-[#F8F9FA] dark:bg-[#131826] dark:border-gray-800 transition-all duration-300",
        collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]",
      )}
    >
      {/* Brand Header */}
      <div className="flex h-[var(--header-height)] items-center gap-3 border-b border-gray-200 dark:border-gray-800 px-4 shrink-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111318] text-white">
          <OrbitLogo size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
            Orbit
          </span>
        )}
      </div>

      {/* Workspace Selector */}
      <div className="px-3 pt-3 shrink-0 relative">
        <button
          onClick={() => !collapsed && setShowWsDropdown(!showWsDropdown)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors",
            collapsed && "justify-center px-1"
          )}
        >
          <Building className="h-3.5 w-3.5 shrink-0 text-gray-500" />
          {!collapsed && (
            <>
              <span className="truncate max-w-[120px]">{activeWorkspace?.name}</span>
              <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform text-gray-400", showWsDropdown && "rotate-90")} />
            </>
          )}
        </button>

        {showWsDropdown && !collapsed && (
          <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 p-1.5 shadow-lg space-y-1">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setWorkspace(ws.id);
                  setShowWsDropdown(false);
                  toast.success(`Switched to: ${ws.name}`);
                }}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                  ws.id === activeWorkspaceId ? "text-gray-900 font-bold bg-gray-100 dark:bg-gray-800 dark:text-white" : "text-gray-600 dark:text-gray-400"
                )}
              >
                {ws.name}
              </button>
            ))}
            <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
            <button
              onClick={() => {
                setShowWsDropdown(false);
                setShowNewWsModal(true);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-gray-800 flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Workspace
            </button>
          </div>
        )}
      </div>

      {/* Primary Navigation */}
      <nav className="mt-4 flex flex-col gap-1 px-3">
        {PRIMARY_NAV.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}

        {!collapsed ? (
          <div>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                moreChildActive
                  ? "text-gray-900 font-bold"
                  : "text-gray-600 hover:bg-gray-200/60 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
              )}
            >
              <MoreHorizontal className="h-4 w-4 shrink-0 text-gray-500" />
              <span>More</span>
              <ChevronDown className={cn("h-3 w-3 ml-auto transition-transform text-gray-400", moreExpanded && "rotate-180")} />
            </button>
            {moreExpanded && (
              <div className="ml-3 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-800 pl-3">
                {MORE_NAV.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={isActive(item.href)}
                    collapsed={false}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          MORE_NAV.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive(item.href)}
              collapsed={true}
            />
          ))
        )}
      </nav>

      {/* Flexible Spacer */}
      <div className="flex-1" />

      {/* Pinned Footer & Metadata — Matching Inspiration */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 shrink-0 space-y-2">
        {PINNED_NAV.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}

        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors",
            collapsed && "justify-center px-2"
          )}
          title="Sign Out"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {!collapsed && (
          <div className="pt-2 border-t border-gray-200/80 dark:border-gray-800/80 space-y-2 text-[11px] text-gray-400">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-gray-500">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <ShieldCheck className="h-3 w-3 text-blue-500" />
                <span>Encrypted</span>
              </div>
            </div>
            <div className="flex items-center justify-between px-1 pt-1 border-t border-gray-100 dark:border-gray-800">
              <span>© 2026 Orbit</span>
              <div className="flex items-center gap-2 text-gray-400">
                <Github className="h-3 w-3 hover:text-gray-600 transition-colors" />
                <Twitter className="h-3 w-3 hover:text-gray-600 transition-colors" />
                <Globe className="h-3 w-3 hover:text-gray-600 transition-colors" />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg py-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Create Workspace Modal */}
      {showNewWsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateWorkspaceSubmit} className="w-full max-w-[360px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative shadow-xl">
            <button
              type="button"
              onClick={() => setShowNewWsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Create Workspace</h3>
            <input
              type="text"
              required
              placeholder="Workspace Name"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:border-gray-900 transition-colors mb-4"
            />
            <button
              type="submit"
              className="w-full bg-[#111318] text-white font-semibold text-xs py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Confirm Create
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}

function Header() {
  const user = useAuthStore((state) => state.user);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [showNotif, setShowNotif] = useState(false);

  const handleMarkRead = (id: string) => {
    markAsRead(id);
    toast.success("Marked as read");
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success("All notifications read");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-[#F4F5F8]/80 dark:bg-[#0B0F19]/80 px-4 md:px-6 backdrop-blur-md shrink-0">
      {/* Search & Status Pill */}
      <div className="flex items-center gap-3">
        <CommandPaletteTrigger />
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Orbit v2.0 • Operational</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 relative">
        {/* Solid Dark Pill Primary CTA — Matching Inspiration */}
        <Link
          href="/composer"
          className="flex items-center gap-1.5 bg-[#111318] hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          New Post
        </Link>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications Button */}
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {showNotif && (
          <div className="absolute right-12 top-full mt-2 w-80 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xl z-50 space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
              <span className="text-xs font-bold text-gray-900 dark:text-white">Recent Alerts</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs font-semibold text-emerald-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={cn(
                    "p-2.5 rounded-lg border text-xs cursor-pointer transition-colors relative",
                    n.read
                      ? "bg-transparent border-transparent text-gray-400"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  )}
                >
                  {!n.read && (
                    <span className="absolute left-1 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                  <span className="block font-bold">{n.title}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="py-4 text-center text-xs text-gray-400">No recent alerts.</p>
              )}
            </div>
          </div>
        )}

        {/* User button */}
        <div className="flex items-center gap-2">
          <ClerkLoaded>
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-xs font-bold px-3.5 py-2 bg-[#111318] text-white rounded-lg hover:bg-gray-800 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </ClerkLoaded>
        </div>
      </div>
    </header>
  );
}

function MobileTabBar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex md:hidden items-center justify-around border-t border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 h-16 px-2 safe-area-pb">
      {MOBILE_TABS.map((tab) => {
        const active = isActive(tab.href);
        const isAccent = "accent" in tab && tab.accent;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors",
              isAccent
                ? "text-white"
                : active
                  ? "text-gray-900 font-bold dark:text-white"
                  : "text-gray-400",
            )}
          >
            {isAccent ? (
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#111318] text-white -mt-5 shadow-md">
                <tab.icon className="h-5 w-5" />
              </div>
            ) : (
              <tab.icon className="h-5 w-5" />
            )}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <CommandPalette />

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 min-w-0",
          collapsed ? "md:ml-[var(--sidebar-collapsed-width)]" : "md:ml-[var(--sidebar-width)]",
        )}
      >
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">{children}</main>
      </div>

      <MobileTabBar />
    </div>
  );
}
