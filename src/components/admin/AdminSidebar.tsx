"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, ShoppingCart, Users, Settings, LogOut, Printer, Package2, FileImage, Ticket, Mail, Tag, ListOrdered } from "lucide-react"
import { Button } from "../ui/Button"

export default function AdminSidebar() {
  const pathname = usePathname()

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
      badge: null
    },
    {
      href: "/admin/cola-impresion",
      label: "Cola de Impresión",
      icon: ListOrdered,
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

  return (
    <aside className="w-64 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 h-screen flex flex-col fixed left-0 top-0 shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30">
            <Printer className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              DTF Print
            </h2>
            <p className="text-xs text-white/80 font-medium">Panel de Control</p>
          </div>
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
                <span className="ml-auto bg-white/20 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {link.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        <Link href="/" className="block mb-3">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all duration-200">
            <Home className="h-5 w-5" />
            <span className="font-medium">Ver Sitio Web</span>
          </button>
        </Link>
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-red-500/20 hover:text-white transition-all duration-200"
          onClick={() => {
            window.location.href = '/api/auth/signout'
          }}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
