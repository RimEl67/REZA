import type { Metadata } from "next";
import { Red_Hat_Display, Red_Hat_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/Providers";

const redHatSans = Red_Hat_Display({
  variable: "--font-redhat-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
});

const redHatMono = Red_Hat_Mono({
  variable: "--font-redhat-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["monospace"],
});

export const metadata: Metadata = {
  title: "Reza : Votre Salon de Beauté en Ligne",
  description: "Bienvenu chez Reza, votre salon de beauté en ligne.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${redHatSans.variable} ${redHatMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
