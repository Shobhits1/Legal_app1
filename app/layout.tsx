import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/session-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { LegalVoiceAssistant } from "@/components/legal-voice-assistant";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "NyayaMitra — AI Legal Intelligence Platform",
  description: "AI-powered legal intelligence platform for accurate FIR writing, case law research, and investigation support. Built with Legal-BERT and Google Gemini.",
  keywords: "NyayaMitra, Legal AI, FIR Assistant, Case Laws, IPC Sections, BNS, Police, Law Enforcement, India",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider defaultTheme="dark" storageKey="nyayamitra-theme">
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
        </ThemeProvider>
      </body>
    </html>
  );
}
