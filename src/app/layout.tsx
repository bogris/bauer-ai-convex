/** @format */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/convex-provider";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";
import Navbar from "./components/Navbar";
import { Button, Theme } from "@radix-ui/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bauer Assist",
  description: "Bauer Assist",
  manifest: "/manifest.json",
  icons: [
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "/favicon-16x16.png",
    },
    { rel: "apple-touch-icon", sizes: "180x180", url: "/apple-touch-icon.png" },
    {
      rel: "icon",
      type: "image/png",
      sizes: "192x192",
      url: "/android-chrome-192x192.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "512x512",
      url: "/android-chrome-512x512.png",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Theme>
            <ConvexClientProvider>
              <Navbar />
              <main>
                <SignedIn>{children}</SignedIn>
                <SignedOut>
                  <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <p className="mb-4 text-lg text-gray-600">
                      Please sign in to access the app features.
                    </p>
                    <SignInButton>
                      <Button color="sky">Sign in</Button>
                    </SignInButton>
                  </div>
                </SignedOut>
              </main>
            </ConvexClientProvider>
          </Theme>
        </body>
      </html>
    </ClerkProvider>
  );
}
