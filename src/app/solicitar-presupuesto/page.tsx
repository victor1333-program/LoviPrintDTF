"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { FileUpload } from "@/components/FileUpload"
import { ArrowLeft, Send, CheckCircle, Upload, FileText, User } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

interface UploadedFileData {
  url: string
  name: string
  size: number
  publicId?: string
  metadata?: any
}

export default function SolicitarPresupuestoPage() {
  const router = useRouter()
  const [designFile, setDesignFile] = useState<UploadedFileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [quoteNumber, setQuoteNumber] = useState<string>('')

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerNotes: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleFileUpload = (file: UploadedFileData) => {
    setDesignFile(file)
    toast.success('Diseño subido correctamente')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.customerName.trim()) {
      toast.error('Por favor, ingresa tu nombre')
      return
    }

    if (!formData.customerEmail.trim()) {
      toast.error('Por favor, ingresa tu email')
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.customerEmail)) {
      toast.error('Email inválido')
      return
    }

    if (!formData.customerPhone.trim()) {
      toast.error('Por favor, ingresa tu teléfono')
      return
    }

    if (!designFile) {
      toast.error('Por favor, sube tu diseño')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          designFileUrl: designFile.url,
          designFileName: designFile.name,
          fileMetadata: {
            size: designFile.size,
            publicId: designFile.publicId,
          },
          customerNotes: formData.customerNotes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la solicitud')
      }

      // Éxito
      setQuoteNumber(data.quote.quoteNumber)
      setSuccess(true)
      toast.success('¡Solicitud enviada correctamente!')

      // Limpiar formulario
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerNotes: '',
      })
      setDesignFile(null)
    } catch (error) {
      console.error('Error submitting quote:', error)
      toast.error(error instanceof Error ? error.message : 'Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  // Vista de éxito
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-green-200 shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-3xl text-green-700">
                ¡Solicitud Recibida!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-2">Número de presupuesto:</p>
                <p className="text-2xl font-bold text-green-700">{quoteNumber}</p>
              </div>

              <div className="space-y-4 text-left bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">
                  📋 ¿Qué sigue?
                </h3>
                <ol className="space-y-3">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                      1
                    </span>
                    <span className="text-gray-700">
                      Recibirás un <strong>email de confirmación</strong> en breve
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                      2
                    </span>
                    <span className="text-gray-700">
                      Nuestro equipo <strong>revisará y montará tu diseño</strong>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                      3
                    </span>
                    <span className="text-gray-700">
                      Te enviaremos el <strong>presupuesto con los metros calculados</strong>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                      4
                    </span>
                    <span className="text-gray-700">
                      Recibirás un <strong>enlace de pago</strong> para completar tu pedido
                    </span>
                  </li>
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tiempo de respuesta:</strong> Normalmente respondemos en 24-48 horas laborables
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Link href="/" className="flex-1">
                  <Button className="w-full" variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al inicio
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setSuccess(false)
                    setQuoteNumber('')
                  }}
                  className="flex-1"
                >
                  Solicitar otro presupuesto
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Formulario
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Solicitar Presupuesto
          </h1>
          <p className="text-lg text-gray-600">
            Sube tu diseño y te enviaremos un presupuesto personalizado con los metros calculados
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Información de contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Tus datos de contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <Input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="Tu nombre"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    placeholder="tu@email.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Te enviaremos el presupuesto a este email
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <Input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    placeholder="+34 600 123 456"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Por si necesitamos contactarte
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Diseño */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Sube tu diseño
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <FileUpload
                    onFileUpload={handleFileUpload}
                  />
                  {designFile && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-green-600 mr-2" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900">
                            {designFile.name}
                          </p>
                          <p className="text-xs text-green-700">
                            {(designFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    ℹ️ Formatos aceptados:
                  </p>
                  <p className="text-sm text-blue-700">
                    PNG, JPG, PDF, PSD, AI, SVG (máximo 50MB)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notas adicionales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Información adicional (opcional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Algo que debamos saber?
                  </label>
                  <textarea
                    name="customerNotes"
                    value={formData.customerNotes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Necesito el pedido para fecha X, medidas especiales, cantidad aproximada de metros que necesitas..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botón de envío */}
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <Button
                  type="submit"
                  disabled={loading || !designFile}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Enviando solicitud...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Enviar solicitud de presupuesto
                    </>
                  )}
                </Button>
                <p className="text-center text-sm text-gray-600 mt-4">
                  Al enviar, recibirás un email de confirmación
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}
