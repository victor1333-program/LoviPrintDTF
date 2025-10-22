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
  description: 'Transferencias DTF de alta calidad para textil. Desde Hellín, Albacete. Precios por volumen, entrega en 24-48h, bonos prepagados sin caducidad. Envío gratis en pedidos +100€.',
  keywords: ['impresión DTF', 'transfer DTF', 'DTF Albacete', 'DTF Hellín', 'transfer textil', 'personalización textil', 'impresión profesional', 'bonos DTF', 'DTF España', 'impresión DTF profesional'],
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
    description: 'Transferencias DTF de alta calidad. Precios por volumen, entrega 24-48h. Desde Hellín, Albacete',
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
    description: 'Transferencias DTF de alta calidad. Precios por volumen, entrega 24-48h',
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
      <body className={inter.className}>
        <Script
          id="schema-local-business"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "LoviPrintDTF",
              "image": "https://loviprintdtf.es/logo.png",
              "description": "Impresión DTF profesional de alta calidad para textil. Entrega en 24-48h. Bonos prepagados sin caducidad.",
              "@id": "https://loviprintdtf.es",
              "url": "https://loviprintdtf.es",
              "telephone": "Por confirmar",
              "email": "info@loviprintdtf.es",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Calle Antonio López del Oro 7",
                "addressLocality": "Hellín",
                "addressRegion": "Albacete",
                "postalCode": "02400",
                "addressCountry": "ES"
              },
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
