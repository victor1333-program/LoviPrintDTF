"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Download, Eye, Printer } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface OrdersTableProps {
  orders: any[]
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [isPrinting, setIsPrinting] = useState(false)

  // Filtrar pedidos que están en estado READY (tienen etiqueta lista)
  const ordersWithLabels = orders.filter(order =>
    order.status === 'READY' && order.shipment?.trackingNumber
  )

  const toggleOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const toggleAll = () => {
    if (selectedOrders.size === ordersWithLabels.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(ordersWithLabels.map(o => o.id)))
    }
  }

  const handleBulkPrint = async () => {
    if (selectedOrders.size === 0) return

    setIsPrinting(true)
    try {
      const orderIds = Array.from(selectedOrders)

      // Abrir cada etiqueta en una nueva pestaña
      for (const orderId of orderIds) {
        const order = orders.find(o => o.id === orderId)
        if (order?.shipment?.trackingNumber) {
          // Abrir la etiqueta de GLS en una nueva pestaña
          const response = await fetch(`/api/admin/orders/${order.id}/label`)
          if (response.ok) {
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            window.open(url, '_blank')

            // Pequeño delay entre aperturas para evitar que el navegador bloquee
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      }

      // Limpiar selección después de imprimir
      setSelectedOrders(new Set())
    } catch (error) {
      console.error('Error printing labels:', error)
      alert('Error al imprimir las etiquetas')
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <div>
      {ordersWithLabels.length > 0 && (
        <div className="mb-4 flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedOrders.size === ordersWithLabels.length && ordersWithLabels.length > 0}
              onChange={toggleAll}
              className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {selectedOrders.size > 0
                ? `${selectedOrders.size} pedido${selectedOrders.size > 1 ? 's' : ''} seleccionado${selectedOrders.size > 1 ? 's' : ''}`
                : `Seleccionar todos (${ordersWithLabels.length})`
              }
            </span>
          </div>

          {selectedOrders.size > 0 && (
            <Button
              onClick={handleBulkPrint}
              disabled={isPrinting}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              {isPrinting ? 'Imprimiendo...' : `Imprimir ${selectedOrders.size} Etiqueta${selectedOrders.size > 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr className="text-left text-sm text-gray-600">
              <th className="p-3 w-12">
                {ordersWithLabels.length > 0 && (
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === ordersWithLabels.length && ordersWithLabels.length > 0}
                    onChange={toggleAll}
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                )}
              </th>
              <th className="p-3">Número</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Email</th>
              <th className="p-3">Metros</th>
              <th className="p-3">Total</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Pago</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const canSelect = order.status === 'READY' && order.shipment?.trackingNumber
              const isSelected = selectedOrders.has(order.id)

              return (
                <tr
                  key={order.id}
                  className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <td className="p-3">
                    {canSelect && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOrder(order.id)}
                        className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                    )}
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-sm font-medium">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="p-3">{order.customerName}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {order.customerEmail}
                  </td>
                  <td className="p-3">
                    <span className="font-semibold">
                      {order.metersOrdered ? order.metersOrdered.toString() + 'm' : '-'}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">
                    {formatCurrency(Number(order.totalPrice))}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="p-3">
                    <PaymentBadge status={order.paymentStatus} />
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/pedidos/${order.orderNumber}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {order.designFileUrl && (
                        <a
                          href={order.designFileUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    IN_PRODUCTION: 'bg-purple-100 text-purple-800',
    READY: 'bg-indigo-100 text-indigo-800',
    SHIPPED: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }

  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    IN_PRODUCTION: 'En Producción',
    READY: 'Listo',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  )
}

function PaymentBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  }

  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    PAID: 'Pagado',
    FAILED: 'Fallido',
    REFUNDED: 'Reembolsado',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  )
}
