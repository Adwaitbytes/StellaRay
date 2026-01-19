import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Stellar Gateway | Web3 Wallet with Google Sign-In",
  description: "Create a Stellar blockchain wallet instantly with your Google account. No seed phrases, no complexity - just secure Web3 access.",
  keywords: ["Stellar", "Wallet", "Web3", "Blockchain", "Google Sign-In", "Crypto"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gradient-animated min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
