import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AnimoChat – Anonymous Chat Platform",
  description: "Join AnimoChat for secure, anonymous group chats. Enjoy privacy-focused messaging with modern features.",
  keywords: [
    "anonymous chat",
    "group chat",
    "chatkool",
    "omegle",
    "privacy",
    "messaging",
    "secure chat",
    "AnimoChat"
  ],
  authors: [{ name: "AnimoChat Team", url: "https://animochat.com" }],
  openGraph: {
    title: "AnimoChat – Anonymous Chat Platform",
    description: "Join AnimoChat for secure, anonymous one to one chats or group chats. Enjoy privacy-focused messaging with modern features.",
    url: "https://animochat.com",
    siteName: "AnimoChat",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AnimoChat Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AnimoChat – Anonymous Group Chat Platform",
    description: "Join AnimoChat for secure, anonymous group chats. Enjoy privacy-focused messaging with modern features.",
    images: ["/og-image.png"],
    creator: "@animochat",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  themeColor: "#ffffff",
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "contain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://animochat.com" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-[100dvh] max-h-[100dvh] max-w-[100dvw]`}
      >
        {children}
      </body>
    </html>
  );
}
