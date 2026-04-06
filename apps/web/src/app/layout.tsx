import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventStream — Real-Time Analytics",
  description: "Ingest, process, and visualise user events in real-time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8f9fb] font-body antialiased">
        {children}
      </body>
    </html>
  );
}
