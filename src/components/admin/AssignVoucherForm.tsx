"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Search } from "lucide-react"
import toast from "react-hot-toast"

interface Voucher {
  id: string
  name: string
  code: string
  initialMeters: number
  initialShipments: number
  price: number
}

interface User {
  id: string
  name: string | null
  email: string
}

interface AssignVoucherFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function AssignVoucherForm({ onSuccess, onCancel }: AssignVoucherFormProps) {
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchEmail, setSearchEmail] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedVoucherId, setSelectedVoucherId] = useState("")

  useEffect(() => {
    loadVouchers()
  }, [])

  const loadVouchers = async () => {
    try {
      const res = await fetch('/api/admin/vouchers?templates=true')
      const data = await res.json()
      setVouchers(data)
    } catch (error) {
      console.error('Error loading vouchers:', error)
      toast.error('Error al cargar bonos')
    }
  }

  const searchUsers = async () => {
    if (!searchEmail.trim()) {
      toast.error('Introduce un email para buscar')
      return
    }

    setSearchLoading(true)
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchEmail)}`)
      const data = await res.json()

      if (data.length === 0) {
        toast.error('No se encontró ningún usuario con ese email')
        setUsers([])
        setSelectedUser(null)
      } else {
        setUsers(data)
        if (data.length === 1) {
          setSelectedUser(data[0])
        }
      }
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Error al buscar usuarios')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser) {
      toast.error('Selecciona un usuario')
      return
    }

    if (!selectedVoucherId) {
      toast.error('Selecciona un bono')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/vouchers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherId: selectedVoucherId,
          userId: selectedUser.id,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Error al asignar bono')
      }

      toast.success('Bono asignado correctamente')
      onSuccess()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al asignar bono')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Buscar Usuario */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Buscar Usuario</h3>

        <div className="flex gap-2">
          <Input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchUsers())}
          />
          <Button
            type="button"
            onClick={searchUsers}
            disabled={searchLoading}
            variant="outline"
          >
            <Search className="h-4 w-4 mr-2" />
            {searchLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {users.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Seleccionar Usuario
            </label>
            <select
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const user = users.find(u => u.id === e.target.value)
                setSelectedUser(user || null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Seleccionar usuario</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedUser && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900">Usuario Seleccionado:</p>
            <p className="text-sm text-green-700">
              {selectedUser.name || 'Sin nombre'} - {selectedUser.email}
            </p>
          </div>
        )}
      </div>

      {/* Seleccionar Bono */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Seleccionar Bono</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bono a Asignar *
          </label>
          <select
            value={selectedVoucherId}
            onChange={(e) => setSelectedVoucherId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          >
            <option value="">Seleccionar bono</option>
            {vouchers.map(voucher => (
              <option key={voucher.id} value={voucher.id}>
                {voucher.name} - {voucher.initialMeters}m - {voucher.price}€
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Se creará una copia del bono vinculada al usuario
          </p>
        </div>

        {selectedVoucherId && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            {(() => {
              const voucher = vouchers.find(v => v.id === selectedVoucherId)
              if (!voucher) return null

              return (
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-blue-900">{voucher.name}</p>
                  <p className="text-blue-700">Metros: {voucher.initialMeters}</p>
                  <p className="text-blue-700">Envíos incluidos: {voucher.initialShipments}</p>
                  <p className="text-blue-700">Precio: {voucher.price}€</p>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={loading || !selectedUser || !selectedVoucherId}
          className="flex-1"
        >
          {loading ? 'Asignando...' : 'Asignar Bono'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
