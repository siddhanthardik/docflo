import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "Gyrex - Practice Growth Platform",
  description:
    "Manage patients, appointments, and grow your practice with Google Business Profile optimization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("bg-gray-50 font-sans")}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}