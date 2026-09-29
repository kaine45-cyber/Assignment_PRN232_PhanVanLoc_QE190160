import type { Metadata } from "next";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TaskTrack", template: "%s · TaskTrack" },
  description: "Task & Team Management — PRN232 Assignment 1",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          TaskTrack · PRN232 Assignment 1
        </footer>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
