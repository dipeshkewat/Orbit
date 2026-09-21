"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/store";
import { CheckCircle2, Clock3, XCircle, Loader2, MessageSquare, Send, UserRound } from "lucide-react";
import { toast } from "sonner";

function isUuid(value: string | null): value is string {
  return value !== null && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

type ReviewPost = {
  id: string;
  content: string | null;
  approvalStatus: string;
  approvalNote: string | null;
  assignedToId: string | null;
};

type ReviewMember = {
  userId: string;
  name: string;
  email: string;
};

type ActivityEntry = {
  id: string;
  action: string;
  createdAt: string | Date;
  user?: { name: string | null; email: string } | null;
};

type CommentEntry = {
  id: string;
  metadata: unknown;
  user?: { name: string | null; email: string } | null;
};

function ReviewPostCard({
  post,
  workspaceId,
  members,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  post: ReviewPost;
  workspaceId: string;
  members: ReviewMember[];
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const commentsQuery = trpc.posts.getComments.useQuery({ workspaceId, postId: post.id });
  const addCommentMutation = trpc.posts.addComment.useMutation();
  const assignMutation = trpc.posts.assign.useMutation();
  const trpcUtils = trpc.useUtils();
  const commentEntries: CommentEntry[] = Array.isArray(commentsQuery.data)
    ? (commentsQuery.data as unknown as CommentEntry[])
    : [];

  const submitComment = () => {
    const text = comment.trim();
    if (!text) return;
    addCommentMutation.mutate(
      { workspaceId, postId: post.id, text },
      {
        onSuccess: () => {
          setComment("");
          void commentsQuery.refetch();
          void trpcUtils.posts.getActivity.invalidate({ workspaceId, limit: 12 });
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const updateAssignment = (value: string) => {
    assignMutation.mutate(
      { workspaceId, postId: post.id, assigneeId: value || null },
      {
        onSuccess: () => {
          void trpcUtils.posts.getByWorkspace.invalidate({ workspaceId, status: "scheduled" });
          void trpcUtils.posts.getActivity.invalidate({ workspaceId, limit: 12 });
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            {post.approvalStatus === "pending" ? <Clock3 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {post.approvalStatus}
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text)]">{post.content || "No content yet."}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => onApprove(post.id)}
            disabled={isApproving}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Assign owner</label>
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-[var(--color-text-muted)]" />
            <select
              value={post.assignedToId ?? ""}
              onChange={(event) => updateAssignment(event.target.value)}
              disabled={assignMutation.isPending}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>{member.name || member.email}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Rejection note</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
            placeholder={post.approvalNote ?? "Explain what needs changing"}
          />
          <button
            onClick={() => onReject(post.id, note)}
            disabled={isRejecting}
            className="inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/15 disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </button>
        </div>
      </div>

      <div className="mt-5 border-t border-[var(--color-border)]/60 pt-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          <MessageSquare className="h-3.5 w-3.5" />
          Discussion
        </div>
        <div className="space-y-2">
          {commentEntries.map((entry) => (
            <div key={entry.id} className="rounded-xl bg-[var(--color-background)] px-3 py-2 text-sm">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)]">{entry.user?.name ?? entry.user?.email ?? "Workspace member"}</div>
              <div className="mt-1 text-[var(--color-text)]">{typeof entry.metadata === "object" && entry.metadata !== null && "text" in entry.metadata ? String(entry.metadata.text) : ""}</div>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") submitComment(); }}
              placeholder="Add a comment"
              className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
            />
            <button
              onClick={submitComment}
              disabled={addCommentMutation.isPending || !comment.trim()}
              title="Add comment"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const activeWorkspaceId = useAuthStore((state) => state.activeWorkspaceId);
  const workspaceId = isUuid(activeWorkspaceId) ? activeWorkspaceId : null;
  const postsQuery = trpc.posts.getByWorkspace.useQuery(
    { workspaceId: workspaceId ?? "00000000-0000-0000-0000-000000000000", status: "scheduled" },
    { enabled: workspaceId !== null },
  );

  const approveMutation = trpc.posts.approve.useMutation();
  const rejectMutation = trpc.posts.reject.useMutation();
  const membersQuery = trpc.workspace.getMembers.useQuery(
    { workspaceId: workspaceId ?? "00000000-0000-0000-0000-000000000000" },
    { enabled: workspaceId !== null },
  );
  const activityQuery = trpc.posts.getActivity.useQuery(
    { workspaceId: workspaceId ?? "00000000-0000-0000-0000-000000000000", limit: 12 },
    { enabled: workspaceId !== null },
  );

  const pendingPosts = useMemo(() => {
    const posts: ReviewPost[] = Array.isArray(postsQuery.data)
      ? (postsQuery.data as unknown as ReviewPost[])
      : [];
    return posts.filter((post) => post.approvalStatus === "pending" || post.approvalStatus === "rejected");
  }, [postsQuery.data]);
  const activityEntries: ActivityEntry[] = Array.isArray(activityQuery.data)
    ? (activityQuery.data as unknown as ActivityEntry[])
    : [];

  const handleApprove = (id: string) => {
    if (!workspaceId) return;
    approveMutation.mutate(
      { workspaceId, id },
      {
        onSuccess: () => {
          void postsQuery.refetch();
          toast.success("Post approved.");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const handleReject = (id: string, value: string) => {
    if (!workspaceId) return;
    const rejectionNote = value.trim();
    if (!rejectionNote) {
      toast.error("Please add a rejection reason.");
      return;
    }

    rejectMutation.mutate(
      { workspaceId, id, note: rejectionNote },
      {
        onSuccess: () => {
          void postsQuery.refetch();
          toast.success("Post rejected.");
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  if (!workspaceId) {
    return (
      <div className="p-6 text-sm text-[var(--color-text-secondary)]">
        Select a real workspace to view approval queue items.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Review pending or rejected posts before they go live.
        </p>
      </div>

      {postsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading approval queue…
        </div>
      ) : pendingPosts.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-secondary)]">
          No posts are currently waiting for approval.
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPosts.map((post) => (
            <ReviewPostCard
              key={post.id}
              post={post}
              workspaceId={workspaceId}
              members={(membersQuery.data ?? [])
                .filter((member) => member.inviteStatus === "accepted")
                .map((member) => ({ userId: member.userId, name: member.user.name ?? "", email: member.user.email }))}
              onApprove={handleApprove}
              onReject={handleReject}
              isApproving={approveMutation.isPending}
              isRejecting={rejectMutation.isPending}
            />
          ))}
        </div>
      )}

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Recent activity</h2>
        <div className="mt-4 divide-y divide-[var(--color-border)]/50">
          {activityEntries.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <div className="text-sm text-[var(--color-text)]">{entry.action.replaceAll(".", " ")}</div>
                <div className="text-xs text-[var(--color-text-muted)]">{entry.user?.name ?? entry.user?.email ?? "System"}</div>
              </div>
              <time className="shrink-0 text-xs text-[var(--color-text-muted)]">{new Date(entry.createdAt).toLocaleString()}</time>
            </div>
          ))}
          {!activityQuery.isLoading && activityEntries.length === 0 && (
            <div className="py-2 text-sm text-[var(--color-text-secondary)]">No activity recorded yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
