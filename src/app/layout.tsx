import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { ConditionalNavbar } from "@/components/ConditionalNavbar"
import { Providers } from "@/components/Providers"
import { WhatsAppWidget } from "@/components/WhatsAppWidget"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LoviPrintDTF - Impresión DTF Profesional",
  description: "Transferencias DTF de alta calidad para textil y superficies rígidas. Precios por volumen, entrega en 24-48h.",
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
          <Toaster position="top-right" />
          <WhatsAppWidget />
        </Providers>
      </body>
    </html>
  )
}
