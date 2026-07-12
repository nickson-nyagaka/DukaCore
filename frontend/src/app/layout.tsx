import type { Metadata } from "next";
import { Raleway, Cantarell } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import MarketplaceShell from "@/components/MarketplaceShell";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-heading-family",
  display: "swap",
});

const cantarell = Cantarell({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body-family",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DukaCore E-Commerce Platform",
  description:
    "Launch your online store in seconds.E-commerce with M-Pesa Integration",
  keywords:
    "e-commerce, online store, M-Pesa, Kenya",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${raleway.variable} ${cantarell.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Render-blocking inline script for 0ms Theme & Brand Initialization (No FOUC) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('theme');
                  var theme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                  var storedBrand = localStorage.getItem('brand') || 'default';
                  document.documentElement.setAttribute('data-brand', storedBrand);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <MarketplaceShell>{children}</MarketplaceShell>
        </Providers>
      </body>
    </html>
  );
}

