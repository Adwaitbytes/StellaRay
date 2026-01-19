import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stellar zkLogin Gateway",
  description: "Sign in with Google or Apple to create a Stellar wallet - no seed phrases required",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-stellar-darker text-white min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
