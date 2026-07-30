import type { Metadata } from "next";
import "@fontsource-variable/inter";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalBottomNav } from "@/components/layout/ConditionalBottomNav";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Lizto — Marketplace de servicios",
  description: "Contratá profesionales verificados para lo que necesitás resolver.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <main className="pb-16 flex-1">{children}</main>
            <ConditionalBottomNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
