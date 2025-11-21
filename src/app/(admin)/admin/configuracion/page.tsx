"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import {
  Settings,
  CreditCard,
  Mail,
  HardDrive,
  FileCheck,
  Save,
  Upload,
  Eye,
  EyeOff,
  Send,
  Inbox,
  Truck,
  MessageCircle
} from "lucide-react"
import toast from "react-hot-toast"

type Tab = 'payments' | 'email' | 'storage' | 'validation' | 'shipping' | 'general' | 'whatsapp'

interface Setting {
  id: string
  key: string
  value: string
  label: string | null
  type: string
  category: string
}

interface ShippingMethod {
  id: string
  name: string
  description: string | null
  price: number
  estimatedDays: string | null
  isActive: boolean
  order: number
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [settings, setSettings] = useState<Record<string, Setting[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [testEmail, setTestEmail] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)
  const [testingCloudinary, setTestingCloudinary] = useState(false)
  const [testingGLS, setTestingGLS] = useState(false)
  const [testingStripe, setTestingStripe] = useState(false)
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null)
  const [showMethodModal, setShowMethodModal] = useState(false)

  useEffect(() => {
    loadSettings()
    loadShippingMethods()
  }, [])

  const loadShippingMethods = async () => {
    try {
      const res = await fetch('/api/admin/shipping-methods')
      const data = await res.json()
      setShippingMethods(data)
    } catch (error) {
      console.error('Error loading shipping methods:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()

      // Verificar si la respuesta es un error
      if (data.error) {
        throw new Error(data.error)
      }

      setSettings(data)

      // Inicializar formData con los valores actuales
      const initialData: Record<string, string> = {}
      Object.values(data).flat().forEach((setting: unknown) => {
        const s = setting as Setting
        initialData[s.key] = s.value || ''
      })
      setFormData(initialData)
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Error al cargar configuraciones')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Obtener solo los settings de la categoría actual
      const categorySettings = settings[activeTab] || []
      const settingsToUpdate = categorySettings.map((s) => ({
        key: s.key,
        value: formData[s.key] || '',
        label: s.label,
        type: s.type,
        category: s.category,
      }))

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsToUpdate }),
      })

      if (!res.ok) throw new Error('Error saving settings')

      // Mensaje específico para WhatsApp
      if (activeTab === 'whatsapp') {
        toast.success('Configuración de WhatsApp guardada. Los cambios se aplicarán automáticamente en 30 segundos.')
      } else {
        toast.success('Configuración guardada correctamente')
      }
      await loadSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('Por favor, introduce un email de prueba')
      return
    }

    setTestingEmail(true)
    try {
      const res = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Email de prueba enviado correctamente! Revisa tu bandeja de entrada.')
      } else {
        toast.error(data.error || 'Error al enviar email de prueba')
      }
    } catch (error) {
      toast.error('Error al enviar email de prueba')
    } finally {
      setTestingEmail(false)
    }
  }

  const handleTestCloudinary = async () => {
    setTestingCloudinary(true)
    try {
      const res = await fetch('/api/storage/test-cloudinary', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(`✅ Conexión exitosa con Cloudinary (${data.cloudName})`)
      } else {
        toast.error(data.error || 'Error al conectar con Cloudinary')
      }
    } catch (error) {
      toast.error('Error al probar la conexión con Cloudinary')
    } finally {
      setTestingCloudinary(false)
    }
  }

  const handleTestGLS = async () => {
    setTestingGLS(true)
    try {
      const res = await fetch('/api/shipping/test-gls', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('✅ Conexión exitosa con GLS')
      } else {
        toast.error(data.error || 'Error al conectar con GLS')
      }
    } catch (error) {
      toast.error('Error al probar la conexión con GLS')
    } finally {
      setTestingGLS(false)
    }
  }

  const handleTestStripe = async () => {
    setTestingStripe(true)
    try {
      const res = await fetch('/api/payments/test-stripe', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(`✅ Conexión exitosa con Stripe (modo ${data.mode === 'test' ? 'prueba' : 'producción'})`)
      } else {
        toast.error(data.error || 'Error al conectar con Stripe')
      }
    } catch (error) {
      toast.error('Error al probar la conexión con Stripe')
    } finally {
      setTestingStripe(false)
    }
  }

  const handleSaveShippingMethod = async (method: Partial<ShippingMethod>) => {
    try {
      if (editingMethod?.id) {
        // Actualizar
        const res = await fetch(`/api/admin/shipping-methods/${editingMethod.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(method),
        })

        if (!res.ok) throw new Error('Error updating method')

        toast.success('Método de envío actualizado')
      } else {
        // Crear
        const res = await fetch('/api/admin/shipping-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(method),
        })

        if (!res.ok) throw new Error('Error creating method')

        toast.success('Método de envío creado')
      }

      await loadShippingMethods()
      setShowMethodModal(false)
      setEditingMethod(null)
    } catch (error) {
      toast.error('Error al guardar método de envío')
    }
  }

  const handleDeleteShippingMethod = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este método de envío?')) return

    try {
      const res = await fetch(`/api/admin/shipping-methods/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Error deleting method')

      toast.success('Método de envío eliminado')
      await loadShippingMethods()
    } catch (error) {
      toast.error('Error al eliminar método de envío')
    }
  }

  const tabs = [
    { id: 'general' as Tab, label: 'General', icon: Settings },
    { id: 'whatsapp' as Tab, label: 'WhatsApp', icon: MessageCircle },
    { id: 'payments' as Tab, label: 'Pagos', icon: CreditCard },
    { id: 'email' as Tab, label: 'Email', icon: Mail },
    { id: 'storage' as Tab, label: 'Almacenamiento', icon: HardDrive },
    { id: 'shipping' as Tab, label: 'Envíos', icon: Truck },
    { id: 'validation' as Tab, label: 'Validación', icon: FileCheck },
  ]

  const renderSettingInput = (setting: Setting) => {
    const isSecret = setting.key.toLowerCase().includes('secret') ||
                     setting.key.toLowerCase().includes('password') ||
                     setting.key.toLowerCase().includes('key')

    const isBoolean = setting.type === 'BOOLEAN'
    const isNumber = setting.type === 'NUMBER'
    const isTextarea = setting.key.toLowerCase().includes('message') ||
                       setting.key.toLowerCase().includes('greeting') ||
                       setting.key.toLowerCase().includes('description')

    if (isBoolean) {
      return (
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData[setting.key] === 'true'}
              onChange={(e) => handleInputChange(setting.key, e.target.checked ? 'true' : 'false')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
          <span className="text-sm text-gray-600">
            {formData[setting.key] === 'true' ? 'Activado' : 'Desactivado'}
          </span>
        </div>
      )
    }

    if (isTextarea) {
      return (
        <textarea
          value={formData[setting.key] || ''}
          onChange={(e) => handleInputChange(setting.key, e.target.value)}
          placeholder={setting.label || setting.key}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[100px] resize-y"
          rows={4}
        />
      )
    }

    return (
      <div className="relative">
        <Input
          type={isSecret && !showSecrets[setting.key] ? 'password' : isNumber ? 'number' : 'text'}
          value={formData[setting.key] || ''}
          onChange={(e) => handleInputChange(setting.key, e.target.value)}
          placeholder={setting.label || setting.key}
          className="pr-10"
        />
        {isSecret && (
          <button
            type="button"
            onClick={() => toggleSecretVisibility(setting.key)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showSecrets[setting.key] ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Definir orden personalizado para los campos de envío
  const shippingFieldOrder = [
    'gls_enabled',
    'gls_username',
    'gls_password',
    'gls_client_id',
    'gls_api_url',
    'gls_test_mode',
    'gls_sender_name',
    'gls_sender_address',
    'gls_sender_city',
    'gls_sender_zipcode',
    'gls_sender_country',
    'gls_sender_phone',
    'gls_sender_email',
    'free_shipping_threshold',
    'shipping_provider',
  ]

  // Obtener settings y ordenarlos si es la pestaña de envíos
  let currentSettings = settings[activeTab] || []

  if (activeTab === 'shipping' && currentSettings.length > 0) {
    currentSettings = [...currentSettings].sort((a, b) => {
      const indexA = shippingFieldOrder.indexOf(a.key)
      const indexB = shippingFieldOrder.indexOf(b.key)

      // Si ambos están en el orden personalizado, usar ese orden
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      // Si solo A está en el orden, va primero
      if (indexA !== -1) return -1
      // Si solo B está en el orden, va primero
      if (indexB !== -1) return 1
      // Si ninguno está en el orden, mantener orden alfabético
      return a.key.localeCompare(b.key)
    })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-sm sm:text-base text-gray-600">Gestiona la configuración del sistema</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {currentSettings.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay configuraciones para esta categoría</p>
              <p className="text-sm text-gray-400 mt-2">
                Las configuraciones se crearán automáticamente al guardar
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentSettings.map((setting) => (
                <div key={setting.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        {setting.label || setting.key}
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        {setting.key}
                      </p>
                    </div>
                    <Badge variant={formData[setting.key] ? 'success' : 'default'}>
                      {formData[setting.key] ? 'Configurado' : 'Vacío'}
                    </Badge>
                  </div>
                  {renderSettingInput(setting)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Email section (only for email tab) */}
      {activeTab === 'email' && currentSettings.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Send className="h-5 w-5 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Probar Conexión SMTP</h3>
                <p className="text-sm text-gray-600">Envía un email de prueba para verificar la configuración</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleTestEmail} disabled={testingEmail}>
                <Send className="h-4 w-4 mr-2" />
                {testingEmail ? 'Enviando...' : 'Enviar Prueba'}
              </Button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Gestión de Plantillas</h4>
              <p className="text-sm text-blue-800 mb-2">
                Personaliza los correos electrónicos que se envían a tus clientes desde la sección de plantillas.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/admin/notificaciones/plantillas'}
              >
                <Inbox className="h-4 w-4 mr-2" />
                Ir a Plantillas de Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Cloudinary section (only for storage tab) */}
      {activeTab === 'storage' && currentSettings.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="h-5 w-5 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Probar Conexión con Cloudinary</h3>
                <p className="text-sm text-gray-600">Verifica que tus credenciales de Cloudinary sean correctas</p>
              </div>
            </div>

            <Button onClick={handleTestCloudinary} disabled={testingCloudinary}>
              <Upload className="h-4 w-4 mr-2" />
              {testingCloudinary ? 'Probando conexión...' : 'Probar Conexión'}
            </Button>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 ¿Cómo obtener credenciales de Cloudinary?</h4>
              <ul className="text-sm text-blue-800 space-y-1 mb-3">
                <li>1. Ve a <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">cloudinary.com</a> y crea una cuenta gratuita</li>
                <li>2. En el Dashboard verás tu <strong>Cloud Name</strong>, <strong>API Key</strong> y <strong>API Secret</strong></li>
                <li>3. Copia esas credenciales y pégalas en los campos de arriba</li>
                <li>4. Guarda los cambios y prueba la conexión con el botón de arriba</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Stripe section (only for payments tab) */}
      {activeTab === 'payments' && currentSettings.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-5 w-5 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Probar Conexión con Stripe</h3>
                <p className="text-sm text-gray-600">Verifica que tus credenciales de Stripe sean correctas</p>
              </div>
            </div>

            <Button onClick={handleTestStripe} disabled={testingStripe}>
              <CreditCard className="h-4 w-4 mr-2" />
              {testingStripe ? 'Probando conexión...' : 'Probar Conexión'}
            </Button>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 ¿Cómo obtener credenciales de Stripe?</h4>
              <ul className="text-sm text-blue-800 space-y-1 mb-3">
                <li>1. Ve a <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">dashboard.stripe.com</a> y crea una cuenta</li>
                <li>2. En el modo <strong>Test</strong>, encontrarás las claves de prueba (Publishable key y Secret key)</li>
                <li>3. En el modo <strong>Live</strong>, encontrarás las claves de producción</li>
                <li>4. Copia las claves correspondientes según el modo que vayas a usar</li>
                <li>5. Guarda los cambios y prueba la conexión con el botón de arriba</li>
              </ul>
              <p className="text-sm text-blue-800 font-medium">
                ⚠️ Importante: Usa el modo test para probar sin realizar cobros reales.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test GLS section (only for shipping tab) */}
      {activeTab === 'shipping' && currentSettings.length > 0 && (
        <>
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="h-5 w-5 text-primary-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Probar Conexión con GLS</h3>
                  <p className="text-sm text-gray-600">Verifica que tus credenciales de GLS sean correctas</p>
                </div>
              </div>

              <Button onClick={handleTestGLS} disabled={testingGLS}>
                <Truck className="h-4 w-4 mr-2" />
                {testingGLS ? 'Probando conexión...' : 'Probar Conexión'}
              </Button>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Información sobre GLS</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Contacta con GLS España para obtener tus credenciales de API</li>
                  <li>• Necesitarás: Client ID, Usuario y Contraseña</li>
                  <li>• Completa los datos del remitente (tu dirección de envío)</li>
                  <li>• Usa el modo de prueba para realizar tests sin crear envíos reales</li>
                  <li>• Una vez configurado, podrás generar etiquetas de envío automáticamente desde los pedidos</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Methods Management */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-primary-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Tipos de Envío</h3>
                    <p className="text-sm text-gray-600">Configura los diferentes tipos de envío disponibles</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setEditingMethod(null)
                    setShowMethodModal(true)
                  }}
                >
                  Añadir Tipo de Envío
                </Button>
              </div>

              <div className="space-y-3">
                {shippingMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-900">{method.name}</h4>
                        <Badge variant={method.isActive ? 'success' : 'default'}>
                          {method.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      {method.description && (
                        <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-500">
                          Precio: <strong>{method.price.toFixed(2)}€</strong>
                        </span>
                        {method.estimatedDays && (
                          <span className="text-sm text-gray-500">
                            Tiempo: <strong>{method.estimatedDays}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingMethod(method)
                          setShowMethodModal(true)
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteShippingMethod(method.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* WhatsApp section (only for whatsapp tab) */}
      {activeTab === 'whatsapp' && currentSettings.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Configuración de WhatsApp</h3>
                <p className="text-sm text-gray-600">Widget flotante para contacto directo con tus clientes</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-semibold text-green-900 mb-2">💡 Cómo configurar WhatsApp</h4>
                <ul className="text-sm text-green-800 space-y-2 mb-3">
                  <li><strong>1. Activar WhatsApp:</strong> Activa el toggle para mostrar el widget en la web</li>
                  <li><strong>2. Número de WhatsApp:</strong> Introduce tu número en formato internacional sin el símbolo + (Ej: 34600123456)</li>
                  <li><strong>3. Mensaje inicial:</strong> Mensaje que se enviará cuando el cliente haga clic en "Iniciar conversación"</li>
                  <li><strong>4. Mensaje de bienvenida:</strong> Texto que verá el cliente al abrir el popup del widget</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">📱 Vista previa</h4>
                <p className="text-sm text-blue-800 mb-2">
                  El botón flotante de WhatsApp aparecerá en la esquina inferior derecha de todas las páginas públicas de tu web.
                </p>
                <p className="text-sm text-blue-800">
                  Cuando el cliente haga clic, verá el mensaje de bienvenida y podrá iniciar una conversación directa por WhatsApp.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Importante</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• El número debe ser válido y estar activo en WhatsApp</li>
                  <li>• Formato: código de país + número (Ej: España 34 + 600123456)</li>
                  <li>• El widget solo se muestra si está activado y hay número configurado</li>
                  <li>• Puedes usar saltos de línea en el mensaje de bienvenida</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Helper text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          💡 Información importante
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Las claves API y contraseñas se almacenan de forma segura</li>
          <li>• El modo test de Stripe te permite hacer pruebas sin pagos reales</li>
          <li>• Los cambios se aplican inmediatamente al guardar</li>
          <li>• Asegúrate de probar la configuración después de guardar</li>
        </ul>
      </div>

      {/* Modal para crear/editar método de envío */}
      {showMethodModal && (
        <ShippingMethodModal
          method={editingMethod}
          onClose={() => {
            setShowMethodModal(false)
            setEditingMethod(null)
          }}
          onSave={handleSaveShippingMethod}
        />
      )}
    </div>
  )
}

// Modal Component
function ShippingMethodModal({
  method,
  onClose,
  onSave,
}: {
  method: ShippingMethod | null
  onClose: () => void
  onSave: (method: Partial<ShippingMethod>) => void
}) {
  const [formData, setFormData] = useState({
    name: method?.name || '',
    description: method?.description || '',
    price: method?.price?.toString() || '',
    estimatedDays: method?.estimatedDays || '',
    isActive: method?.isActive ?? true,
    order: method?.order?.toString() || '0',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      estimatedDays: formData.estimatedDays,
      isActive: formData.isActive,
      order: parseInt(formData.order),
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">
          {method ? 'Editar' : 'Crear'} Método de Envío
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Envío Estándar 24/48h"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio (€) *
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="6.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiempo estimado
            </label>
            <Input
              type="text"
              value={formData.estimatedDays}
              onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
              placeholder="Ej: 24-48h"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orden
            </label>
            <Input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
            <span className="text-sm text-gray-600">
              {formData.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {method ? 'Actualizar' : 'Crear'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
