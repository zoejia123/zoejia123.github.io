import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "66offer Hong Kong Finance Jobs",
  description: "A daily refreshed list of finance jobs in Hong Kong."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
