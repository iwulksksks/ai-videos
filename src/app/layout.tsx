import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reelhouse",
  description: "A cartoon office building where nine AI agents make short vertical story videos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
