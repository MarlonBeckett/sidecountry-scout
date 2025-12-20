import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Sidecountry Scout",
  description: "Your backcountry safety companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-white font-body overflow-x-hidden selection:bg-primary selection:text-black topo-pattern grain-overlay">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
