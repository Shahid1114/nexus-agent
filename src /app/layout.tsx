import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus — Your Autonomous AI Agent",
  description:
    "Tell Nexus what you need — YouTube automation, email replies, websites, content and more. It plans the work and delivers it.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#070a13] text-slate-200 antialiased">{children}</body>
    </html>
  );
}
