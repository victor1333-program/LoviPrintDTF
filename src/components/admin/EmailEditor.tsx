"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Eye, Code, Send, Save, X } from "lucide-react"
import { EmailVariable } from "@/types/email-templates"

interface EmailEditorProps {
  subject: string
  htmlContent: string
  variables?: EmailVariable[]
  sampleData?: Record<string, any>
  onSubjectChange: (subject: string) => void
  onContentChange: (content: string) => void
  onPreview?: (subject: string, html: string, data: Record<string, any>) => void
  onSendTest?: (email: string, subject: string, html: string, data: Record<string, any>) => void
}

export default function EmailEditor({
  subject,
  htmlContent,
  variables = [],
  sampleData = {},
  onSubjectChange,
  onContentChange,
  onPreview,
  onSendTest,
}: EmailEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [testEmail, setTestEmail] = useState("")
  const [showVariablesPanel, setShowVariablesPanel] = useState(true)

  // Insertar variable en el cursor
  const insertVariable = (varName: string) => {
    const textarea = document.getElementById("html-editor") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = htmlContent
    const before = text.substring(0, start)
    const after = text.substring(end)

    const newContent = before + `{{${varName}}}` + after
    onContentChange(newContent)

    // Restaurar el foco y posición del cursor
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + varName.length + 4
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const handlePreview = () => {
    if (onPreview) {
      onPreview(subject, htmlContent, sampleData)
    }
    setMode("preview")
  }

  const handleSendTest = () => {
    if (!testEmail) {
      alert("Por favor, introduce un email de prueba")
      return
    }

    if (onSendTest) {
      onSendTest(testEmail, subject, htmlContent, sampleData)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Panel de Variables (lateral izquierdo) */}
      {showVariablesPanel && (
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Variables Disponibles</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVariablesPanel(false)}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-xs text-gray-600 mb-3">
                Haz clic para insertar en el editor
              </p>
              {variables.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  No hay variables definidas para este tipo de email
                </p>
              ) : (
                variables.map((variable) => (
                  <div
                    key={variable.name}
                    className="bg-gray-50 p-2 rounded border border-gray-200 hover:border-purple-400 cursor-pointer transition-colors"
                    onClick={() => insertVariable(variable.name)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-xs font-mono text-purple-600">
                        {`{{${variable.name}}}`}
                      </code>
                      {variable.required && (
                        <Badge variant="error" className="text-xs px-1 py-0">
                          Requerida
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{variable.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ej: <span className="italic">{variable.example}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor Principal */}
      <Card className={showVariablesPanel ? "lg:col-span-3" : "lg:col-span-4"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Editor de Email</CardTitle>
            <div className="flex gap-2">
              {!showVariablesPanel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVariablesPanel(true)}
                  className="lg:hidden"
                >
                  Ver Variables
                </Button>
              )}
              <Button
                variant={mode === "edit" ? "primary" : "outline"}
                size="sm"
                onClick={() => setMode("edit")}
              >
                <Code className="h-4 w-4 mr-1" />
                Editor
              </Button>
              <Button
                variant={mode === "preview" ? "primary" : "outline"}
                size="sm"
                onClick={handlePreview}
              >
                <Eye className="h-4 w-4 mr-1" />
                Vista Previa
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mode === "edit" ? (
            <div className="space-y-4">
              {/* Campo de Asunto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto del Email
                </label>
                <Input
                  type="text"
                  value={subject}
                  onChange={(e) => onSubjectChange(e.target.value)}
                  placeholder="Ej: Pedido confirmado - {{orderNumber}}"
                  className="font-medium"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Puedes usar variables como {`{{variableName}}`}
                </p>
              </div>

              {/* Editor HTML */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido HTML
                </label>
                <textarea
                  id="html-editor"
                  value={htmlContent}
                  onChange={(e) => onContentChange(e.target.value)}
                  className="w-full h-96 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Escribe tu HTML aquí..."
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Escribe HTML estándar. Las variables se reemplazan con el formato {`{{variableName}}`}
                </p>
              </div>

              {/* Consejos rápidos */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Consejos para el editor:
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Usa estilos inline para mejor compatibilidad con clientes de email</li>
                  <li>
                    • Evita JavaScript y CSS complejos (muchos clientes de email no los soportan)
                  </li>
                  <li>• Usa tablas para el layout en lugar de divs con flexbox/grid</li>
                  <li>
                    • Las variables se reemplazan automáticamente al enviar el email
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Asunto procesado */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Asunto:</p>
                <p className="font-medium text-gray-900">{subject}</p>
              </div>

              {/* Vista previa HTML */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <p className="text-xs text-gray-600">Vista Previa del Email</p>
                </div>
                <div
                  className="p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>

              {/* Envío de prueba */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Enviar Email de Prueba
                </h4>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSendTest} size="sm">
                    <Send className="h-4 w-4 mr-1" />
                    Enviar
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Se enviará el email con los datos de ejemplo configurados
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
