import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { DebugPanel } from "@/components/debug/DebugPanel";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kapi — Your Personal Shopping Concierge",
  description:
    "Find the perfect gift or product in under 2 minutes. Kapi is your calm, intelligent personal shopping concierge.",
  keywords: ["Kapruka", "Sri Lanka", "gifts", "personal shopper", "concierge"],
  openGraph: {
    title: "Kapi — Find the Perfect Gift in 2 Minutes",
    description: "Your calm, personal shopping concierge for Sri Lanka.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <DebugPanel />
      </body>
    </html>
  );
}
