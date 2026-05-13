import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Notaris Digital | Sistem Informasi Notaris & Monitoring Berkas",
  description: "Sistem monitoring pekerjaan notaris modern, profesional, dan realtime.",
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
