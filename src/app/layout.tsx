import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { ConditionalNavbar } from "@/components/ConditionalNavbar"
import { Providers } from "@/components/Providers"
import { WhatsAppWidget } from "@/components/WhatsAppWidget"
import { ConditionalFooter } from "@/components/ConditionalFooter"
import { CookieBanner } from "@/components/CookieBanner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LoviPrintDTF - Impresión DTF Profesional",
  description: "Transferencias DTF de alta calidad para textil y superficies rígidas. Precios por volumen, entrega en 24-48h.",
  icons: {
    icon: [
      { url: '/icon.png' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/icon.png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
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
