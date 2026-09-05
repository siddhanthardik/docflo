import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import Providers from "@/components/providers";
import Script from "next/script";

import { FloatingWhatsAppWidget } from "@/components/floating-whatsapp-widget";

export const metadata: Metadata = {
  title: "Gyrex - Practice Growth Platform",
  description:
    "Manage patients, appointments, and grow your practice with Google Business Profile optimization",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gyrex Clinic",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-sans antialiased scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />

        {/* Google Tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Z31NGSX2WV"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Z31NGSX2WV');
          `}
        </Script>

        {/* Google Tag Manager Container */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-KJLKVHMQ');
          `}
        </Script>
      </head>
      <body className={cn("bg-gray-50 font-sans")}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KJLKVHMQ"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Providers>
          {children}
          <FloatingWhatsAppWidget />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}