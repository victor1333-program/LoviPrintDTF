"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import InvoiceForm from '@/components/admin/InvoiceForm'

export default function NuevaFacturaPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Nueva Factura Manual
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Crear factura para pedidos de WhatsApp u otros clientes externos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Factura</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            onSuccess={() => router.push('/admin/facturas')}
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  )
}
