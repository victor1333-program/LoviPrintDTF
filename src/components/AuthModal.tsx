"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { signIn, useSession } from "next-auth/react"
import { Modal } from "./ui/Modal"
import { Input } from "./ui/Input"
import { Button } from "./ui/Button"
import { Mail, Lock, User } from "lucide-react"
import toast from "react-hot-toast"

const REMEMBERED_EMAIL_KEY = "lovi_remembered_email"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  allowGuest?: boolean
  onGuestContinue?: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess, allowGuest = false, onGuestContinue }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const { update: updateSession } = useSession()
  const [formData, setFormData] = useState({
    email: "",
    confirmEmail: "",
    password: "",
    name: "",
  })

  useEffect(() => {
    if (!isOpen) return
    try {
      const remembered = window.localStorage.getItem(REMEMBERED_EMAIL_KEY)
      if (remembered) {
        setFormData((prev) => ({ ...prev, email: remembered }))
        setRememberMe(true)
      }
    } catch {}
  }, [isOpen])

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

        try {
          if (rememberMe) {
            window.localStorage.setItem(REMEMBERED_EMAIL_KEY, formData.email)
          } else {
            window.localStorage.removeItem(REMEMBERED_EMAIL_KEY)
          }
        } catch {}

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
          name: formData.name,
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

      // Auto-login tras registro exitoso para no añadir fricción
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (signInResult?.error) {
        toast.success("¡Cuenta creada! Ya puedes iniciar sesión.")
        setMode("login")
        setFormData((prev) => ({
          ...prev,
          confirmEmail: "",
          name: "",
        }))
        return
      }

      toast.success("¡Cuenta creada! Te hemos enviado un email de confirmación.")

      try {
        window.localStorage.setItem(REMEMBERED_EMAIL_KEY, formData.email)
      } catch {}

      await updateSession()
      await new Promise((resolve) => setTimeout(resolve, 100))

      onClose()
      resetForm()
      if (onSuccess) {
        onSuccess()
      } else {
        window.location.href = window.location.href
      }
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
      name: "",
    })
    setMode("login") // Siempre resetear a login cuando se cierra el modal
  }

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode)
    setFormData({
      email: "",
      confirmEmail: "",
      password: "",
      name: "",
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
              Crea tu cuenta para empezar a hacer pedidos. Después de confirmar tu email, podrás completar tu perfil con más datos.
            </p>
          </div>
        )}

        {mode === "register" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nombre y apellidos"
                className="pl-10"
                required
              />
            </div>
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
              name="email"
              autoComplete={mode === "login" ? "username" : "email"}
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="tu@email.com"
              className="pl-10"
              required
            />
          </div>
        </div>

        {mode === "register" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  name="confirm-email"
                  autoComplete="email"
                  value={formData.confirmEmail}
                  onChange={(e) => handleInputChange("confirmEmail", e.target.value)}
                  placeholder="Confirma tu email"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="password"
              name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="••••••••"
              className="pl-10"
              required
              minLength={8}
            />
          </div>
          {mode === "register" && (
            <p className="text-xs text-gray-500 mt-1.5">Mínimo 8 caracteres</p>
          )}
        </div>

        {mode === "login" && (
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Recordar sesión
          </label>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? "Procesando..."
            : mode === "login"
            ? "Iniciar Sesión"
            : "Crear Cuenta"}
        </Button>

        {allowGuest && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-500">o</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => {
                onClose()
                onGuestContinue?.()
              }}
            >
              Continuar como invitado
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Podrás crear una cuenta después con el mismo email
            </p>
          </>
        )}

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
