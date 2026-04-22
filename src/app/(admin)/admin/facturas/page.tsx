import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import InvoiceTable from '@/components/admin/InvoiceTable'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FacturasPage() {
  const invoicesRaw = await prisma.invoice.findMany({
    orderBy: { issueDate: 'desc' },
    include: {
      order: {
        select: { orderNumber: true, status: true }
      }
    }
  })

  const invoices = invoicesRaw.map(inv => ({
    ...inv,
    issueDate: inv.issueDate.toISOString(),
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
    dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
    subtotal: Number(inv.subtotal),
    discountAmount: Number(inv.discountAmount),
    taxAmount: Number(inv.taxAmount),
    taxRate: Number(inv.taxRate),
    shippingCost: Number(inv.shippingCost),
    totalPrice: Number(inv.totalPrice)
  }))

  const stats = {
    total: invoices.length,
    manual: invoices.filter(i => i.type === 'MANUAL').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.totalPrice, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Facturación
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Gestiona todas las facturas generadas automáticamente o manualmente
          </p>
        </div>
        <Link href="/admin/facturas/nueva">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura Manual
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Total Facturas</div>
            <div className="text-2xl font-bold mt-2">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Facturas Manuales</div>
            <div className="text-2xl font-bold mt-2">{stats.manual}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Total Facturado</div>
            <div className="text-2xl font-bold mt-2">{stats.totalAmount.toFixed(2)}€</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceTable invoices={invoices as any} />
        </CardContent>
      </Card>
    </div>
  )
}
