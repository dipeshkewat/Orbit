import React from "react";

/* ─── Official Brand Colors ─────────────────────────────── */
export const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  twitter: "#000000",
  x: "#000000",
  linkedin: "#0A66C2",
  facebook: "#1877F2",
  youtube: "#FF0000",
  threads: "#000000",
  tiktok: "#000000",
  pinterest: "#E60023",
  reddit: "#FF4500",
  telegram: "#26A5E4",
  bluesky: "#0085FF",
  mastodon: "#6364FF",
};

/* ─── Shared props ──────────────────────────────────────── */
interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

const defaults = (props: IconProps) => ({
  width: props.size ?? 20,
  height: props.size ?? 20,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  className: props.className,
  style: props.color ? { color: props.color } : undefined,
  "aria-hidden": true as const,
});

/* ─── Instagram ─────────────────────────────────────────── */
export function InstagramIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5Zm4.25 3.25a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5Zm0 1.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Zm5.5-.75a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
    </svg>
  );
}

/* ─── X (Twitter) ───────────────────────────────────────── */
export function XIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

/* ─── LinkedIn ──────────────────────────────────────────── */
export function LinkedInIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125ZM6.92 20.452H3.753V9H6.92v11.452Z" />
    </svg>
  );
}

/* ─── Facebook ──────────────────────────────────────────── */
export function FacebookIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
    </svg>
  );
}

/* ─── YouTube ───────────────────────────────────────────── */
export function YouTubeIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
    </svg>
  );
}

/* ─── Threads ───────────────────────────────────────────── */
export function ThreadsIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M12.186 24h-.007C5.461 23.956.057 18.509 0 11.743L0 11.7C.057 4.935 5.461-.512 12.179-.556h.014C18.927-.512 24.377 4.935 24.434 11.7c0 .014 0 .029-.001.043-.058 6.766-5.462 12.213-12.178 12.257h-.069ZM12.2 3.044h-.013C7.659 3.073 3.625 6.8 3.576 11.373v.327c.049 4.573 4.083 8.3 8.611 8.329h.014c4.528-.029 8.562-3.756 8.611-8.329v-.327c-.049-4.573-4.083-8.3-8.611-8.329Zm3.435 11.395c-.162.585-.623 1.037-1.208 1.188-.512.132-1.06.162-1.598.088a5.93 5.93 0 0 1-2.06-.667 5.86 5.86 0 0 1-1.65-1.267 5.85 5.85 0 0 1-1.065-1.73 5.93 5.93 0 0 1-.398-2.093c0-.743.14-1.463.412-2.133a5.83 5.83 0 0 1 1.149-1.78 5.85 5.85 0 0 1 1.717-1.197 5.92 5.92 0 0 1 4.233-.316c.563.171.994.641 1.139 1.208.144.57-.011 1.176-.412 1.606a5.69 5.69 0 0 0-.41.523 1.78 1.78 0 0 0-.293.907c-.01.346.086.672.271.954.29.444.412.966.355 1.483a2.577 2.577 0 0 1-.58 1.375c-.33.398-.768.685-1.257.833l-.045.018Z" />
    </svg>
  );
}

/* ─── TikTok ────────────────────────────────────────────── */
export function TikTokIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
    </svg>
  );
}

/* ─── Pinterest ─────────────────────────────────────────── */
export function PinterestIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0Z" />
    </svg>
  );
}

/* ─── Reddit ────────────────────────────────────────────── */
export function RedditIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0Zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701ZM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249Zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249Zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095Z" />
    </svg>
  );
}

/* ─── Telegram ──────────────────────────────────────────── */
export function TelegramIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="m11.944 0-.002.001C5.352.001 0 5.352 0 11.944c0 6.591 5.352 11.943 11.944 11.943 6.591 0 11.943-5.352 11.943-11.943S18.535 0 11.944 0Zm3.8 8.317-1.752 8.255c-.132.586-.477.729-.967.454l-2.672-1.969-1.289 1.24c-.143.143-.263.263-.538.263l.192-2.716 4.942-4.467c.215-.19-.047-.297-.333-.107l-6.112 3.849-2.633-.824c-.572-.179-.583-.572.12-.847l10.3-3.97c.476-.171.893.107.738.839h.004Z" />
    </svg>
  );
}

/* ─── Bluesky ───────────────────────────────────────────── */
export function BlueskyIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.585 3.591 6.138 3.21-4.3.678-8.083 2.328-4.922 8.191C5.451 27.037 13.274 22.248 12 16.88c1.274 5.367 6.467 10.028 10.16 4.768 3.16-5.863-.62-7.513-4.921-8.191 2.553.381 5.353-.583 6.137-3.21.247-.83.625-5.79.625-6.479 0-.688-.14-1.86-.902-2.203-.66-.3-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
    </svg>
  );
}

/* ─── Mastodon ──────────────────────────────────────────── */
export function MastodonIcon(props: IconProps) {
  return (
    <svg {...defaults(props)}>
      <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.547c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054 19.648 19.648 0 0 0 4.59.536l.347-.001c1.62-.042 3.329-.128 4.898-.494l.04-.01c2.476-.56 4.633-2.305 4.867-4.753.03-.315.09-.778.09-1.215 0-.37.111-3.71-.1-5.694ZM19.903 13h-2.72V7.706c0-1.407-.592-2.122-1.776-2.122-1.31 0-1.966.848-1.966 2.523V10.7H10.72V8.107c0-1.675-.656-2.523-1.966-2.523-1.184 0-1.776.715-1.776 2.122V13H4.182c0-2.593-.06-4.706.17-5.893C4.63 5.867 5.6 4.793 7.39 4.793c2.07 0 3.107 1.003 3.61 1.777l.778 1.305.778-1.305c.504-.774 1.54-1.777 3.61-1.777 1.79 0 2.76 1.074 3.037 2.314.23 1.187.17 3.3.17 5.893h.53Z" />
    </svg>
  );
}

/* ─── Helper: get icon component by platform name ───────── */
export function getPlatformIcon(
  platform: string,
  size = 16,
  colored = true
): React.ReactNode {
  const key = platform.toLowerCase().replace(/\s/g, "");
  const color = colored ? PLATFORM_COLORS[key] ?? PLATFORM_COLORS[key.replace("x(twitter)", "twitter")] : undefined;
  const className = `h-${size / 4} w-${size / 4}`;

  switch (key) {
    case "instagram":
      return <InstagramIcon size={size} color={color} />;
    case "twitter":
    case "x":
    case "x(twitter)":
      return <XIcon size={size} color={color} />;
    case "linkedin":
      return <LinkedInIcon size={size} color={color} />;
    case "facebook":
      return <FacebookIcon size={size} color={color} />;
    case "youtube":
      return <YouTubeIcon size={size} color={color} />;
    case "threads":
      return <ThreadsIcon size={size} color={color} />;
    case "tiktok":
      return <TikTokIcon size={size} color={color} />;
    case "pinterest":
      return <PinterestIcon size={size} color={color} />;
    case "reddit":
      return <RedditIcon size={size} color={color} />;
    case "telegram":
      return <TelegramIcon size={size} color={color} />;
    case "bluesky":
      return <BlueskyIcon size={size} color={color} />;
    case "mastodon":
      return <MastodonIcon size={size} color={color} />;
    default:
      return <span className="h-4 w-4 rounded-full bg-[var(--color-text-muted)]" />;
  }
}

/* ─── Helper: get icon component (no color, inherits) ──── */
export function PlatformIcon({
  platform,
  className = "h-4 w-4",
  colored = true,
}: {
  platform: string;
  className?: string;
  colored?: boolean;
}) {
  const key = platform.toLowerCase().replace(/\s/g, "");
  const color = colored ? PLATFORM_COLORS[key] ?? undefined : undefined;

  const iconProps = { className, color };

  switch (key) {
    case "instagram":
      return <InstagramIcon {...iconProps} />;
    case "twitter":
    case "x":
    case "x(twitter)":
      return <XIcon {...iconProps} />;
    case "linkedin":
      return <LinkedInIcon {...iconProps} />;
    case "facebook":
      return <FacebookIcon {...iconProps} />;
    case "youtube":
      return <YouTubeIcon {...iconProps} />;
    case "threads":
      return <ThreadsIcon {...iconProps} />;
    case "tiktok":
      return <TikTokIcon {...iconProps} />;
    case "pinterest":
      return <PinterestIcon {...iconProps} />;
    case "reddit":
      return <RedditIcon {...iconProps} />;
    case "telegram":
      return <TelegramIcon {...iconProps} />;
    case "bluesky":
      return <BlueskyIcon {...iconProps} />;
    case "mastodon":
      return <MastodonIcon {...iconProps} />;
    default:
      return <span className={className} />;
  }
}
