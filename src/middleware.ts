import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Debug logs
  console.log('Middleware:', { pathname, isLoggedIn, userRole })

  // Rutas de admin requieren autenticación y role ADMIN
  if (pathname.startsWith('/admin')) {
    // Permitir acceso a /admin/login sin autenticación
    if (pathname === '/admin/login') {
      // Si ya está logueado como admin, redirigir al dashboard
      if (isLoggedIn && userRole === 'ADMIN') {
        console.log('Redirect: /admin/login -> /admin (already logged in as admin)')
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      console.log('Allow access to /admin/login')
      return NextResponse.next()
    }

    if (!isLoggedIn) {
      console.log('Redirect: /admin -> /admin/login (not logged in)')
      // Redirigir a página de login del admin
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    if (userRole !== 'ADMIN') {
      console.log('Redirect: /admin -> / (not admin role, role:', userRole, ')')
      return NextResponse.redirect(new URL('/', req.url))
    }
    console.log('Allow access to /admin (logged in as admin)')
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
