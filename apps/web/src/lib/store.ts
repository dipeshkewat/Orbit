import { create } from "zustand";
import { persist } from "zustand/middleware";

// --- Types ---
export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface MockWorkspace {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "creator" | "pro" | "agency";
  aiCreditsUsed: number;
  aiCreditsLimit: number;
}

export interface MockSocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  status: "active" | "error" | "expired";
}

export interface MockPost {
  id: string;
  content: string;
  platforms: string[];
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  scheduledAt: string | null;
  publishedAt: string | null;
  mediaUrls: string[];
  platformOverrides: Record<string, { content: string }>;
  metrics?: Record<string, { likes: number; comments: number; shares: number; impressions: number }>;
}

export interface MockNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

// --- Store Interfaces ---

interface AuthState {
  user: MockUser | null;
  workspaces: MockWorkspace[];
  activeWorkspaceId: string | null;
  isAuthenticated: boolean;
  onboardingStep: number; // 0 means onboarding is completed
  login: (email: string, name: string) => void;
  logout: () => void;
  setWorkspace: (id: string) => void;
  createWorkspace: (name: string) => MockWorkspace;
  setOnboardingStep: (step: number) => void;
  deductCredits: (cost: number) => boolean;
}

interface SocialAccountState {
  accounts: MockSocialAccount[];
  connectAccount: (platform: string, username: string) => void;
  disconnectAccount: (id: string) => void;
}

interface ComposerState {
  content: string;
  selectedPlatforms: string[];
  mediaFiles: { id: string; url: string; progress: number; name: string }[];
  scheduledAt: string | null;
  overrides: Record<string, { content: string }>;
  aiPrompt: string;
  isAiGenerating: boolean;
  setContent: (content: string) => void;
  togglePlatform: (platform: string) => void;
  addMediaFile: (file: { id: string; url: string; progress: number; name: string }) => void;
  updateMediaProgress: (id: string, progress: number) => void;
  removeMediaFile: (id: string) => void;
  setScheduledAt: (date: string | null) => void;
  updateOverride: (platform: string, content: string) => void;
  resetComposer: () => void;
}

interface CalendarState {
  posts: MockPost[];
  viewMode: "month" | "week" | "day";
  selectedDate: string; // ISO String
  setViewMode: (mode: "month" | "week" | "day") => void;
  setSelectedDate: (date: string) => void;
  addPost: (post: Omit<MockPost, "id" | "publishedAt" | "metrics">) => MockPost;
  updatePost: (id: string, data: Partial<MockPost>) => void;
  deletePost: (id: string) => void;
  reschedulePost: (id: string, date: string) => void;
}

interface NotificationState {
  notifications: MockNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type: MockNotification["type"]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// --- Initial Mock Data ---

const INITIAL_WORKSPACES: MockWorkspace[] = [
  {
    id: "ws-1",
    name: "Personal Brand",
    slug: "personal",
    plan: "creator",
    aiCreditsUsed: 42,
    aiCreditsLimit: 200,
  },
  {
    id: "ws-2",
    name: "Acme Corp",
    slug: "acme",
    plan: "free",
    aiCreditsUsed: 19,
    aiCreditsLimit: 20,
  },
];

const INITIAL_SOCIAL_ACCOUNTS: MockSocialAccount[] = [
  {
    id: "sa-1",
    platform: "instagram",
    username: "dipes_codes",
    displayName: "Dipes Codes",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
    status: "active",
  },
  {
    id: "sa-2",
    platform: "twitter",
    username: "dipes_codes",
    displayName: "Dipes Codes",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
    status: "active",
  },
  {
    id: "sa-3",
    platform: "linkedin",
    username: "dipes-dev",
    displayName: "Dipes Dev",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
    status: "active",
  },
];

const INITIAL_POSTS: MockPost[] = [
  {
    id: "post-1",
    content: "🚀 Excited to announce that Orbit is launching next week! Automate, customize, and design your entire brand feed from one simple dashboard. #saas #marketing",
    platforms: ["instagram", "twitter", "linkedin"],
    status: "published",
    scheduledAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    mediaUrls: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"],
    platformOverrides: {},
    metrics: {
      instagram: { likes: 142, comments: 24, shares: 12, impressions: 1850 },
      twitter: { likes: 32, comments: 4, shares: 8, impressions: 540 },
      linkedin: { likes: 88, comments: 19, shares: 14, impressions: 1200 },
    },
  },
  {
    id: "post-2",
    content: "Design systems are the glue that keeps teams together. In our latest blog post, we break down why we chose Tailwind v4 and CSS variables for our premium dashboard design. 🎨 Read now: link.orbit.com/ds",
    platforms: ["twitter", "linkedin"],
    status: "published",
    scheduledAt: new Date(Date.now() - 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    mediaUrls: [],
    platformOverrides: {},
    metrics: {
      twitter: { likes: 45, comments: 2, shares: 15, impressions: 720 },
      linkedin: { likes: 110, comments: 12, shares: 25, impressions: 1650 },
    },
  },
  {
    id: "post-3",
    content: "Quick reminder: The best times to post on LinkedIn are generally Tues/Thurs mornings. Here is what our AI recommends based on analyzing 1,000+ top accounts. ⏰🤖",
    platforms: ["linkedin"],
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    publishedAt: null,
    mediaUrls: [],
    platformOverrides: {},
  },
  {
    id: "post-4",
    content: "🎨 Dark mode vs Light mode. Which one are you using? Let us know below! 👇",
    platforms: ["instagram", "twitter"],
    status: "scheduled",
    scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    publishedAt: null,
    mediaUrls: ["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80"],
    platformOverrides: {
      twitter: { content: "🎨 Dark mode vs Light mode. Which one are you using? Cast your vote!" },
    },
  },
];

const INITIAL_NOTIFICATIONS: MockNotification[] = [
  {
    id: "notif-1",
    title: "Post published successfully",
    message: "Your post has been successfully published to Twitter and LinkedIn.",
    type: "success",
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "notif-2",
    title: "Failed to connect Pinterest",
    message: "The OAuth token for your Pinterest account was expired or invalid.",
    type: "error",
    read: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

// --- Store Implementations ---

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: {
        id: "usr-1",
        name: "Dipes",
        email: "dipes@orbit.com",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
      },
      workspaces: INITIAL_WORKSPACES,
      activeWorkspaceId: "ws-1",
      isAuthenticated: true,
      onboardingStep: 0, // 0 = onboarding completed

      login: (email, name) =>
        set({
          user: {
            id: "usr-" + Math.random().toString(36).substr(2, 9),
            name,
            email,
            avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
          },
          isAuthenticated: true,
          onboardingStep: 0, // onboarding completed
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          activeWorkspaceId: null,
        }),

      setWorkspace: (id) => set({ activeWorkspaceId: id }),

      createWorkspace: (name) => {
        const newWs: MockWorkspace = {
          id: "ws-" + Math.random().toString(36).substr(2, 9),
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          plan: "free",
          aiCreditsUsed: 0,
          aiCreditsLimit: 20,
        };
        set((state) => ({
          workspaces: [...state.workspaces, newWs],
          activeWorkspaceId: newWs.id,
        }));
        return newWs;
      },

      setOnboardingStep: (step) => set({ onboardingStep: step }),

      deductCredits: (cost) => {
        const { workspaces, activeWorkspaceId } = get();
        const active = workspaces.find((w) => w.id === activeWorkspaceId);
        if (!active) return false;
        if (active.aiCreditsUsed + cost > active.aiCreditsLimit) return false;

        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === activeWorkspaceId ? { ...w, aiCreditsUsed: w.aiCreditsUsed + cost } : w
          ),
        }));
        return true;
      },
    }),
    { name: "orbit-auth" }
  )
);

export const useSocialAccountStore = create<SocialAccountState>()(
  persist(
    (set) => ({
      accounts: INITIAL_SOCIAL_ACCOUNTS,

      connectAccount: (platform, username) =>
        set((state) => {
          const newAccount: MockSocialAccount = {
            id: "sa-" + Math.random().toString(36).substr(2, 9),
            platform,
            username,
            displayName: username.split("@")[0] || username,
            avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
            status: "active",
          };
          return { accounts: [...state.accounts, newAccount] };
        }),

      disconnectAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        })),
    }),
    { name: "orbit-social-accounts" }
  )
);

export const useComposerStore = create<ComposerState>((set) => ({
  content: "",
  selectedPlatforms: [],
  mediaFiles: [],
  scheduledAt: null,
  overrides: {},
  aiPrompt: "",
  isAiGenerating: false,

  setContent: (content) => set({ content }),

  togglePlatform: (platform) =>
    set((state) => {
      const isSelected = state.selectedPlatforms.includes(platform);
      return {
        selectedPlatforms: isSelected
          ? state.selectedPlatforms.filter((p) => p !== platform)
          : [...state.selectedPlatforms, platform],
      };
    }),

  addMediaFile: (file) =>
    set((state) => ({
      mediaFiles: [...state.mediaFiles, file],
    })),

  updateMediaProgress: (id, progress) =>
    set((state) => ({
      mediaFiles: state.mediaFiles.map((f) => (f.id === id ? { ...f, progress } : f)),
    })),

  removeMediaFile: (id) =>
    set((state) => ({
      mediaFiles: state.mediaFiles.filter((f) => f.id !== id),
    })),

  setScheduledAt: (date) => set({ scheduledAt: date }),

  updateOverride: (platform, content) =>
    set((state) => ({
      overrides: {
        ...state.overrides,
        [platform]: { content },
      },
    })),

  resetComposer: () =>
    set({
      content: "",
      selectedPlatforms: [],
      mediaFiles: [],
      scheduledAt: null,
      overrides: {},
      aiPrompt: "",
      isAiGenerating: false,
    }),
}));

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      posts: INITIAL_POSTS,
      viewMode: "month",
      selectedDate: new Date().toISOString(),

      setViewMode: (viewMode) => set({ viewMode }),

      setSelectedDate: (selectedDate) => set({ selectedDate }),

      addPost: (postData) => {
        const newPost: MockPost = {
          ...postData,
          id: "post-" + Math.random().toString(36).substr(2, 9),
          publishedAt: postData.status === "published" ? new Date().toISOString() : null,
          metrics:
            postData.status === "published"
              ? postData.platforms.reduce(
                  (acc, p) => ({
                    ...acc,
                    [p]: { likes: 0, comments: 0, shares: 0, impressions: 0 },
                  }),
                  {}
                )
              : undefined,
        };
        set((state) => ({ posts: [...state.posts, newPost] }));
        return newPost;
      },

      updatePost: (id, data) =>
        set((state) => ({
          posts: state.posts.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      deletePost: (id) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        })),

      reschedulePost: (id, date) =>
        set((state) => ({
          posts: state.posts.map((p) => (p.id === id ? { ...p, scheduledAt: date, status: "scheduled" } : p)),
        })),
    }),
    { name: "orbit-calendar" }
  )
);

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: INITIAL_NOTIFICATIONS,
      unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.read).length,

      addNotification: (title, message, type) =>
        set((state) => {
          const newNotif: MockNotification = {
            id: "notif-" + Math.random().toString(36).substr(2, 9),
            title,
            message,
            type,
            read: false,
            createdAt: new Date().toISOString(),
          };
          const updated = [newNotif, ...state.notifications];
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        }),

      markAsRead: (id) =>
        set((state) => {
          const updated = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        }),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      clearNotifications: () =>
        set({
          notifications: [],
          unreadCount: 0,
        }),
    }),
    { name: "orbit-notifications" }
  )
);
