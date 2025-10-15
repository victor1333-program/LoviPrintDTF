"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Modal } from "./ui/Modal"
import { Input } from "./ui/Input"
import { Button } from "./ui/Button"
import { Mail, Lock, User, Phone, Building, MapPin, Home } from "lucide-react"
import toast from "react-hot-toast"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    company: "",
    taxId: "",
    isProfessional: false,
    shippingAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "España",
    },
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Credenciales incorrectas")
      } else {
        toast.success("Sesión iniciada correctamente")
        onClose()
        // Usar router en lugar de reload para mejor experiencia
        window.location.href = window.location.href
      }
    } catch (error) {
      toast.error("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Error al registrarse")
        return
      }

      toast.success("Cuenta creada correctamente")

      // Auto login después de registrarse
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (!result?.error) {
        onClose()
        window.location.href = window.location.href
      }
    } catch (error) {
      toast.error("Error al crear cuenta")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith('shippingAddress.')) {
      const addressField = field.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [addressField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      phone: "",
      company: "",
      taxId: "",
      isProfessional: false,
      shippingAddress: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "España",
      },
    })
  }

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode)
    resetForm()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
      maxWidth="md"
    >
      <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        {mode === "register" && (
          <>
            {/* Datos personales */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-semibold text-gray-900">Datos Personales</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Tu nombre completo"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+34 600 123 456"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isProfessional"
                  checked={formData.isProfessional}
                  onChange={(e) => handleInputChange("isProfessional", e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isProfessional" className="text-sm text-gray-700">
                  Soy profesional (empresa)
                </label>
              </div>

              {formData.isProfessional && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la empresa
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                        placeholder="Mi Empresa S.L."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CIF/NIF
                    </label>
                    <Input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange("taxId", e.target.value)}
                      placeholder="B12345678"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Dirección de envío */}
            <div className="space-y-4 pb-4 border-b">
              <h3 className="font-semibold text-gray-900">Dirección de Envío</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección *
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.shippingAddress.street}
                    onChange={(e) => handleInputChange("shippingAddress.street", e.target.value)}
                    placeholder="Calle, número, piso, puerta"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <Input
                    type="text"
                    value={formData.shippingAddress.city}
                    onChange={(e) => handleInputChange("shippingAddress.city", e.target.value)}
                    placeholder="Ciudad"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia *
                  </label>
                  <Input
                    type="text"
                    value={formData.shippingAddress.state}
                    onChange={(e) => handleInputChange("shippingAddress.state", e.target.value)}
                    placeholder="Provincia"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      value={formData.shippingAddress.postalCode}
                      onChange={(e) => handleInputChange("shippingAddress.postalCode", e.target.value)}
                      placeholder="28001"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País *
                  </label>
                  <Input
                    type="text"
                    value={formData.shippingAddress.country}
                    onChange={(e) => handleInputChange("shippingAddress.country", e.target.value)}
                    placeholder="España"
                    required
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="tu@email.com"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="••••••••"
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? "Procesando..."
            : mode === "login"
            ? "Iniciar Sesión"
            : "Crear Cuenta"}
        </Button>

        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </div>
      </form>
    </Modal>
  )
}
