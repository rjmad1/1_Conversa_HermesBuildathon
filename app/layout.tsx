import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppShell } from "./app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Conversa — Audio-First Meeting Intelligence",
    template: "%s | Conversa",
  },
  description:
    "Transform meetings into governed actions. Audio-first platform that captures, transcribes, analyzes, and proposes actionable outcomes with human-in-the-loop approval.",
  keywords: ["meeting intelligence", "audio transcription", "AI meeting notes", "action items"],
  robots: { index: false, follow: false }, // Prototype — not for public indexing
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AppShell>{children}</AppShell>
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "!bg-[var(--card)] !text-[var(--foreground)] !border-[var(--border)]",
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
