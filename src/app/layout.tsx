import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Docflo - Practice Growth Platform",
  description:
    "Manage patients, appointments, and grow your practice with Google Business Profile optimization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans antialiased", inter.variable)}>
      <body className={cn(inter.className, "bg-gray-50")}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}