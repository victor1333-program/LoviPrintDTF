'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './Footer'

export function ConditionalFooter() {
  const pathname = usePathname()

  // No mostrar footer en rutas de admin
  const isAdminRoute = pathname.startsWith('/admin')

  if (isAdminRoute) {
    return null
  }

  return <Footer />
}
