import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F5F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "STELLARAY | ZK Wallet",
    template: "%s | STELLARAY",
  },
  description: "Create a Stellar blockchain wallet instantly with your Google account. Prove Everything. Reveal Nothing. Powered by zkLogin and X-Ray Protocol.",
  keywords: [
    "Stellar",
    "Wallet",
    "Web3",
    "Blockchain",
    "Google Sign-In",
    "Crypto",
    "zkLogin",
    "Zero Knowledge",
    "X-Ray Protocol",
    "Self-Custody",
    "DeFi",
    "Soroban",
    "Stellaray",
  ],
  authors: [{ name: "Stellaray Team" }],
  creator: "Stellaray",
  publisher: "Stellaray",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://stellaray.fun"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://stellaray.fun",
    siteName: "STELLARAY",
    title: "STELLARAY - Prove Everything. Reveal Nothing.",
    description: "Create a Stellar blockchain wallet instantly with your Google account. Prove Everything. Reveal Nothing. Powered by zkLogin & X-Ray Protocol.",
  },
  twitter: {
    card: "summary_large_image",
    title: "STELLARAY - Prove Everything. Reveal Nothing.",
    description: "ZK-powered Stellar wallet. Prove Everything. Reveal Nothing. Powered by zkLogin & X-Ray Protocol.",
    creator: "@stellaraydotfun",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/manifest.json",
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body style={{ fontFamily: "var(--font-space), 'Arial Black', sans-serif" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
