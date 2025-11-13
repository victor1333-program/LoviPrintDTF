"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Download, Eye, Printer, FileText, RefreshCw, XCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

interface OrdersTableProps {
  orders: any[]
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const router = useRouter()
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [isPrinting, setIsPrinting] = useState(false)
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null)
  const [changingStatus, setChangingStatus] = useState<string | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<any>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null)
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null)

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

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    setDownloadingInvoice(invoiceId)
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/pdf`)

      if (!res.ok) {
        throw new Error('Error al descargar la factura')
      }

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
    } catch (error: any) {
      console.error('Error downloading invoice:', error)
      toast.error(error.message || 'Error al descargar la factura')
    } finally {
      setDownloadingInvoice(null)
    }
  }

  const openStatusModal = (order: any) => {
    setSelectedOrderForStatus(order)
    setNewStatus(order.status)
    setStatusModalOpen(true)
  }

  const closeStatusModal = () => {
    setStatusModalOpen(false)
    setSelectedOrderForStatus(null)
    setNewStatus('')
  }

  const confirmStatusChange = async () => {
    if (!selectedOrderForStatus || !newStatus) return

    setChangingStatus(selectedOrderForStatus.id)
    try {
      const res = await fetch(`/api/orders/${selectedOrderForStatus.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (!res.ok) {
        throw new Error('Error al cambiar el estado')
      }

      toast.success('Estado actualizado correctamente')
      closeStatusModal()
      // Recargar la página para ver los cambios
      window.location.reload()
    } catch (error: any) {
      console.error('Error changing status:', error)
      toast.error(error.message || 'Error al cambiar el estado')
    } finally {
      setChangingStatus(null)
    }
  }

  const handleCancelOrder = async (order: any) => {
    if (!confirm(`¿Cancelar el pedido ${order.orderNumber}?\n\nEsta acción cambiará el estado del pedido a CANCELADO.`)) {
      return
    }

    setCancellingOrder(order.id)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED'
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cancelar el pedido')
      }

      toast.success('Pedido cancelado correctamente')
      router.refresh()
    } catch (error: any) {
      console.error('Error cancelling order:', error)
      toast.error(error.message || 'Error al cancelar el pedido')
    } finally {
      setCancellingOrder(null)
    }
  }

  const handleDeleteOrder = async (order: any) => {
    if (!confirm(`⚠️ ELIMINAR PEDIDO ${order.orderNumber}\n\nEsta acción es IRREVERSIBLE y eliminará:\n- El pedido y todos sus datos\n- Items del pedido\n- Historial de estados\n- Envío y tracking (si existe)\n- Factura (si existe)\n\n¿Estás seguro de que deseas continuar?`)) {
      return
    }

    setDeletingOrder(order.id)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al eliminar el pedido')
      }

      toast.success(data.message || 'Pedido eliminado correctamente')
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting order:', error)
      toast.error(error.message || 'Error al eliminar el pedido')
    } finally {
      setDeletingOrder(null)
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
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`/admin/pedidos/${order.orderNumber}`}>
                        <Button size="sm" variant="outline" title="Ver detalles">
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
                          <Button size="sm" variant="outline" title="Descargar diseño">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      {/* Botón de Factura */}
                      {order.invoice && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadInvoice(order.invoice.id, order.invoice.invoiceNumber)}
                          disabled={downloadingInvoice === order.invoice.id}
                          title="Descargar factura"
                        >
                          {downloadingInvoice === order.invoice.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {/* Botón de Cambiar Estado */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openStatusModal(order)}
                        disabled={changingStatus === order.id}
                        title="Cambiar estado"
                      >
                        {changingStatus === order.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      {/* Botón de Cancelar */}
                      {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelOrder(order)}
                          disabled={cancellingOrder === order.id}
                          title="Cancelar pedido"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          {cancellingOrder === order.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {/* Botón de Eliminar - Solo para pedidos PENDING o CANCELLED */}
                      {(order.status === 'PENDING' || order.status === 'CANCELLED') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteOrder(order)}
                          disabled={deletingOrder === order.id}
                          title="Eliminar pedido"
                          className="border-red-500 text-red-700 hover:bg-red-100"
                        >
                          {deletingOrder === order.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Cambio de Estado */}
      {statusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Cambiar Estado del Pedido
            </h3>

            {selectedOrderForStatus && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Pedido: <span className="font-mono font-semibold">{selectedOrderForStatus.orderNumber}</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Cliente: <span className="font-semibold">{selectedOrderForStatus.customerName}</span>
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Estado
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="CONFIRMED">Confirmado</option>
                  <option value="IN_PRODUCTION">En Producción</option>
                  <option value="READY">Listo</option>
                  <option value="SHIPPED">Enviado</option>
                  <option value="DELIVERED">Entregado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={closeStatusModal}
                disabled={changingStatus === selectedOrderForStatus?.id}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmStatusChange}
                disabled={changingStatus === selectedOrderForStatus?.id}
              >
                {changingStatus === selectedOrderForStatus?.id ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Confirmar'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
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
