import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/session-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { LegalVoiceAssistant } from "@/components/legal-voice-assistant";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LegalAI - Police FIR Assistant",
  description: "AI-powered legal information system for police stations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <SessionProvider>
            <SidebarProvider>
              <AppSidebar />
              <main className="flex-1 overflow-hidden">{children}</main>
            </SidebarProvider>
            <LegalVoiceAssistant />
            <Toaster />
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

