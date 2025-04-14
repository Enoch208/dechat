import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import UploadThingProvider from './providers/UploadThingProvider';
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

export const metadata: Metadata = {
  title: "DeChat - Secure Phrase-Based Chat",
  description: "A secure chat application using phrase-based access",
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
          </UploadThingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
