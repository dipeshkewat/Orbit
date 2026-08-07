"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@orbit/ui";
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
  X,
  Brain,
  HelpCircle,
  MoreHorizontal,
  Users,
  CheckCircle2,
  Globe,
  Twitter,
  Github,
} from "lucide-react";
import { toast } from "sonner";

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
          ? "bg-[var(--color-primary)] text-[var(--color-text-inverse)] shadow-sm"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
        collapsed && "justify-center px-2",
      )}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? label : undefined}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[var(--color-text-inverse)]" : "text-[var(--color-text-muted)]")} />
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

  const handleLogout = () => {
    document.cookie = "sb_bypass=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
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
      {/* Brand Header */}
      <div className="flex h-[var(--header-height)] items-center gap-3 border-b border-[var(--color-border)] px-4 shrink-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-text-inverse)]">
          <OrbitLogo size={18} className="text-[var(--color-text-inverse)]" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight text-[var(--color-text)]">
            Orbit
          </span>
        )}
      </div>

      {/* Workspace Selector */}
      <div className="px-3 pt-3 shrink-0 relative">
        <button
          onClick={() => !collapsed && setShowWsDropdown(!showWsDropdown)}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors",
            collapsed && "justify-center px-1"
          )}
        >
          <Building className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
          {!collapsed && (
            <>
              <span className="truncate max-w-[120px]">{activeWorkspace?.name}</span>
              <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform text-[var(--color-text-muted)]", showWsDropdown && "rotate-90")} />
            </>
          )}
        </button>

        {showWsDropdown && !collapsed && (
          <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1.5 shadow-lg space-y-1">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setWorkspace(ws.id);
                  setShowWsDropdown(false);
                  toast.success(`Switched to: ${ws.name}`);
                }}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--color-surface-hover)]",
                  ws.id === activeWorkspaceId ? "text-[var(--color-text)] font-bold bg-[var(--color-surface-secondary)]" : "text-[var(--color-text-secondary)]"
                )}
              >
                {ws.name}
              </button>
            ))}
            <div className="h-px bg-[var(--color-border)] my-1" />
            <button
              onClick={() => {
                setShowWsDropdown(false);
                setShowNewWsModal(true);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-surface-hover)] flex items-center gap-1"
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
                  ? "text-[var(--color-text)] font-bold"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
              )}
            >
              <MoreHorizontal className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
              <span>More</span>
              <ChevronDown className={cn("h-3 w-3 ml-auto transition-transform text-[var(--color-text-muted)]", moreExpanded && "rotate-180")} />
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

      <div className="flex-1" />

      {/* Pinned Footer */}
      <div className="border-t border-[var(--color-border)] p-3 shrink-0 space-y-2">
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
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors",
            collapsed && "justify-center px-2"
          )}
          title="Sign Out"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {!collapsed && (
          <div className="pt-2 border-t border-[var(--color-border)] space-y-2 text-[11px] text-[var(--color-text-muted)]">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-[var(--color-accent)]" />
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-blue-500" />
                <span>Global</span>
              </div>
            </div>
            <div className="flex items-center justify-between px-1 pt-1 border-t border-[var(--color-border)]">
              <span>© 2026 Orbit</span>
              <div className="flex items-center gap-2">
                <Github className="h-3 w-3 hover:text-[var(--color-text)] transition-colors cursor-pointer" />
                <Twitter className="h-3 w-3 hover:text-[var(--color-text)] transition-colors cursor-pointer" />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg py-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Create Workspace Modal */}
      {showNewWsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateWorkspaceSubmit} className="w-full max-w-[360px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 relative shadow-xl text-[var(--color-text)]">
            <button
              type="button"
              onClick={() => setShowNewWsModal(false)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">Create Workspace</h3>
            <input
              type="text"
              required
              placeholder="Workspace Name"
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] transition-colors mb-4"
            />
            <button
              type="submit"
              className="w-full bg-[var(--color-primary)] text-[var(--color-text-inverse)] font-semibold text-xs py-2.5 rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
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
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleMarkRead = (id: string) => {
    markAsRead(id);
    toast.success("Marked as read");
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast.success("All notifications read");
  };

  const handleSignOut = () => {
    document.cookie = "sb_bypass=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-4 md:px-6 backdrop-blur-md shrink-0">
      {/* Search & Status Pill */}
      <div className="flex items-center gap-3">
        <CommandPaletteTrigger />
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
          <span>Orbit v2.0 • Operational</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 relative">
        {/* Solid Dark Pill Primary CTA */}
        <Link
          href="/composer"
          className="flex items-center gap-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-inverse)] text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          New Post
        </Link>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications Button */}
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="relative rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-[var(--color-error)] text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-[var(--color-surface)]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {showNotif && (
          <div className="absolute right-12 top-full mt-2 w-80 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-xl z-50 space-y-3">
            <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2">
              <span className="text-xs font-bold text-[var(--color-text)]">Recent Alerts</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs font-semibold text-[var(--color-accent)] hover:underline">
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
                      ? "bg-transparent border-transparent text-[var(--color-text-muted)]"
                      : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text)]"
                  )}
                >
                  {!n.read && (
                    <span className="absolute left-1 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
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

        {/* User Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-7 w-7 rounded-full object-cover ring-2 ring-[var(--color-border)]"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-text-inverse)] text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <ChevronDown className="h-3 w-3 text-[var(--color-text-muted)]" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-[var(--color-border)]">
                <p className="text-xs font-bold text-[var(--color-text)] truncate">{user?.name}</p>
                <p className="text-[11px] text-[var(--color-text-muted)] truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

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
                ? "text-[var(--color-text-inverse)]"
                : active
                  ? "text-[var(--color-text)] font-bold"
                  : "text-[var(--color-text-muted)]",
            )}
          >
            {isAccent ? (
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[var(--color-primary)] text-[var(--color-text-inverse)] -mt-5 shadow-md">
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
