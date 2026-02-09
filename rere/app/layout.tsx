import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local"; // Tambahkan import ini
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Konfigurasi Font Valentine Lokal
const valentineFont = localFont({
  src: "../public/Font/Valentine.ttf", // Pastikan path dan nama file benar
  variable: "--font-valentine",
});

export const metadata: Metadata = {
  title: "Valentine for You",
  description: "Special website for a special person",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${geistSans.variable} 
          ${geistMono.variable} 
          ${valentineFont.variable} 
          antialiased
        `}
      >
        {children}
      </body>
    </html>
  );
}