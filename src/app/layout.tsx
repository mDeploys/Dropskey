import { SpeedInsights } from "@vercel/speed-insights/next"
import { Inter } from "next/font/google"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import "./globals.css"
import { getSiteUrl, siteConfig } from "@/lib/site"

// Import providers
import { SessionProvider } from "@/context/session-context"
import { WishlistProvider } from "@/context/wishlist-context"
import { CartProvider } from "@/context/cart-context"
import { PayPalProvider } from "@/context/paypal-provider"

// Import client components
import ClientLayout from "./client-layout"



const inter = Inter({ subsets: ["latin"] })

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dropskey | Genuine Software Licenses and Digital Keys",
    template: "%s | Dropskey",
  },
  description: siteConfig.description,
  keywords: [
    "Dropskey",
    "digital keys",
    "software licenses",
    "Windows license",
    "Microsoft Office key",
    "antivirus license",
    "Kaspersky",
    "Adobe software",
    "Autodesk software",
  ],
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteConfig.name,
    title: "Dropskey | Genuine Software Licenses and Digital Keys",
    description: siteConfig.description,
    images: [
      {
        url: "/images/dropskey-logo.png",
        alt: "Dropskey digital software store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dropskey | Genuine Software Licenses and Digital Keys",
    description: siteConfig.description,
    images: ["/images/dropskey-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID
  const gaMeasurementId = 'G-BNKL9RH1XV' // Your Google Analytics 4 Measurement ID
  const facebookPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  const publicEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null,
    NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? null,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? null,
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <Script strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaMeasurementId}');
          `}
        </Script>

        {/* Facebook Pixel Code */}
        {facebookPixelId && (
          <Script id="facebook-pixel" strategy="lazyOnload">
            {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${facebookPixelId}');
            fbq('track', 'PageView');
          `}
          </Script>
        )}
        <Script id="public-env" strategy="beforeInteractive">
          {`window.__PUBLIC_ENV = ${JSON.stringify(publicEnv)};`}
        </Script>
      </head>
      <body className={inter.className}>
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}

        <SessionProvider>
          <WishlistProvider>
            <CartProvider>
              <PayPalProvider>
                <ClientLayout>
                  {children}
                </ClientLayout>
              </PayPalProvider>
            </CartProvider>
          </WishlistProvider>
        </SessionProvider>

        <SpeedInsights />
      </body>
    </html>
  );
}
