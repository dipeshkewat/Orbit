import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { TrpcProvider } from "@/components/trpc-provider";
import { AuthGuard } from "@/components/auth-guard";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SocialSphear — Social Media Management Platform",
    template: "%s | SocialSphear",
  },
  description:
    "AI-powered social media management and scheduling platform. Connect all your accounts, create content once, schedule everywhere.",
  keywords: [
    "social media management",
    "social media scheduling",
    "content calendar",
    "AI captions",
    "Buffer alternative",
    "Hootsuite alternative",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SocialSphear",
    title: "SocialSphear — Social Media Management Platform",
    description:
      "AI-powered social media management and scheduling platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SocialSphear",
    description:
      "AI-powered social media management and scheduling platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <TrpcProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </TrpcProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "bg-surface border-border",
          }}
        />
      </body>
    </html>
  );
}

