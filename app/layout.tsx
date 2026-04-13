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

export const metadata: Metadata = {
  title: "Agora Protocol — Autonomous M2M Settlement",
  description:
    "Autonomous Machine-to-Machine settlement protocol powered by Locus Paygentic. AI agents negotiate, verify, and settle digital asset trades on-chain — zero human intervention.",
  keywords: [
    "Agora Protocol",
    "Locus",
    "Paygentic",
    "M2M",
    "AI Agents",
    "Autonomous Settlement",
    "Base",
    "USDC",
    "ERC-4337",
  ],
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Agora Protocol — Autonomous M2M Settlement",
    description:
      "AI agents negotiate and settle digital assets autonomously on Base. Powered by Locus Paygentic.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
