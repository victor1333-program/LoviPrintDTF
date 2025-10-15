"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import EmailEditor from "@/components/admin/EmailEditor"
import {
  Plus,
  Edit,
  Trash2,
  Mail,
  ArrowLeft,
  Save,
  Copy,
  Power,
  PowerOff,
  Star,
  StarOff,
} from "lucide-react"
import toast from "react-hot-toast"
import { EmailTemplateType } from "@prisma/client"
import {
  EMAIL_TEMPLATE_TYPE_LABELS,
  EMAIL_TEMPLATE_VARIABLES,
  EMAIL_TEMPLATE_SAMPLE_DATA,
  EmailTemplateData,
} from "@/types/email-templates"

export default function PlantillasEmailPage() {
  const [templates, setTemplates] = useState<EmailTemplateData[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<"list" | "create" | "edit">("list")
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateData | null>(null)

  // Form state
  const [formData, setFormData] = useState<EmailTemplateData>({
    name: "",
    type: "ORDER_CREATED" as EmailTemplateType,
    subject: "",
    htmlContent: "",
    textContent: "",
    variables: [],
    sampleData: {},
    isActive: true,
    isDefault: false,
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    // Cuando cambia el tipo, actualizar variables y datos de ejemplo
    if (formData.type) {
      setFormData((prev) => ({
        ...prev,
        variables: EMAIL_TEMPLATE_VARIABLES[formData.type],
        sampleData: EMAIL_TEMPLATE_SAMPLE_DATA[formData.type],
      }))
    }
  }, [formData.type])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/email-templates")
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      } else {
        toast.error("Error al cargar plantillas")
      }
    } catch (error) {
      console.error("Error loading templates:", error)
      toast.error("Error al cargar plantillas")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setMode("create")
    setFormData({
      name: "",
      type: "ORDER_CREATED" as EmailTemplateType,
      subject: "",
      htmlContent: "",
      textContent: "",
      variables: EMAIL_TEMPLATE_VARIABLES.ORDER_CREATED,
      sampleData: EMAIL_TEMPLATE_SAMPLE_DATA.ORDER_CREATED,
      isActive: true,
      isDefault: false,
    })
  }

  const handleEdit = (template: EmailTemplateData) => {
    setMode("edit")
    setSelectedTemplate(template)
    setFormData({
      ...template,
      variables: template.variables || EMAIL_TEMPLATE_VARIABLES[template.type],
      sampleData: template.sampleData || EMAIL_TEMPLATE_SAMPLE_DATA[template.type],
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.htmlContent) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    try {
      const url =
        mode === "create"
          ? "/api/email-templates"
          : `/api/email-templates/${selectedTemplate?.id}`
      const method = mode === "create" ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success(
          mode === "create" ? "Plantilla creada correctamente" : "Plantilla actualizada"
        )
        setMode("list")
        loadTemplates()
      } else {
        const data = await res.json()
        toast.error(data.error || "Error al guardar plantilla")
      }
    } catch (error) {
      console.error("Error saving template:", error)
      toast.error("Error al guardar plantilla")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta plantilla?")) {
      return
    }

    try {
      const res = await fetch(`/api/email-templates/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Plantilla eliminada")
        loadTemplates()
      } else {
        toast.error("Error al eliminar plantilla")
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      toast.error("Error al eliminar plantilla")
    }
  }

  const handleToggleActive = async (template: EmailTemplateData) => {
    try {
      const res = await fetch(`/api/email-templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...template, isActive: !template.isActive }),
      })

      if (res.ok) {
        toast.success(template.isActive ? "Plantilla desactivada" : "Plantilla activada")
        loadTemplates()
      } else {
        toast.error("Error al cambiar estado")
      }
    } catch (error) {
      console.error("Error toggling active:", error)
      toast.error("Error al cambiar estado")
    }
  }

  const handleDuplicate = (template: EmailTemplateData) => {
    setMode("create")
    setFormData({
      ...template,
      id: undefined,
      name: `${template.name} (Copia)`,
      isDefault: false,
    })
  }

  const handleSendTest = async (
    email: string,
    subject: string,
    html: string,
    data: Record<string, any>
  ) => {
    try {
      const res = await fetch("/api/email-templates/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject,
          htmlContent: html,
          data,
        }),
      })

      if (res.ok) {
        toast.success("Email de prueba enviado correctamente")
      } else {
        const data = await res.json()
        toast.error(data.error || "Error al enviar email de prueba")
      }
    } catch (error) {
      console.error("Error sending test email:", error)
      toast.error("Error al enviar email de prueba")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Cargando plantillas...</div>
      </div>
    )
  }

  if (mode === "list") {
    return (
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plantillas de Email</h1>
            <p className="text-gray-600 mt-2">
              Gestiona las plantillas de correo electrónico del sistema
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Plantilla
          </Button>
        </div>

        {/* Agrupar plantillas por tipo */}
        <div className="space-y-6">
          {Object.entries(EMAIL_TEMPLATE_TYPE_LABELS).map(([type, label]) => {
            const typeTemplates = templates.filter((t) => t.type === type)

            return (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      {label}
                    </div>
                    <Badge variant="info">{typeTemplates.length} plantilla(s)</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {typeTemplates.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">
                      No hay plantillas para este tipo. Crea una nueva.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {typeTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900">{template.name}</h3>
                              {template.isDefault && (
                                <Badge variant="success" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Por Defecto
                                </Badge>
                              )}
                              {!template.isActive && (
                                <Badge variant="error" className="text-xs">
                                  Inactiva
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {template.subject}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleActive(template)}
                              title={template.isActive ? "Desactivar" : "Activar"}
                            >
                              {template.isActive ? (
                                <Power className="h-4 w-4" />
                              ) : (
                                <PowerOff className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicate(template)}
                              title="Duplicar"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(template.id!)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Modo crear/editar
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setMode("list")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === "create" ? "Nueva Plantilla" : "Editar Plantilla"}
            </h1>
          </div>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Plantilla
        </Button>
      </div>

      {/* Formulario de datos básicos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Información de la Plantilla</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Plantilla *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Email de confirmación de pedido"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Email *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as EmailTemplateType })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {Object.entries(EMAIL_TEMPLATE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Plantilla Activa</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Usar por Defecto
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor de Email */}
      <EmailEditor
        subject={formData.subject}
        htmlContent={formData.htmlContent}
        variables={formData.variables}
        sampleData={formData.sampleData}
        onSubjectChange={(subject) => setFormData({ ...formData, subject })}
        onContentChange={(htmlContent) => setFormData({ ...formData, htmlContent })}
        onSendTest={handleSendTest}
      />
    </div>
  )
}
