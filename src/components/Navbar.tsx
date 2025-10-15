"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "./ui/Button"
import { CartButton } from "./CartButton"
import { AuthModal } from "./AuthModal"
import {
  User,
  LayoutDashboard,
  LogOut,
  Printer,
  Ticket,
  HelpCircle,
  Mail,
  Zap,
  Menu,
  X
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"

export function Navbar() {
  const { data: session } = useSession()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = [
    {
      href: '/productos/transfer-dtf',
      label: 'Transfer DTF',
      icon: <Printer className="w-4 h-4" />,
      gradient: 'from-orange-500 to-orange-600',
      description: 'Impresión DTF'
    },
    {
      href: '/bonos',
      label: 'Bonos',
      icon: <Ticket className="w-4 h-4" />,
      gradient: 'from-purple-500 to-purple-600',
      description: 'Ahorra hasta 33%'
    },
    {
      href: '/faq',
      label: 'FAQ',
      icon: <HelpCircle className="w-4 h-4" />,
      gradient: 'from-blue-500 to-blue-600',
      description: 'Preguntas frecuentes'
    },
    {
      href: '/contacto',
      label: 'Contacto',
      icon: <Mail className="w-4 h-4" />,
      gradient: 'from-green-500 to-green-600',
      description: 'Escríbenos'
    }
  ]

  return (
    <>
      <header className="border-b bg-white shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        {/* Banner superior */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white py-2">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <Zap className="w-4 h-4 fill-white animate-pulse" />
              <span>Envío 24h en toda España • Bonos con hasta 33% descuento</span>
              <Zap className="w-4 h-4 fill-white animate-pulse" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <Printer className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                    LoviPrintDTF
                  </h1>
                  <p className="text-xs text-gray-500">Impresión DTF Express</p>
                </div>
              </Link>

              {/* Desktop Menu */}
              <nav className="hidden lg:flex items-center gap-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${item.gradient} text-white group-hover:scale-110 transition-transform duration-300`}>
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {item.label}
                        </span>
                        <span className="text-xs text-gray-500 hidden xl:block">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 group-hover:w-full transition-all duration-300"></div>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <CartButton />

              {session?.user ? (
                <>
                  <Link href="/cuenta" className="hidden md:block">
                    <Button variant="outline" size="sm" className="hover:bg-orange-50 hover:border-orange-300 transition-colors">
                      <User className="h-4 w-4 mr-2" />
                      Mi Cuenta
                    </Button>
                  </Link>
                  {session.user.role === 'ADMIN' && (
                    <Link href="/admin" className="hidden md:block">
                      <Button variant="ghost" size="sm" className="hover:bg-purple-50 hover:text-purple-600 transition-colors">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    title="Cerrar sesión"
                    className="hover:bg-red-50 hover:text-red-600 transition-colors hidden md:flex"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  className="hidden md:flex bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <User className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white shadow-lg">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient} text-white`}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              ))}

              <div className="pt-4 border-t space-y-2">
                {session?.user ? (
                  <>
                    <Link href="/cuenta" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Mi Cuenta
                      </Button>
                    </Link>
                    {session.user.role === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Admin
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                      className="w-full justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setShowAuthModal(true)
                    }}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-500"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Modal de autenticación */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}
