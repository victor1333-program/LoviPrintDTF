"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "./Navbar"

export function ConditionalNavbar() {
  const pathname = usePathname()

  // No mostrar Navbar en rutas de admin
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return <Navbar />
}
