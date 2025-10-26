"use client"

import { useState } from "react"
import Image from "next/image"
import { signIn, useSession } from "next-auth/react"
import { Modal } from "./ui/Modal"
import { Input } from "./ui/Input"
import { Button } from "./ui/Button"
import { Mail, Lock, User, Phone, Building, MapPin, Home, Check, X } from "lucide-react"
import toast from "react-hot-toast"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [loading, setLoading] = useState(false)
  const { update: updateSession } = useSession()
  const [formData, setFormData] = useState({
    email: "",
    confirmEmail: "",
    password: "",
  })

  // Definir requisitos de contraseña
  const passwordRequirements: PasswordRequirement[] = [
    {
      label: "Mínimo 8 caracteres",
      test: (password) => password.length >= 8,
    },
    {
      label: "Al menos una mayúscula (A-Z)",
      test: (password) => /[A-Z]/.test(password),
    },
    {
      label: "Al menos una minúscula (a-z)",
      test: (password) => /[a-z]/.test(password),
    },
    {
      label: "Al menos un número (0-9)",
      test: (password) => /[0-9]/.test(password),
    },
  ]

  // Validar si la contraseña cumple todos los requisitos
  const isPasswordValid = (password: string) => {
    return passwordRequirements.every((req) => req.test(password))
  }

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

        // Forzar actualización de la sesión en el cliente
        await updateSession()

        // Pequeño delay para asegurar que la sesión se actualice completamente
        await new Promise(resolve => setTimeout(resolve, 100))

        onClose()
        if (onSuccess) {
          onSuccess()
        } else {
          // Recargar la página
          window.location.href = window.location.href
        }
      }
    } catch (error) {
      toast.error("Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que los emails coincidan
    if (formData.email !== formData.confirmEmail) {
      toast.error("Los emails no coinciden")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Si hay errores de validación múltiples, mostrarlos todos
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((error: { message: string }) => {
            toast.error(error.message)
          })
        } else {
          toast.error(data.error || "Error al registrarse")
        }
        return
      }

      toast.success("¡Cuenta creada! Revisa tu email para confirmarla.")
      onClose()
      resetForm()
    } catch (error) {
      toast.error("Error al crear cuenta")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      email: "",
      confirmEmail: "",
      password: "",
    })
    setMode("login") // Siempre resetear a login cuando se cierra el modal
  }

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode)
    setFormData({
      email: "",
      confirmEmail: "",
      password: "",
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
      maxWidth="md"
    >
      <div className="flex justify-center mb-6 pb-4 border-b">
        <div className="relative h-16 w-48">
          <Image
            src="/logo.png"
            alt="LoviPrintDTF"
            fill
            className="object-contain"
          />
        </div>
      </div>
      <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        {mode === "register" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              Crea tu cuenta con solo tu email y contraseña. Después de confirmar tu email, podrás completar tu perfil.
            </p>
          </div>
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

        {mode === "register" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                value={formData.confirmEmail}
                onChange={(e) => handleInputChange("confirmEmail", e.target.value)}
                placeholder="Confirma tu email"
                className="pl-10"
                required
              />
            </div>
          </div>
        )}

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
              minLength={8}
            />
          </div>
          {mode === "register" && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">
                La contraseña debe cumplir con:
              </p>
              <ul className="space-y-1.5">
                {passwordRequirements.map((requirement, index) => {
                  const isMet = formData.password ? requirement.test(formData.password) : false
                  return (
                    <li key={index} className="flex items-center gap-2 text-xs">
                      {isMet ? (
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className={isMet ? "text-green-700" : "text-gray-600"}>
                        {requirement.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
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
