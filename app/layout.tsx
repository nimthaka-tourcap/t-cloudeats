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
  title: "t-cloud eats POS",
  description:
    "Craving delicious, hot street-style food? t-cloud eats is your premier cloud kitchen delivering fresh Kottu, Fried Rice, Noodles, and Devilled dishes to Mulleriyawa, Angoda, Kotikawatta, Kelanimulla, and IDH (within a 4km radius). Order now on WhatsApp!",
  keywords: [
    "t-cloud eats",
    "food delivery Mulleriyawa",
    "food delivery Angoda",
    "food delivery Kotikawatta",
    "cloud kitchen Mulleriyawa",
    "best kottu in Mulleriyawa",
    "fried rice delivery Mulleriyawa",
    "online food delivery Mulleriyawa",
    "Mulleriyawa food delivery",
    "Sri Lanka",
    "street food",
    "fried rice",
    "kotthu",
    "noodles",
  ],
  openGraph: {
    title: "t-cloud eats POS",
    description:
      "Premier cloud kitchen delivering fresh Kottu, Fried Rice, Noodles, and Devilled dishes to Mulleriyawa, Angoda, Kotikawatta, and IDH (within a 4km radius).",
    type: "website",
    url: "http://t-cloudeats.com/",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlow.variable} ${inter.variable}`}>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('PWA ServiceWorker registered successfully:', reg.scope);
                  }).catch(function(err) {
                    console.warn('PWA ServiceWorker registration failed:', err);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
