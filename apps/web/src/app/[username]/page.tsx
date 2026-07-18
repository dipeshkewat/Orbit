"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Globe,
  Github,
  Mail,
  Sparkles,
  Link as LinkIcon,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  iconType: "globe" | "github" | "linkedin" | "mail" | "custom";
}

const DEFAULT_LINKS: LinkItem[] = [
  { id: "1", title: "Official Website Portfolio", url: "https://dipes.dev", iconType: "globe" },
  { id: "2", title: "Open Source Code repository", url: "https://github.com/dipes", iconType: "github" },
  { id: "3", title: "Follow professional updates", url: "https://linkedin.com/in/dipes", iconType: "linkedin" },
  { id: "4", title: "Join Weekly Tech Newsletter", url: "mailto:newsletter@socialsphear.com", iconType: "mail" },
];

export default function LinkInBioPage() {
  const params = useParams();
  const username = params.username as string;

  const [links] = useState<LinkItem[]>(DEFAULT_LINKS);

  const handleLinkClick = (url: string) => {
    toast.success("Redirecting to: " + url);
    window.open(url, "_blank");
  };

  const getLinkIcon = (type: LinkItem["iconType"]) => {
    switch (type) {
      case "globe": return <Globe className="h-4.5 w-4.5 text-[var(--color-primary-light)]" />;
      case "github": return <Github className="h-4.5 w-4.5 text-white" />;
      case "linkedin": return <Linkedin className="h-4.5 w-4.5 text-[var(--color-linkedin)]" />;
      case "mail": return <Mail className="h-4.5 w-4.5 text-[var(--color-success)]" />;
      default: return <LinkIcon className="h-4.5 w-4.5 text-[var(--color-accent)]" />;
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--color-background)] px-4 py-12">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] h-[400px] w-[400px] rounded-full bg-[var(--color-primary)]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] h-[400px] w-[400px] rounded-full bg-[var(--color-accent)]/10 blur-[100px] pointer-events-none" />

      {/* Profile Card Container */}
      <div className="w-full max-w-[420px] glass rounded-[var(--radius-xl)] p-8 text-center shadow-[var(--shadow-lg)] relative z-10 space-y-6">
        
        {/* User Bio Header */}
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] p-0.5 shadow-[var(--shadow-glow)] shrink-0">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
              alt="avatar"
              className="w-full h-full rounded-full object-cover border-2 border-[var(--color-background)]"
            />
          </div>
          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-[var(--color-text)]">
            {username ? `@${username}` : "@dipes_codes"}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-medium max-w-[280px]">
            Frontend Developer & SaaS Founder. Organizing feeds and scheduling code one commit at a time. 🎨🤖
          </p>
        </div>

        {/* Social Handles Icons Row */}
        <div className="flex justify-center gap-4 text-[var(--color-text-muted)] pt-1">
          <Instagram className="h-5 w-5 hover:text-[var(--color-instagram)] cursor-pointer transition-colors" onClick={() => handleLinkClick("https://instagram.com")} />
          <Twitter className="h-5 w-5 hover:text-white cursor-pointer transition-colors" onClick={() => handleLinkClick("https://twitter.com")} />
          <Linkedin className="h-5 w-5 hover:text-[var(--color-linkedin)] cursor-pointer transition-colors" onClick={() => handleLinkClick("https://linkedin.com")} />
          <Facebook className="h-5 w-5 hover:text-[var(--color-facebook)] cursor-pointer transition-colors" onClick={() => handleLinkClick("https://facebook.com")} />
        </div>

        {/* Custom Links Stack */}
        <div className="space-y-3 pt-2">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.url)}
              className="w-full flex items-center gap-3 p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-hover)] hover:-translate-y-0.5 duration-150 transition-all text-xs font-semibold text-[var(--color-text-secondary)] shadow-sm"
            >
              <div className="h-8 w-8 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                {getLinkIcon(link.iconType)}
              </div>
              <span className="flex-1 text-left truncate text-[var(--color-text)] font-bold">{link.title}</span>
              <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer branding */}
        <div className="pt-6 border-t border-[var(--color-border)]/40 flex flex-col items-center gap-1.5">
          <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)] animate-pulse" />
            Powered by SocialSphear
          </span>
        </div>

      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
