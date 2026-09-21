"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { trpc } from "@/lib/trpc";
import {
  Users,
  Plus,
  Mail,
  UserCheck,
  Shield,
  Trash2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  status: "joined" | "pending";
}

const INITIAL_MEMBERS: Member[] = [
  { id: "m-1", name: "Dipes", email: "dipes@orbit.com", role: "owner", status: "joined" },
  { id: "m-2", name: "Jane Doe", email: "jane@orbit.com", role: "admin", status: "joined" },
  { id: "m-3", name: "Bob Smith", email: "bob@orbit.com", role: "editor", status: "pending" }
];

function isUuid(value: string | null): value is string {
  return value !== null && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function SettingsTeamPage() {
  const workspace = useAuthStore((state) => {
    const active = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
    return active || state.workspaces[0];
  });
  const activeWorkspaceId = useAuthStore((state) => state.activeWorkspaceId);
  const serverWorkspaceId = isUuid(activeWorkspaceId) ? activeWorkspaceId : null;
  const membersQuery = trpc.workspace.getMembers.useQuery(
    { workspaceId: serverWorkspaceId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: serverWorkspaceId !== null },
  );
  const inviteMutation = trpc.workspace.invite.useMutation();
  const removeMutation = trpc.workspace.removeMember.useMutation();

  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Member["role"]>("editor");
  const [isSending, setIsSending] = useState(false);
  const visibleMembers: Member[] = serverWorkspaceId
    ? (membersQuery.data ?? []).map((member) => ({
        id: member.id,
        name: member.user.name ?? member.user.email,
        email: member.user.email,
        role: member.role as Member["role"],
        status: member.inviteStatus === "accepted" ? "joined" : "pending",
      }))
    : members;

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (serverWorkspaceId === null && workspace.plan === "free" && members.length >= 1) {
      toast.error("Free plan is limited to 1 team member. Upgrade to add more.");
      return;
    }

    setIsSending(true);
    if (serverWorkspaceId) {
      inviteMutation.mutate(
        { workspaceId: serverWorkspaceId, email: inviteEmail, role: inviteRole },
        {
          onSuccess: () => {
            void membersQuery.refetch();
            setIsSending(false);
            setInviteEmail("");
            toast.success(`Invitation created for: ${inviteEmail}`);
          },
          onError: (error) => {
            setIsSending(false);
            toast.error(error.message);
          },
        },
      );
      return;
    }
    setTimeout(() => {
      const newMember: Member = {
        id: "m-" + Math.random().toString(36).substr(2, 9),
        name: inviteEmail.split("@")[0] || "Invited User",
        email: inviteEmail,
        role: inviteRole,
        status: "pending"
      };

      setMembers((prev) => [...prev, newMember]);
      setIsSending(false);
      setInviteEmail("");
      toast.success(`Invite sent successfully to: ${inviteEmail}`);
    }, 600);
  };

  const handleRemoveMember = (id: string, name: string) => {
    if (serverWorkspaceId) {
      removeMutation.mutate(
        { workspaceId: serverWorkspaceId, memberId: id },
        {
          onSuccess: () => {
            void membersQuery.refetch();
            toast.success(`Removed team member: ${name}`);
          },
          onError: (error) => toast.error(error.message),
        },
      );
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success(`Removed team member: ${name}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage member profiles, active roles, and invite workflow.
        </p>
        {serverWorkspaceId && membersQuery.isError && (
          <p className="mt-2 text-sm text-[var(--color-error)]">We could not load team members for this workspace.</p>
        )}
      </div>

      {/* Tab bar header */}
      <div className="flex gap-1.5 border-b border-[var(--color-border)] pb-3 overflow-x-auto">
        <Link href="/settings" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
          General
        </Link>
        <Link href="/settings/accounts" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
          Connected Accounts
        </Link>
        <Link href="/settings/team" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-[var(--color-surface-hover)] text-[var(--color-text)]">
          Team Members
        </Link>
        <Link href="/settings/billing" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
          Billing & Plans
        </Link>
        <Link href="/settings/developer" className="px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:text(--color-text-secondary)">
          Developer API
        </Link>
      </div>

      {/* Main split grid */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Left Side: Active member list (span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Active Team Members ({visibleMembers.length})
            </h3>

            <div className="divide-y divide-[var(--color-border)]/40">
              {visibleMembers.map((member) => (
                <div key={member.id} className="py-3.5 flex justify-between items-center first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white uppercase">{member.name.charAt(0)}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                        {member.name}
                        {member.status === "pending" && (
                          <span className="text-[8px] uppercase tracking-wider font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 py-0.5 rounded">
                            Pending
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-[var(--color-text-muted)]">{member.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)] capitalize flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                      {member.role}
                    </span>
                    {member.role !== "owner" && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="h-8 w-8 rounded-full hover:bg-[var(--color-error)]/10 text-[var(--color-error)] flex items-center justify-center transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Invite Panel (span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass rounded-[var(--radius-lg)] p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Plus className="h-4.5 w-4.5" />
                Invite Collaborators
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Send a workspace membership email invitation</p>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Email Address</label>
                <div className="flex rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-border)]">
                  <span className="px-3 bg-[var(--color-surface)] flex items-center border-r border-[var(--color-border)]">
                    <Mail className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </span>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full px-3 py-2.5 bg-[var(--color-background)] text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:bg-[var(--color-surface)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">RBAC Role Permissions</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Member["role"])}
                  className="w-full px-3 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-text)] outline-none"
                >
                  <option value="viewer">Viewer (Read-only logs)</option>
                  <option value="editor">Editor (Create, draft, edit)</option>
                  <option value="admin">Admin (Manage billing, pages, delete)</option>
                </select>
              </div>

              {workspace.plan === "free" && (
                <div className="p-3 bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 rounded flex gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-[var(--color-warning)] shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    You&apos;ve reached your free seat limit. Upgrade to a paid plan to invite collaborators to draft and schedule posts.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSending}
                className="w-full flex items-center justify-center gap-1.5 bg-[var(--color-primary)] text-[var(--color-text-inverse)] text-xs font-semibold py-2.5 rounded-[var(--radius-md)] hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                <UserCheck className="h-4 w-4" />
                {isSending ? "Sending Invite..." : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
