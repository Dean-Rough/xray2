import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const styreneB = localFont({
  src: [
    {
      path: "../brand/App-fonts/StyreneB-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../brand/App-fonts/StyreneB-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-styrene",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Xrai - Website Analysis Tool",
  description: "Professional website analysis and reconstruction package generator for developers.",
  keywords: ["website analysis", "web development", "site reconstruction", "developer tools"],
  authors: [{ name: "Xrai" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${styreneB.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
