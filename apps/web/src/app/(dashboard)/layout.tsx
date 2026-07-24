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
} from "lucide-react";
import { toast } from "sonner";
import { SignedIn, SignedOut, UserButton, SignInButton, ClerkLoaded, useClerk } from "@clerk/nextjs";

/* ─── Nav structure per §4.1: 6 primary + More overflow ─── */
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

/* Pinned utilities — bottom of sidebar, visually separated */
const PINNED_NAV = [
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/* Mobile bottom tab bar — 5 slots per §4.7 */
const MOBILE_TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/composer", label: "New", icon: Plus, accent: true },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "More", icon: MoreHorizontal },
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
        "relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
        collapsed && "justify-center px-2",
      )}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? label : undefined}
    >
      {isActive && !collapsed && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--color-primary)]" />
      )}
      <Icon className="h-5 w-5 shrink-0" />
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

  // Auto-expand "More" if a child route is active
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
      // Ignore if clerk context is not ready
    }
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-300",
        collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]",
      )}
    >
      {/* Brand Logo */}
      <div className="flex h-[var(--header-height)] items-center gap-3 border-b border-[var(--color-border)] px-4 shrink-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]">
          <OrbitLogo size={20} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-[var(--color-text)]">
            Orbit
          </span>
        )}
      </div>

      {/* Workspace Selector */}
      <div className="px-3 pt-3 shrink-0 relative">
        <button
          onClick={() => !collapsed && setShowWsDropdown(!showWsDropdown)}
          className={cn(
            "flex w-full items-center justify-between gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors",
            collapsed && "justify-center px-1"
          )}
        >
          <Building className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="truncate max-w-[120px]">{activeWorkspace?.name}</span>
              <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform", showWsDropdown && "rotate-90")} />
            </>
          )}
        </button>

        {showWsDropdown && !collapsed && (
          <div className="absolute left-3 right-3 top-full mt-1.5 z-50 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1.5 shadow-[var(--shadow-lg)] space-y-1">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setWorkspace(ws.id);
                  setShowWsDropdown(false);
                  toast.success(`Switched to workspace: ${ws.name}`);
                }}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded text-xs font-medium transition-colors hover:bg-[var(--color-surface-hover)]",
                  ws.id === activeWorkspaceId ? "text-[var(--color-primary-light)] bg-[var(--color-primary)]/10" : "text-[var(--color-text-secondary)]"
                )}
              >
                {ws.name}
              </button>
            ))}
            <div className="h-px bg-[var(--color-border)]/50 my-1" />
            <button
              onClick={() => {
                setShowWsDropdown(false);
                setShowNewWsModal(true);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Workspace
            </button>
          </div>
        )}
      </div>

      {/* New Post Button */}
      <div className="px-3 pt-3 shrink-0">
        <Link
          href="/composer"
          className={cn(
            "flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98]",
            collapsed && "px-2",
          )}
        >
          <Plus className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span>New Post</span>}
        </Link>
      </div>

      {/* Primary Navigation — capped at 6 items */}
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

        {/* More overflow group */}
        {!collapsed ? (
          <div>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
                moreChildActive
                  ? "text-[var(--color-primary-light)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
              )}
            >
              <MoreHorizontal className="h-5 w-5 shrink-0" />
              <span>More</span>
              <ChevronDown className={cn("h-3.5 w-3.5 ml-auto transition-transform", moreExpanded && "rotate-180")} />
            </button>
            {moreExpanded && (
              <div className="ml-3 mt-1 space-y-1 border-l border-[var(--color-border)] pl-3">
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
          /* In collapsed mode, show More items as direct icon links */
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Pinned bottom: Settings + Help + Sign Out */}
      <div className="border-t border-[var(--color-border)] p-3 shrink-0 space-y-1">
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
            "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors",
            collapsed && "justify-center px-2"
          )}
          title="Sign Out"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-[var(--radius-md)] py-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Create Workspace Modal */}
      {showNewWsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateWorkspaceSubmit} className="w-full max-w-[360px] glass rounded-[var(--radius-xl)] p-6 relative">
            <button
              type="button"
              onClick={() => setShowNewWsModal(false)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">Create Workspace</h3>
            <input
              type="text"
              required
              placeholder="Workspace Name"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors mb-4"
            />
            <button
              type="submit"
              className="w-full bg-[var(--color-primary)] text-white font-semibold text-xs py-2.5 rounded hover:bg-[var(--color-primary-hover)] transition-colors"
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
    toast.success("Notification marked as read");
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success("All notifications read");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 px-4 md:px-6 backdrop-blur-md shrink-0">
      {/* ⌘K search trigger */}
      <CommandPaletteTrigger />

      {/* Right Side */}
      <div className="flex items-center gap-2 relative">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Help */}
        <Link
          href="/settings"
          className="rounded-[var(--radius-md)] p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
          title="Help & support"
          aria-label="Help and support"
        >
          <HelpCircle className="h-5 w-5" />
        </Link>

        {/* Notifications Button */}
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="relative rounded-[var(--radius-md)] p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-[var(--color-error)] text-xs font-bold text-white flex items-center justify-center ring-2 ring-[var(--color-background)]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {showNotif && (
          <div className="absolute right-12 top-full mt-2 w-80 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-lg)] z-50 space-y-3">
            <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2 shrink-0">
              <span className="text-xs font-bold text-[var(--color-text)]">Recent Alerts</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs font-bold text-[var(--color-primary-light)] hover:underline">
                  Mark all read
                </button>
              )}
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={cn(
                    "p-2.5 rounded border text-xs cursor-pointer transition-colors relative",
                    n.read
                      ? "bg-transparent border-transparent text-[var(--color-text-muted)]"
                      : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  {!n.read && (
                    <span className="absolute left-1 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                  )}
                  <span className="block font-bold">{n.title}</span>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{n.message}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">No recent alerts.</p>
              )}
            </div>
          </div>
        )}

        {/* User profile */}
        <div className="flex items-center gap-2">
          <ClerkLoaded>
            <SignedIn>
              <UserButton />
              <div className="hidden sm:block text-left max-w-[140px]">
                <span className="block text-xs font-semibold text-[var(--color-text)] truncate">{user?.name}</span>
                <span className="block text-xs text-[var(--color-text-muted)] truncate">{user?.email}</span>
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-xs font-semibold px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primary-hover)] transition-colors">
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

/** Mobile bottom tab bar — 5 slots per §4.7 */
function MobileTabBar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex md:hidden items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-surface)] h-16 px-2 safe-area-pb">
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
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)]",
            )}
          >
            {isAccent ? (
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--color-primary)] -mt-5 shadow-[var(--shadow-md)]">
                <tab.icon className="h-5 w-5" />
              </div>
            ) : (
              <tab.icon className="h-5 w-5" />
            )}
            <span className={cn("text-xs font-medium", isAccent && "mt-0.5")}>{tab.label}</span>
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
      {/* Command palette — renders globally, listens for ⌘K */}
      <CommandPalette />

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 min-w-0",
          /* Desktop: offset by sidebar width. Mobile: no offset (sidebar hidden) */
          collapsed ? "md:ml-[var(--sidebar-collapsed-width)]" : "md:ml-[var(--sidebar-width)]",
        )}
      >
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileTabBar />
    </div>
  );
}
