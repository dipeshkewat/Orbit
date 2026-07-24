"use client";

import { useState } from "react";
import {
  MessageSquare,
  Search,
  Send,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Check,
  MoreVertical,
  User,
  Clock,
  Filter
} from "lucide-react";
import { toast } from "sonner";

interface MockMessage {
  id: string;
  sender: {
    name: string;
    avatar: string;
    handle: string;
  };
  platform: "instagram" | "twitter" | "linkedin" | "facebook";
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: { text: string; sender: "them" | "me"; time: string }[];
}

const INITIAL_CONVERSATIONS: MockMessage[] = [
  {
    id: "c-1",
    sender: {
      name: "Marcus Aurelius",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80",
      handle: "@marcus_reads"
    },
    platform: "instagram",
    lastMessage: "Amazing release! Is there a discount for startups?",
    time: "10m ago",
    unread: true,
    messages: [
      { text: "Hey team! Saw your launch announcement.", sender: "them", time: "10:15 AM" },
      { text: "Amazing release! Is there a discount for startups?", sender: "them", time: "10:16 AM" }
    ]
  },
  {
    id: "c-2",
    sender: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80",
      handle: "@sarahc_codes"
    },
    platform: "twitter",
    lastMessage: "Can I connect my LinkedIn company page as well as my profile?",
    time: "1h ago",
    unread: true,
    messages: [
      { text: "Hi! Quick question about the channels.", sender: "them", time: "9:02 AM" },
      { text: "Can I connect my LinkedIn company page as well as my profile?", sender: "them", time: "9:05 AM" }
    ]
  },
  {
    id: "c-3",
    sender: {
      name: "David Vance",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80",
      handle: "David Vance"
    },
    platform: "linkedin",
    lastMessage: "Thank you, this will save our team hours every week.",
    time: "Yesterday",
    unread: false,
    messages: [
      { text: "Our marketing team has been testing Orbit for the last few days.", sender: "them", time: "Yesterday" },
      { text: "Thank you, this will save our team hours every week.", sender: "them", time: "Yesterday" },
      { text: "That is wonderful to hear, David! Let us know if you need anything.", sender: "me", time: "Yesterday" }
    ]
  }
];

export default function InboxPage() {
  const [conversations, setConversations] = useState<MockMessage[]>(INITIAL_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string>("c-1");
  const [replyText, setReplyText] = useState("");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");

  const activeConv = conversations.find((c) => c.id === selectedId) || conversations[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeConv) return;

    const newReply = {
      text: replyText,
      sender: "me" as const,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              lastMessage: replyText,
              unread: false,
              messages: [...c.messages, newReply]
            }
          : c
      )
    );

    setReplyText("");
    toast.success("Reply dispatched to social channel!");
  };

  const handleMarkAsRead = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: false } : c))
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return <Instagram className="h-4 w-4 text-[var(--color-instagram)]" />;
      case "twitter": return <Twitter className="h-4 w-4 text-white" />;
      case "linkedin": return <Linkedin className="h-4 w-4 text-[var(--color-linkedin)]" />;
      case "facebook": return <Facebook className="h-4 w-4 text-[var(--color-facebook)]" />;
      default: return null;
    }
  };

  const filteredConversations = conversations.filter(
    (c) => filterPlatform === "all" || c.platform === filterPlatform
  );

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-var(--header-height)-52px)]">
      {/* Page Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Social Inbox</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Manage follower messages and comments across all accounts.
          </p>
        </div>

        {/* Platform filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-text-secondary)] font-medium outline-none"
          >
            <option value="all">All Channels</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter / X</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>
      </div>

      {/* Main Inbox Container */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5 items-stretch">
        
        {/* Left Side: Conversation List (span 4) */}
        <div className="col-span-4 glass rounded-[var(--radius-lg)] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-2">
            <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search comments..."
              className="w-full bg-transparent text-xs text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]/40">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setSelectedId(conv.id);
                  handleMarkAsRead(conv.id);
                }}
                className={`p-4 flex gap-3 cursor-pointer transition-colors relative ${
                  selectedId === conv.id 
                    ? "bg-[var(--color-surface-hover)]" 
                    : "hover:bg-[var(--color-surface-hover)]/30"
                }`}
              >
                {conv.unread && (
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                )}

                <div className="relative shrink-0">
                  <img src={conv.sender.avatar} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                    {getPlatformIcon(conv.platform)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs font-bold text-[var(--color-text)] truncate">{conv.sender.name}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] shrink-0 font-medium">{conv.time}</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] truncate mt-1">
                    {conv.lastMessage}
                  </p>
                </div>
              </div>
            ))}
            {filteredConversations.length === 0 && (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                No active conversations found.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Chat Pane (span 8) */}
        <div className="col-span-8 glass rounded-[var(--radius-lg)] flex flex-col justify-between overflow-hidden">
          {activeConv ? (
            <>
              {/* Active Header */}
              <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <img src={activeConv.sender.avatar} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <span className="block text-xs font-bold text-[var(--color-text)]">{activeConv.sender.name}</span>
                    <span className="block text-[10px] text-[var(--color-text-muted)]">{activeConv.sender.handle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                    {getPlatformIcon(activeConv.platform)}
                  </div>
                  <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Chat Log Message bubbles */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center">
                  <span className="inline-block px-2.5 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                    Mock direct messaging via OAuth
                  </span>
                </div>

                {activeConv.messages.map((msg, idx) => {
                  const isMe = msg.sender === "me";
                  return (
                    <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] p-3 rounded-[var(--radius-md)] text-xs border ${
                        isMe 
                          ? "bg-[var(--color-primary)] border-transparent text-white rounded-br-none" 
                          : "bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text)] rounded-bl-none"
                      }`}>
                        <p className="leading-relaxed">{msg.text}</p>
                        <span className={`block text-[9px] mt-1.5 text-right ${isMe ? "text-white/60" : "text-[var(--color-text-muted)]"}`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form Footer */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex gap-3 shrink-0">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${activeConv.sender.name}...`}
                  className="flex-1 px-4 py-3 bg-[var(--color-background)] border border-[var(--color-border)] text-xs text-[var(--color-text)] outline-none rounded-[var(--radius-md)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] transition-colors"
                />
                <button
                  type="submit"
                  className="px-5 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-[var(--radius-md)] flex items-center gap-1.5 hover:opacity-90 active:scale-95"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[var(--color-text-muted)]">
              <MessageSquare className="h-10 w-10 mb-2" />
              <p className="text-xs">Select a conversation to reply.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
