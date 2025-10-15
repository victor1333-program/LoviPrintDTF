"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NotificacionesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir automáticamente a la página de plantillas
    router.push("/admin/notificaciones/plantillas")
  }, [router])

  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600">Redirigiendo a plantillas de email...</p>
      </div>
    </div>
  )
}
