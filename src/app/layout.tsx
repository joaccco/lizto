import type { Metadata } from "next";
import "@fontsource-variable/inter";

import "./globals.css";

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
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
