import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./sw-register";
import { AuthProvider } from "./lib/auth";
import { ClassesProvider } from "./lib/classes-store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Les Palmiers",
  description: "École Les Palmiers — annonces, devoirs, notes et emploi du temps.",
  applicationName: "Les Palmiers",
  appleWebApp: {
    capable: true,
    title: "Les Palmiers",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col">
        <AuthProvider>
          <ClassesProvider>
            <ServiceWorkerRegister />
            {children}
          </ClassesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
