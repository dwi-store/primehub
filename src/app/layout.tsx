import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrimeHub — Premium Services. Better Life.",
  description:
    "Temukan layanan dan langganan digital premium favoritmu dengan pengalaman pemesanan yang mudah di PrimeHub.",
  applicationName: "PrimeHub",
  icons: {
    icon: [
      { url: "/primehub/favicon.svg", type: "image/svg+xml" },
      { url: "/primehub/favicon.ico", sizes: "any" },
      { url: "/primehub/favicon-32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [{ url: "/primehub/favicon-180.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}