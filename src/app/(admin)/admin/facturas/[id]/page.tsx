"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Download, Mail, Edit, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function FacturaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchInvoice()
  }, [])

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/admin/invoices/${params.id}`)
      if (!res.ok) throw new Error('Error al obtener factura')
      const data = await res.json()
      setInvoice(data)
    } catch (error: any) {
      console.error('Error fetching invoice:', error)
      toast.error('Error al cargar la factura')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!invoice) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/pdf`)
      if (!res.ok) throw new Error('Error al descargar')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Factura-${invoice.invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Factura descargada')
    } catch (error) {
      console.error('Error downloading:', error)
      toast.error('Error al descargar la factura')
    } finally {
      setDownloading(false)
    }
  }

  const sendEmail = async () => {
    if (!invoice) return
    setSendingEmail(true)
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (!res.ok) throw new Error('Error al enviar')

      const data = await res.json()
      toast.success(data.message || 'Email enviado correctamente')
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Error al enviar el email')
    } finally {
      setSendingEmail(false)
    }
  }

  const deleteInvoice = async () => {
    if (!invoice) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al eliminar')
      }

      toast.success('Factura eliminada correctamente')
      router.push('/admin/facturas')
    } catch (error: any) {
      console.error('Error deleting invoice:', error)
      toast.error(error.message || 'Error al eliminar la factura')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      ORDER: { label: 'Pedido', variant: 'success' as const },
      MANUAL: { label: 'Manual', variant: 'info' as const },
      QUOTE: { label: 'Presupuesto', variant: 'warning' as const }
    }
    const config = variants[type as keyof typeof variants] || variants.ORDER
    return <Badge variant={config.variant}>{config.label}</Badge>
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

  // Obtener items para mostrar
  const itemsToShow = invoice.type === 'MANUAL' && invoice.items
    ? invoice.items
    : invoice.order?.items || []

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {invoice.invoiceNumber}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            {getTypeBadge(invoice.type)}
            {invoice.order && (
              <Link href={`/admin/pedidos/${invoice.order.id}`}>
                <Badge variant="default">Pedido: {invoice.order.orderNumber}</Badge>
              </Link>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={downloadPDF}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Descargar PDF
          </Button>
          <Button
            variant="outline"
            onClick={sendEmail}
            disabled={sendingEmail}
          >
            {sendingEmail ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Enviar Email
          </Button>
          {invoice.type === 'MANUAL' && (
            <>
              <Button onClick={() => router.push(`/admin/facturas/${invoice.id}/editar`)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Diálogo de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>¿Eliminar factura?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                ¿Estás seguro de que deseas eliminar la factura {invoice.invoiceNumber}?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={deleteInvoice}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Nombre:</span>
                <p className="text-gray-900">{invoice.customerName}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email:</span>
                <p className="text-gray-900">{invoice.customerEmail}</p>
              </div>
              {invoice.customerPhone && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Teléfono:</span>
                  <p className="text-gray-900">{invoice.customerPhone}</p>
                </div>
              )}
              {invoice.customerTaxId && (
                <div>
                  <span className="text-sm font-medium text-gray-500">NIF/CIF:</span>
                  <p className="text-gray-900">{invoice.customerTaxId}</p>
                </div>
              )}
              {invoice.customerAddress && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Dirección:</span>
                  <p className="text-gray-900">
                    {invoice.customerAddress.street && `${invoice.customerAddress.street}, `}
                    {invoice.customerAddress.city && `${invoice.customerAddress.city}, `}
                    {invoice.customerAddress.postalCode && invoice.customerAddress.postalCode}
                    {invoice.customerAddress.state && `, ${invoice.customerAddress.state}`}
                    {invoice.customerAddress.country && `, ${invoice.customerAddress.country}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Descripción</th>
                      <th className="px-4 py-2 text-right">Cantidad</th>
                      <th className="px-4 py-2 text-right">Precio Unit.</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {itemsToShow.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2">
                          {item.description || item.productName}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {Number(item.quantity).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {Number(item.unitPrice).toFixed(2)}€
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          {Number(item.subtotal).toFixed(2)}€
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Totales */}
          <Card>
            <CardHeader>
              <CardTitle>Totales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{invoice.subtotal.toFixed(2)}€</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span>-{invoice.discountAmount.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">IVA ({invoice.taxRate}%):</span>
                <span className="font-medium">{invoice.taxAmount.toFixed(2)}€</span>
              </div>
              {invoice.shippingCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío:</span>
                  <span className="font-medium">{invoice.shippingCost.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>TOTAL:</span>
                <span>{invoice.totalPrice.toFixed(2)}€</span>
              </div>
            </CardContent>
          </Card>

          {/* Información */}
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Fecha de Emisión:</span>
                <p className="font-medium">
                  {new Date(invoice.issueDate).toLocaleDateString('es-ES')}
                </p>
              </div>
              {invoice.dueDate && (
                <div>
                  <span className="text-gray-500">Fecha de Vencimiento:</span>
                  <p className="font-medium">
                    {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Creada:</span>
                <p className="font-medium">
                  {new Date(invoice.createdAt).toLocaleDateString('es-ES')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
