import type { Metadata } from "next";
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

const title = "Portfolio Platform";
const description = "A private platform for portfolios — held to an invitation, not an open door.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website" },
  // "summary_large_image" matches the 1200x630 opengraph-image.tsx
  // sibling in this route — Next auto-attaches it to both here.
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
