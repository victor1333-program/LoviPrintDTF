"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, ShoppingCart, Users, Settings, LogOut, Printer, Package2, FileImage, Ticket, Mail, Tag, ListOrdered, Menu, X, FileText } from "lucide-react"
import { Button } from "../ui/Button"
import { useState, useEffect } from "react"

export default function AdminSidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [confirmedOrdersCount, setConfirmedOrdersCount] = useState(0)

  // Obtener el count de pedidos confirmados
  useEffect(() => {
    const fetchConfirmedCount = async () => {
      try {
        const response = await fetch('/api/admin/orders/count')
        if (response.ok) {
          const data = await response.json()
          setConfirmedOrdersCount(data.count || 0)
        }
      } catch (error) {
        console.error('Error al obtener count de pedidos:', error)
      }
    }

    fetchConfirmedCount()

    // Actualizar cada 30 segundos para mantener el badge actualizado
    const interval = setInterval(fetchConfirmedCount, 30000)

    return () => clearInterval(interval)
  }, [])

  const links = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: Home,
      badge: null
    },
    {
      href: "/admin/pedidos",
      label: "Pedidos",
      icon: Package2,
      badge: confirmedOrdersCount > 0 ? confirmedOrdersCount : null
    },
    {
      href: "/admin/cola-impresion",
      label: "Cola de Impresión",
      icon: ListOrdered,
      badge: null
    },
    {
      href: "/admin/presupuestos",
      label: "Presupuestos",
      icon: FileText,
      badge: null
    },
    {
      href: "/admin/productos",
      label: "Productos",
      icon: ShoppingCart,
      badge: null
    },
    {
      href: "/admin/bonos",
      label: "Bonos",
      icon: Ticket,
      badge: null
    },
    {
      href: "/admin/codigos-descuento",
      label: "Códigos Descuento",
      icon: Tag,
      badge: null
    },
    {
      href: "/admin/disenos",
      label: "Diseños Clientes",
      icon: FileImage,
      badge: null
    },
    {
      href: "/admin/usuarios",
      label: "Usuarios",
      icon: Users,
      badge: null
    },
    {
      href: "/admin/notificaciones",
      label: "Notificaciones",
      icon: Mail,
      badge: null
    },
    {
      href: "/admin/configuracion",
      label: "Configuración",
      icon: Settings,
      badge: null
    },
  ]

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-16 w-48">
            <Image
              src="/logo.png"
              alt="LoviPrintDTF"
              fill
              className="object-contain brightness-0 invert"
            />
          </div>
          <p className="text-sm text-white/90 font-medium">Panel de Control</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive
                  ? "bg-white text-purple-600 shadow-lg shadow-black/20"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-transform group-hover:scale-110",
                isActive ? "text-purple-600" : "text-white/90"
              )} />
              <span className="font-semibold">{link.label}</span>
              {link.badge && (
                <span className={cn(
                  "ml-auto text-xs px-2 py-1 rounded-full font-bold",
                  link.href === "/admin/pedidos"
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/50"
                    : "bg-white/20 text-white"
                )}>
                  {link.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        <Link href="/" className="block mb-3" onClick={() => setMobileMenuOpen(false)}>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200">
            <Home className="h-5 w-5" />
            <span className="font-medium">Ver Sitio Web</span>
          </button>
        </Link>
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-red-500/20 hover:text-white transition-all duration-200"
          onClick={() => {
            setMobileMenuOpen(false)
            window.location.href = '/api/auth/signout'
          }}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Botón Hamburguesa (Solo Móvil) */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-lg shadow-lg text-white"
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay (Solo Móvil) */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Mobile (Sheet) */}
      <aside
        className={cn(
          "w-64 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 h-screen flex flex-col fixed left-0 top-0 shadow-2xl z-40 transition-transform duration-300 lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 h-screen flex-col fixed left-0 top-0 shadow-2xl z-40">
        <SidebarContent />
      </aside>
    </>
  )
}
