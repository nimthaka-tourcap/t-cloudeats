import type { Metadata } from "next";
import { Barlow, Inter } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "t-cloud eats | Bold Flavors. Delivered Fast.",
  description:
    "A modern cloud kitchen bringing hygienically prepared, richly flavored street-style meals right to your door. Always boldly flavored, and always satisfying. Order now on WhatsApp!",
  keywords: [
    "t-cloud eats",
    "cloud kitchen",
    "food delivery",
    "Mulleriyawa",
    "Sri Lanka",
    "street food",
    "fried rice",
    "kotthu",
    "noodles",
  ],
  openGraph: {
    title: "t-cloud eats | Bold Flavors. Delivered Fast.",
    description:
      "Modern cloud kitchen. Hygienically prepared, boldly flavored street-style meals delivered to your door.",
    type: "website",
    url: "http://t-cloudeats.com/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlow.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
