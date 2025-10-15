"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

export default function TrackingUpdateButton() {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    setIsUpdating(true)

    try {
      const response = await fetch('/api/admin/tracking/update', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          `Tracking actualizado: ${data.updated} pedidos actualizados, ${data.delivered} entregados`,
          { duration: 5000 }
        )

        // Recargar la página para mostrar los cambios
        window.location.reload()
      } else {
        toast.error(data.error || 'Error al actualizar tracking')
      }
    } catch (error) {
      console.error('Error updating tracking:', error)
      toast.error('Error al actualizar tracking')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Button
      onClick={handleUpdate}
      disabled={isUpdating}
      variant="outline"
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
      {isUpdating ? 'Actualizando...' : 'Actualizar Tracking GLS'}
    </Button>
  )
}
