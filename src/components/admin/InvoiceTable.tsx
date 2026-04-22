"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Eye, Download, Mail, Edit, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface Invoice {
  id: string
  invoiceNumber: string
  type: 'ORDER' | 'MANUAL' | 'QUOTE'
  customerName: string
  customerEmail: string
  totalPrice: number
  issueDate: string
  order?: { orderNumber: string }
}

interface InvoiceTableProps {
  invoices: Invoice[]
}

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
  const router = useRouter()
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)

  const getTypeBadge = (type: string) => {
    const variants = {
      ORDER: { label: 'Pedido', variant: 'success' as const },
      MANUAL: { label: 'Manual', variant: 'info' as const },
      QUOTE: { label: 'Presupuesto', variant: 'warning' as const }
    }
    const config = variants[type as keyof typeof variants] || variants.ORDER
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    setDownloadingInvoice(invoiceId)
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`)
      if (!res.ok) throw new Error('Error al descargar')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Factura-${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Factura descargada')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Error al descargar la factura')
    } finally {
      setDownloadingInvoice(null)
    }
  }

  const sendEmail = async (invoiceId: string) => {
    setSendingEmail(invoiceId)
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/send-email`, {
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
      setSendingEmail(null)
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay facturas para mostrar
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Número
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Fecha
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">
                {invoice.invoiceNumber}
              </td>
              <td className="px-6 py-4">
                {getTypeBadge(invoice.type)}
              </td>
              <td className="px-6 py-4">{invoice.customerName}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {invoice.customerEmail}
              </td>
              <td className="px-6 py-4 font-semibold">
                {invoice.totalPrice.toFixed(2)}€
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(invoice.issueDate).toLocaleDateString('es-ES')}
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/admin/facturas/${invoice.id}`)}
                    title="Ver detalle"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadInvoice(invoice.id, invoice.invoiceNumber)}
                    disabled={downloadingInvoice === invoice.id}
                    title="Descargar PDF"
                  >
                    {downloadingInvoice === invoice.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => sendEmail(invoice.id)}
                    disabled={sendingEmail === invoice.id}
                    title="Enviar por email"
                  >
                    {sendingEmail === invoice.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>
                  {invoice.type === 'MANUAL' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/admin/facturas/${invoice.id}/editar`)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
