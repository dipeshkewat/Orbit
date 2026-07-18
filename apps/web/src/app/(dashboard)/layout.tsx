"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@socialsphear/ui";
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
  Bell,
  Search,
  Plus,
  LogOut,
  Building,
  User,
  CheckCircle,
  X,
  ShieldCheck,
  AlertTriangle,
  Brain
} from "lucide-react";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/composer", label: "Composer", icon: PenSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/ai-studio", label: "AI Studio", icon: Sparkles },
  { href: "/content-planner", label: "Content Planner", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

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

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const handleCreateWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    createWorkspace(newWsName);
    toast.success(`Workspace "${newWsName}" created!`);
    setNewWsName("");
    setShowNewWsModal(false);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-300",
        collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]",
      )}
    >
      {/* Brand Logo */}
      <div className="flex h-[var(--header-height)] items-center gap-3 border-b border-[var(--color-border)] px-4 shrink-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] shadow-[var(--shadow-glow)]">
          <span className="text-lg font-bold text-white">S</span>
        </div>
        {!collapsed && (
          <span className="gradient-text text-lg font-bold tracking-tight">
            SocialSphear
          </span>
        )}
      </div>

      {/* Workspace Selector Dropdown */}
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

        {/* Dropdown Items list */}
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
            "flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-glow)] transition-all hover:opacity-90 active:scale-[0.98]",
            collapsed && "px-2",
          )}
        >
          <Plus className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span>New Post</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout & Footer */}
      <div className="border-t border-[var(--color-border)] p-3 shrink-0 space-y-1">
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
              className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-semibold text-xs py-2.5 rounded shadow-[var(--shadow-glow)] hover:opacity-90"
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
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)]/85 px-6 backdrop-blur-md shrink-0">
      {/* Search mock filter */}
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 transition-colors focus-within:border-[var(--color-primary)]">
        <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Search calendar database..."
          className="w-64 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-muted)]"
          onChange={(e) => {
            if (e.target.value.length > 3) {
              toast.info(`Searching for: "${e.target.value}"...`);
            }
          }}
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4 relative">
        
        {/* Notifications Button */}
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="relative rounded-[var(--radius-md)] p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-[var(--color-error)] text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown Drawer */}
        {showNotif && (
          <div className="absolute right-12 top-full mt-2 w-80 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 shadow-[var(--shadow-lg)] z-50 space-y-3">
            <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2 shrink-0">
              <span className="text-xs font-bold text-[var(--color-text)]">Recent Alerts</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-[var(--color-primary-light)] hover:underline">
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
                    "p-2.5 rounded border text-[11px] cursor-pointer transition-colors relative",
                    n.read 
                      ? "bg-transparent border-transparent text-[var(--color-text-muted)]" 
                      : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  {!n.read && (
                    <span className="absolute left-1 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                  )}
                  <span className="block font-bold">{n.title}</span>
                  <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">{n.message}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">No recent alerts.</p>
              )}
            </div>
          </div>
        )}

        {/* User profile details */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] shrink-0">
            <span className="text-sm font-bold text-white uppercase">{user?.name.charAt(0) || "U"}</span>
          </div>
          <div className="hidden sm:block text-left max-w-[80px]">
            <span className="block text-[10px] font-bold text-[var(--color-text)] truncate">{user?.name}</span>
            <span className="block text-[8px] text-[var(--color-text-muted)] font-semibold truncate capitalize">{user?.email}</span>
          </div>
        </div>
      </div>
    </header>
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
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 min-w-0",
          collapsed ? "ml-[var(--sidebar-collapsed-width)]" : "ml-[var(--sidebar-width)]",
        )}
      >
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
