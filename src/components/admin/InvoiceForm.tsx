"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface InvoiceFormProps {
  invoice?: any
  onSuccess: () => void
  onCancel: () => void
}

export default function InvoiceForm({
  invoice,
  onSuccess,
  onCancel
}: InvoiceFormProps) {
  const [loading, setLoading] = useState(false)

  // Datos del cliente
  const [customerName, setCustomerName] = useState(invoice?.customerName || '')
  const [customerEmail, setCustomerEmail] = useState(invoice?.customerEmail || '')
  const [customerPhone, setCustomerPhone] = useState(invoice?.customerPhone || '')
  const [customerTaxId, setCustomerTaxId] = useState(invoice?.customerTaxId || '')

  // Dirección
  const [street, setStreet] = useState(invoice?.customerAddress?.street || '')
  const [city, setCity] = useState(invoice?.customerAddress?.city || '')
  const [postalCode, setPostalCode] = useState(invoice?.customerAddress?.postalCode || '')
  const [state, setState] = useState(invoice?.customerAddress?.state || '')
  const [country, setCountry] = useState(invoice?.customerAddress?.country || 'España')

  // Items
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items || [{ description: '', quantity: 1, unitPrice: 0, subtotal: 0 }]
  )

  // Importes
  const [discountAmount, setDiscountAmount] = useState(invoice?.discountAmount || 0)
  const [taxRate, setTaxRate] = useState(invoice?.taxRate || 21)
  const [shippingCost, setShippingCost] = useState(invoice?.shippingCost || 0)

  // Metadatos
  const [issueDate, setIssueDate] = useState(
    invoice?.issueDate
      ? new Date(invoice.issueDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [dueDate, setDueDate] = useState(
    invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : ''
  )
  const [notes, setNotes] = useState(invoice?.notes || '')

  // Cálculos automáticos
  const [subtotal, setSubtotal] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)

  // Actualizar subtotal de un item
  const updateItemSubtotal = (index: number) => {
    const item = items[index]
    const newSubtotal = item.quantity * item.unitPrice
    const newItems = [...items]
    newItems[index].subtotal = newSubtotal
    setItems(newItems)
  }

  // Añadir item
  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, subtotal: 0 }])
  }

  // Eliminar item
  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error('Debe haber al menos un item')
      return
    }
    setItems(items.filter((_, i) => i !== index))
  }

  // Calcular totales automáticamente
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    setSubtotal(newSubtotal)

    const base = newSubtotal - discountAmount
    const newTaxAmount = (base * taxRate) / 100
    setTaxAmount(newTaxAmount)

    const newTotal = base + newTaxAmount + shippingCost
    setTotalPrice(newTotal)
  }, [items, discountAmount, taxRate, shippingCost])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!customerName || !customerEmail) {
      toast.error('Nombre y email del cliente son requeridos')
      return
    }

    if (items.some(item => !item.description)) {
      toast.error('Todos los items deben tener descripción')
      return
    }

    if (items.some(item => item.quantity <= 0 || item.unitPrice < 0)) {
      toast.error('Las cantidades deben ser positivas y los precios no negativos')
      return
    }

    setLoading(true)

    try {
      const data = {
        customerName,
        customerEmail,
        customerPhone: customerPhone || undefined,
        customerTaxId: customerTaxId || undefined,
        customerAddress: street || city || postalCode || state
          ? { street, city, postalCode, state, country }
          : undefined,
        items,
        subtotal,
        discountAmount,
        taxRate,
        taxAmount,
        shippingCost,
        totalPrice,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes || undefined
      }

      const url = invoice
        ? `/api/admin/invoices/${invoice.id}`
        : '/api/admin/invoices'

      const method = invoice ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al guardar factura')
      }

      toast.success(`Factura ${invoice ? 'actualizada' : 'creada'} correctamente`)
      onSuccess()
    } catch (error: any) {
      console.error('Error saving invoice:', error)
      toast.error(error.message || 'Error al guardar factura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Sección Cliente */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Datos del Cliente</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
          <div>
            <Label>NIF/CIF</Label>
            <Input
              value={customerTaxId}
              onChange={(e) => setCustomerTaxId(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Sección Dirección */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Dirección (Opcional)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Calle</Label>
            <Input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>
          <div>
            <Label>Ciudad</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div>
            <Label>Código Postal</Label>
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
            />
          </div>
          <div>
            <Label>Provincia</Label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
          <div>
            <Label>País</Label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Sección Items */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Items de la Factura *</h3>
          <Button type="button" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Item
          </Button>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5">
                  <Label>Descripción *</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[index].description = e.target.value
                      setItems(newItems)
                    }}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Cantidad *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[index].quantity = parseFloat(e.target.value) || 0
                      setItems(newItems)
                      updateItemSubtotal(index)
                    }}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Precio Unit. *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const newItems = [...items]
                      newItems[index].unitPrice = parseFloat(e.target.value) || 0
                      setItems(newItems)
                      updateItemSubtotal(index)
                    }}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Subtotal</Label>
                  <Input
                    value={item.subtotal.toFixed(2)}
                    disabled
                  />
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección Importes */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Importes</h3>
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Descuento (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>IVA (%)</Label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
              >
                <option value="0">0% (Exento)</option>
                <option value="4">4% (Superreducido)</option>
                <option value="10">10% (Reducido)</option>
                <option value="21">21% (General)</option>
              </select>
            </div>
            <div>
              <Label>Gastos de Envío (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{subtotal.toFixed(2)}€</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span>-{discountAmount.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>IVA ({taxRate}%):</span>
                <span className="font-medium">{taxAmount.toFixed(2)}€</span>
              </div>
              {shippingCost > 0 && (
                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span className="font-medium">{shippingCost.toFixed(2)}€</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>TOTAL:</span>
                <span>{totalPrice.toFixed(2)}€</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Metadatos */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Información Adicional</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Fecha de Emisión *</Label>
            <Input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Fecha de Vencimiento</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Notas</Label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 min-h-[100px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              placeholder="Notas adicionales para la factura..."
            />
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            invoice ? 'Actualizar Factura' : 'Crear Factura'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
