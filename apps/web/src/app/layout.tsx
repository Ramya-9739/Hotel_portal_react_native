import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F6F3EE",
};

export const metadata: Metadata = {
  title: "Around Me - Hotel Guest Portal",
  description: "Your digital concierge and companion during your stay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans text-foreground bg-background">{children}</body>
    </html>
  );
}
