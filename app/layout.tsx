import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import UploadThingProvider from './providers/UploadThingProvider';
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import InstallPWAWrapper from './components/InstallPWAWrapper';

export const metadata: Metadata = {
  title: "DeChat - Secure Phrase-Based Chat",
  description: "A secure chat application using phrase-based access",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  themeColor: "#4ade80",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DeChat",
  },
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <UploadThingProvider>
            <NextSSRPlugin 
              routerConfig={extractRouterConfig(ourFileRouter)}
            />
            {children}
            <InstallPWAWrapper />
          </UploadThingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
