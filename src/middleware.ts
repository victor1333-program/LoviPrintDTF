import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Rutas de admin requieren autenticación y role ADMIN
  if (pathname.startsWith('/admin')) {
    // Permitir acceso a /admin/login sin autenticación
    if (pathname === '/admin/login') {
      // Si ya está logueado como admin, redirigir al dashboard
      if (isLoggedIn && userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.next()
    }

    if (!isLoggedIn) {
      // Redirigir a página de login del admin
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Redirigir usuarios autenticados fuera de las páginas de auth
  if (pathname.startsWith('/auth') && isLoggedIn) {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/auth/:path*',
  ]
}
