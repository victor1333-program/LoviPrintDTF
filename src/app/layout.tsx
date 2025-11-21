import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { ConditionalNavbar } from "@/components/ConditionalNavbar"
import { Providers } from "@/components/Providers"
import { WhatsAppWidget } from "@/components/WhatsAppWidget"
import { ConditionalFooter } from "@/components/ConditionalFooter"
import { CookieBanner } from "@/components/CookieBanner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://loviprintdtf.es'),
  title: {
    default: 'LoviPrintDTF - Impresión DTF Profesional en Hellín, Albacete',
    template: '%s | LoviPrintDTF'
  },
  description: 'DTF de máxima calidad para textil. DTF Rápido con entrega en 24-48h. Desde Hellín, Albacete. Precios por volumen, bonos prepagados sin caducidad. Envío gratis en pedidos +100€.',
  keywords: ['impresión DTF', 'DTF rápido', 'DTF Albacete', 'DTF Hellín', 'transfer DTF', 'transfer textil', 'personalización textil', 'impresión profesional', 'bonos DTF', 'DTF España', 'impresión DTF profesional', 'DTF 24h'],
  authors: [{ name: 'LoviPrintDTF' }],
  creator: 'LoviPrintDTF',
  publisher: 'LoviPrintDTF',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://loviprintdtf.es',
    title: 'LoviPrintDTF - Impresión DTF Profesional',
    description: 'DTF de máxima calidad. DTF Rápido con entrega en 24-48h. Precios por volumen. Desde Hellín, Albacete',
    siteName: 'LoviPrintDTF',
    images: [{
      url: '/logo.png',
      width: 1200,
      height: 630,
      alt: 'LoviPrintDTF - Impresión DTF Profesional',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LoviPrintDTF - Impresión DTF Profesional',
    description: 'DTF de máxima calidad. DTF Rápido con entrega en 24-48h. Precios por volumen',
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/icon.png' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/icon.png' },
    ],
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WSHM34SL');`
          }}
        />
      </head>
      <body className={inter.className}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WSHM34SL"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Script
          id="schema-local-business"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "LoviPrintDTF",
              "image": "https://loviprintdtf.es/logo.png",
              "description": "DTF de máxima calidad para textil. DTF Rápido con entrega en 24-48h. Bonos prepagados sin caducidad.",
              "@id": "https://loviprintdtf.es",
              "url": "https://loviprintdtf.es",
              "telephone": "+34614051291",
              "email": "info@loviprintdtf.es",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Calle Antonio López del Oro 7",
                "addressLocality": "Hellín",
                "addressRegion": "Albacete",
                "postalCode": "02400",
                "addressCountry": "ES"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "38.5084873",
                "longitude": "-1.7808199"
              },
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  "opens": "09:00",
                  "closes": "13:00"
                },
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  "opens": "17:00",
                  "closes": "20:00"
                }
              ],
              "sameAs": [
                "https://www.youtube.com/@loviprintdtf",
                "https://www.instagram.com/loviprintdtf",
                "https://www.tiktok.com/@loviprintdtf"
              ],
              "priceRange": "€€",
              "paymentAccepted": "Cash, Credit Card, PayPal",
              "currenciesAccepted": "EUR",
              "areaServed": {
                "@type": "Country",
                "name": "España"
              }
            })
          }}
        />
        <Script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "LoviPrintDTF",
              "url": "https://loviprintdtf.es",
              "logo": "https://loviprintdtf.es/logo.png",
              "description": "DTF de máxima calidad para textil. DTF Rápido con entrega en 24-48h. Especialistas en impresión DTF profesional desde Hellín, Albacete.",
              "email": "info@loviprintdtf.es",
              "telephone": "+34614051291",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Calle Antonio López del Oro 7",
                "addressLocality": "Hellín",
                "addressRegion": "Albacete",
                "postalCode": "02400",
                "addressCountry": "ES"
              },
              "sameAs": [
                "https://www.youtube.com/@loviprintdtf",
                "https://www.instagram.com/loviprintdtf",
                "https://www.tiktok.com/@loviprintdtf"
              ],
              "founder": {
                "@type": "Person",
                "name": "LoviPrintDTF"
              },
              "foundingDate": "2024",
              "areaServed": {
                "@type": "Country",
                "name": "España"
              }
            })
          }}
        />
        <Providers>
          <ConditionalNavbar />
          {children}
          <ConditionalFooter />
          <Toaster position="top-right" />
          <WhatsAppWidget />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
