"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
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
  X,
  Phone,
  Droplet,
  ChevronDown
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"

export function Navbar() {
  const { data: session } = useSession()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const menuItems = [
    {
      href: '/productos/transfer-dtf',
      label: 'Transfer DTF',
      icon: <Printer className="w-5 h-5" />,
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      href: '/bonos',
      label: 'Bonos',
      icon: <Ticket className="w-5 h-5" />,
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      label: 'Sublimación',
      icon: <Droplet className="w-5 h-5" />,
      gradient: 'from-cyan-500 to-cyan-600',
      submenu: [
        {
          href: 'https://www.loviprintdtf.es/productos/papel-de-sublimacion',
          label: 'Sublimación Metros'
        },
        {
          href: 'https://www.loviprintdtf.es/productos/folio-a4-sublimacion',
          label: 'Sublimación Folios'
        }
      ]
    },
    {
      href: '/faq',
      label: 'FAQ',
      icon: <HelpCircle className="w-5 h-5" />,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      href: '/contacto',
      label: 'Contacto',
      icon: <Mail className="w-5 h-5" />,
      gradient: 'from-green-500 to-green-600'
    }
  ]

  return (
    <>
      <header className="border-b bg-white shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        {/* Banner superior */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white py-1 sm:py-2">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-medium flex-wrap">
              {/* Teléfono */}
              <a
                href="tel:+34614051291"
                className="flex items-center gap-1.5 py-2.5 hover:text-orange-100 transition-colors group"
              >
                <Phone className="w-4 h-4 group-hover:animate-bounce" />
                <span className="font-semibold">+34 614 051 291</span>
              </a>

              <span className="hidden sm:inline text-orange-200">•</span>

              {/* Mensajes promocionales */}
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 fill-white animate-pulse hidden sm:inline" />
                <span className="text-center sm:text-left">Envío 24h en toda España</span>
                <Zap className="w-4 h-4 fill-white animate-pulse hidden sm:inline" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between sm:h-20 lg:h-28">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center group relative">
                <div className="absolute -left-2 -top-1 w-32 h-12 sm:-left-4 sm:-top-2 sm:w-48 sm:h-20 lg:w-64 lg:h-24 bg-gradient-to-br from-white to-gray-50 rounded-full shadow-2xl group-hover:shadow-orange-500/50 transition-all duration-300 group-hover:scale-105 border-4 border-orange-500/20"></div>
                <div className="relative h-10 w-28 sm:h-16 sm:w-40 lg:h-20 lg:w-56 z-10 transition-all duration-300 group-hover:scale-105 pl-2 sm:pl-4">
                  <Image
                    src="/logo.png"
                    alt="LoviPrintDTF - Impresión DTF"
                    fill
                    className="object-contain object-center"
                    priority
                  />
                </div>
              </Link>

              {/* Desktop Menu */}
              <nav className="hidden lg:flex items-center gap-2">
                {menuItems.map((item) => {
                  const hasSubmenu = 'submenu' in item && item.submenu

                  if (hasSubmenu) {
                    return (
                      <div
                        key={item.label}
                        className="relative"
                        onMouseEnter={() => setOpenDropdown(item.label)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        <button
                          className="group relative px-5 py-3 rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center gap-2.5"
                        >
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient} text-white group-hover:scale-110 transition-transform duration-300`}>
                            {item.icon}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                              {item.label}
                            </span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                          </div>
                          <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 group-hover:w-full transition-all duration-300"></div>
                        </button>

                        {/* Dropdown menu */}
                        {openDropdown === item.label && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                            {item.submenu.map((subitem) => (
                              <Link
                                key={subitem.href}
                                href={subitem.href}
                                className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                              >
                                <div className="font-semibold text-gray-900 text-sm">
                                  {subitem.label}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href || '#'}
                      className="group relative px-5 py-3 rounded-lg hover:bg-gray-50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient} text-white group-hover:scale-110 transition-transform duration-300`}>
                          {item.icon}
                        </div>
                        <span className="text-base font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 group-hover:w-full transition-all duration-300"></div>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <CartButton />

              {session?.user ? (
                <>
                  <Link href="/cuenta" className="hidden lg:block">
                    <Button variant="outline" size="sm" className="hover:bg-orange-50 hover:border-orange-300 transition-colors">
                      <User className="h-4 w-4 mr-2" />
                      Mi Cuenta
                    </Button>
                  </Link>
                  {session.user.role === 'ADMIN' && (
                    <Link href="/admin" className="hidden lg:block">
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
                    className="hover:bg-red-50 hover:text-red-600 transition-colors hidden lg:flex"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  className="hidden lg:flex bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <User className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
              )}

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-gray-700 hover:bg-gray-100 transition-colors lg:hidden"
                aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="lg:hidden border-t bg-white shadow-lg">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {menuItems.map((item) => {
                const hasSubmenu = 'submenu' in item && item.submenu

                if (hasSubmenu) {
                  return (
                    <div key={item.label} className="space-y-1">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient} text-white`}>
                            {item.icon}
                          </div>
                          <div className="font-semibold text-gray-900">{item.label}</div>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                      </button>
                      {openDropdown === item.label && (
                        <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-1">
                          {item.submenu.map((subitem) => (
                            <Link
                              key={subitem.href}
                              href={subitem.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block p-3 rounded-lg hover:bg-gray-50 transition-all duration-300"
                            >
                              <div className="font-semibold text-gray-900 text-sm">{subitem.label}</div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href || '#'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-300"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient} text-white`}>
                      {item.icon}
                    </div>
                    <div className="font-semibold text-gray-900">{item.label}</div>
                  </Link>
                )
              })}

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
