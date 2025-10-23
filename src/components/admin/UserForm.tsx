"use client"

import { useState } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import toast from "react-hot-toast"

interface UserFormData {
  name: string
  email: string
  password?: string
  phone: string
  role: "CUSTOMER" | "ADMIN"
  company?: string
  taxId?: string
  isProfessional: boolean
  professionalDiscount?: string
  shippingAddress?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  billingAddress?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  sameAsShipping: boolean
}

interface UserFormProps {
  user?: any
  onSuccess: () => void
  onCancel: () => void
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const [loading, setLoading] = useState(false)

  // Obtener dirección predeterminada del usuario si existe
  const defaultAddress = user?.addresses?.find((addr: any) => addr.isDefault) || user?.addresses?.[0]

  const [formData, setFormData] = useState<UserFormData>({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    phone: user?.phone || "",
    role: user?.role || "CUSTOMER",
    company: user?.company || "",
    taxId: user?.taxId || "",
    isProfessional: user?.isProfessional || false,
    professionalDiscount: user?.professionalDiscount?.toString() || "0",
    shippingAddress: defaultAddress ? {
      street: defaultAddress.street || "",
      city: defaultAddress.city || "",
      state: defaultAddress.state || "",
      postalCode: defaultAddress.postalCode || "",
      country: defaultAddress.country || "España",
    } : (user?.shippingAddress || {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "España",
    }),
    billingAddress: user?.billingAddress || {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "España",
    },
    sameAsShipping: false,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = (
    addressType: "shippingAddress" | "billingAddress",
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value,
      },
    }))
  }

  const handleSameAsShippingChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sameAsShipping: checked,
      billingAddress: checked ? { ...prev.shippingAddress! } : prev.billingAddress,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones
      if (!formData.name || !formData.email) {
        toast.error("Nombre y email son obligatorios")
        setLoading(false)
        return
      }

      if (!user && !formData.password) {
        toast.error("La contraseña es obligatoria para nuevos usuarios")
        setLoading(false)
        return
      }

      if (formData.password && formData.password.length > 0 && formData.password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres")
        setLoading(false)
        return
      }

      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        company: formData.company || null,
        taxId: formData.taxId || null,
        isProfessional: formData.isProfessional,
        professionalDiscount: formData.isProfessional
          ? parseFloat(formData.professionalDiscount || "0")
          : null,
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.sameAsShipping
          ? formData.shippingAddress
          : formData.billingAddress,
      }

      if (formData.password) {
        payload.password = formData.password
      }

      const url = user ? `/api/admin/users/${user.id}` : "/api/admin/users"
      const method = user ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        let errorMessage = "Error al guardar usuario"

        if (typeof error.error === 'string') {
          errorMessage = error.error
        } else if (Array.isArray(error.error)) {
          errorMessage = error.error.map((e: any) => e.message).join(', ')
        }

        toast.error(errorMessage)
        setLoading(false)
        return
      }

      toast.success(user ? "Usuario actualizado correctamente" : "Usuario creado correctamente")
      onSuccess()
    } catch (error: any) {
      console.error("Error:", error)
      toast.error("Error al guardar usuario. Por favor, verifica los datos e intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Básica */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña {!user && "*"}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder={user ? "Dejar en blanco para no cambiar" : ""}
              required={!user}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="CUSTOMER">Cliente</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
        </div>
      </div>

      {/* Información Profesional */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Información Profesional</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isProfessional"
              checked={formData.isProfessional}
              onChange={(e) => handleInputChange("isProfessional", e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isProfessional" className="text-sm font-medium text-gray-700">
              Es un usuario profesional
            </label>
          </div>

          {formData.isProfessional && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pl-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <Input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CIF/NIF
                </label>
                <Input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange("taxId", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.professionalDiscount}
                  onChange={(e) => handleInputChange("professionalDiscount", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dirección de Envío */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Dirección de Envío</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Calle</label>
            <Input
              type="text"
              value={formData.shippingAddress?.street}
              onChange={(e) => handleAddressChange("shippingAddress", "street", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <Input
              type="text"
              value={formData.shippingAddress?.city}
              onChange={(e) => handleAddressChange("shippingAddress", "city", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
            <Input
              type="text"
              value={formData.shippingAddress?.state}
              onChange={(e) => handleAddressChange("shippingAddress", "state", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código Postal
            </label>
            <Input
              type="text"
              value={formData.shippingAddress?.postalCode}
              onChange={(e) =>
                handleAddressChange("shippingAddress", "postalCode", e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
            <Input
              type="text"
              value={formData.shippingAddress?.country}
              onChange={(e) => handleAddressChange("shippingAddress", "country", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Dirección de Facturación */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Dirección de Facturación</h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sameAsShipping"
              checked={formData.sameAsShipping}
              onChange={(e) => handleSameAsShippingChange(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="sameAsShipping" className="text-sm font-medium text-gray-700">
              Igual que dirección de envío
            </label>
          </div>
        </div>

        {!formData.sameAsShipping && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Calle</label>
              <Input
                type="text"
                value={formData.billingAddress?.street}
                onChange={(e) => handleAddressChange("billingAddress", "street", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
              <Input
                type="text"
                value={formData.billingAddress?.city}
                onChange={(e) => handleAddressChange("billingAddress", "city", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
              <Input
                type="text"
                value={formData.billingAddress?.state}
                onChange={(e) => handleAddressChange("billingAddress", "state", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Postal
              </label>
              <Input
                type="text"
                value={formData.billingAddress?.postalCode}
                onChange={(e) =>
                  handleAddressChange("billingAddress", "postalCode", e.target.value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <Input
                type="text"
                value={formData.billingAddress?.country}
                onChange={(e) => handleAddressChange("billingAddress", "country", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Guardando..." : user ? "Actualizar Usuario" : "Crear Usuario"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
