"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import InvoiceForm from '@/components/admin/InvoiceForm'

export default function EditarFacturaPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoice()
  }, [])

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/admin/invoices/${params.id}`)
      if (!res.ok) throw new Error('Error al obtener factura')
      const data = await res.json()

      // Solo se pueden editar facturas manuales
      if (data.type !== 'MANUAL') {
        toast.error('Solo se pueden editar facturas manuales')
        router.push(`/admin/facturas/${params.id}`)
        return
      }

      setInvoice(data)
    } catch (error: any) {
      console.error('Error fetching invoice:', error)
      toast.error('Error al cargar la factura')
      router.push('/admin/facturas')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push(`/admin/facturas/${params.id}`)
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Factura no encontrada</p>
        <Button className="mt-4" onClick={() => router.push('/admin/facturas')}>
          Volver al listado
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Editar Factura
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {invoice.invoiceNumber}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la Factura</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            invoice={invoice}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  )
}
