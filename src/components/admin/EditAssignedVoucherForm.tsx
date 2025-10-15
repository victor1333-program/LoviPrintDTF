"use client"

import { useState } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import toast from "react-hot-toast"

interface AssignedVoucher {
  id: string
  name: string
  code: string
  initialMeters: number
  remainingMeters: number
  initialShipments: number
  remainingShipments: number
  user?: {
    name: string | null
    email: string
  }
}

interface EditAssignedVoucherFormProps {
  voucher: AssignedVoucher
  onSuccess: () => void
  onCancel: () => void
}

export function EditAssignedVoucherForm({ voucher, onSuccess, onCancel }: EditAssignedVoucherFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    remainingMeters: voucher.remainingMeters.toString(),
    remainingShipments: voucher.remainingShipments.toString(),
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        remainingMeters: parseFloat(formData.remainingMeters),
        remainingShipments: parseInt(formData.remainingShipments),
      }

      // Validaciones
      if (payload.remainingMeters < 0) {
        toast.error('Los metros no pueden ser negativos')
        setLoading(false)
        return
      }

      if (payload.remainingShipments < 0) {
        toast.error('Los envíos no pueden ser negativos')
        setLoading(false)
        return
      }

      if (payload.remainingMeters > voucher.initialMeters) {
        toast.error('Los metros restantes no pueden superar los metros iniciales')
        setLoading(false)
        return
      }

      if (payload.remainingShipments > voucher.initialShipments) {
        toast.error('Los envíos restantes no pueden superar los envíos iniciales')
        setLoading(false)
        return
      }

      const res = await fetch(`/api/admin/vouchers/${voucher.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al actualizar bono')
      }

      toast.success('Bono actualizado correctamente')
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al actualizar bono')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información del bono */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <h3 className="font-semibold text-lg">{voucher.name}</h3>
        <p className="text-sm text-gray-600">
          Usuario: <span className="font-medium">{voucher.user?.name || 'Sin nombre'}</span> ({voucher.user?.email})
        </p>
        <p className="text-sm text-gray-600">
          Código: <code className="bg-white px-2 py-1 rounded">{voucher.code}</code>
        </p>
      </div>

      {/* Editar metros */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Metros Restantes *
          </label>
          <Input
            type="number"
            step="0.01"
            value={formData.remainingMeters}
            onChange={(e) => handleInputChange('remainingMeters', e.target.value)}
            required
            min="0"
            max={voucher.initialMeters}
          />
          <p className="mt-1 text-sm text-gray-500">
            Máximo: {voucher.initialMeters} metros (inicial)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Envíos Restantes *
          </label>
          <Input
            type="number"
            value={formData.remainingShipments}
            onChange={(e) => handleInputChange('remainingShipments', e.target.value)}
            required
            min="0"
            max={voucher.initialShipments}
          />
          <p className="mt-1 text-sm text-gray-500">
            Máximo: {voucher.initialShipments} envíos (inicial)
          </p>
        </div>
      </div>

      {/* Resumen de cambios */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Cambios a realizar:</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <p>
            Metros: {voucher.remainingMeters}m → {formData.remainingMeters}m
            {parseFloat(formData.remainingMeters) !== voucher.remainingMeters && (
              <span className={`ml-2 font-medium ${
                parseFloat(formData.remainingMeters) > voucher.remainingMeters
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                ({parseFloat(formData.remainingMeters) > voucher.remainingMeters ? '+' : ''}
                {(parseFloat(formData.remainingMeters) - voucher.remainingMeters).toFixed(2)}m)
              </span>
            )}
          </p>
          <p>
            Envíos: {voucher.remainingShipments} → {formData.remainingShipments}
            {parseInt(formData.remainingShipments) !== voucher.remainingShipments && (
              <span className={`ml-2 font-medium ${
                parseInt(formData.remainingShipments) > voucher.remainingShipments
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                ({parseInt(formData.remainingShipments) > voucher.remainingShipments ? '+' : ''}
                {parseInt(formData.remainingShipments) - voucher.remainingShipments})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
