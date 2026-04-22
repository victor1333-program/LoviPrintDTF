"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "./ui/Button"
import { Upload, X, FileImage, CheckCircle2, Loader2, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"

interface UploadedFileData {
  url: string
  name: string
  size: number
  publicId?: string
  metadata?: any
  qualityWarnings?: string[]
  imageMetadata?: { width?: number; height?: number; dpi?: number } | null
}

interface FileUploadProps {
  onFileUpload: (fileData: UploadedFileData) => void
  currentFile?: UploadedFileData | null
  onRemove?: () => void
}

export function FileUpload({ onFileUpload, currentFile, onRemove }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]

    // Validar tamaño (max 150MB)
    const maxSize = 150 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("El archivo es demasiado grande. Máximo 150MB")
      return
    }

    // Subir archivo al servidor
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'customer-designs')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al subir el archivo')
      }

      const data = await response.json()

      if (!data.success || !data.fileUrl) {
        throw new Error('No se recibió la URL del archivo')
      }

      // Pasar los datos del archivo subido
      onFileUpload({
        url: data.fileUrl,
        name: data.fileName || file.name,
        size: data.fileSize || file.size,
        publicId: data.publicId,
        metadata: data.metadata,
        qualityWarnings: data.qualityWarnings || [],
        imageMetadata: data.imageMetadata || null,
      })

      if (data.qualityWarnings && data.qualityWarnings.length > 0) {
        toast("Archivo subido con avisos de calidad", { icon: "⚠️", duration: 5000 })
      } else {
        toast.success("Archivo subido correctamente")
      }
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast.error(error.message || "Error al subir el archivo")
    } finally {
      setUploading(false)
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'image/vnd.adobe.photoshop': ['.psd'],
      'application/postscript': ['.ai'],
    },
    maxFiles: 1,
    multiple: false,
    disabled: uploading,
  })

  // Mostrar estado de carga
  if (uploading) {
    return (
      <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Subiendo archivo...</p>
            <p className="text-sm text-gray-600">Por favor espera</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar archivo subido
  if (currentFile) {
    const hasWarnings = currentFile.qualityWarnings && currentFile.qualityWarnings.length > 0
    const borderColor = hasWarnings ? 'border-yellow-500' : 'border-green-500'
    const bgColor = hasWarnings ? 'bg-yellow-50' : 'bg-green-50'
    const iconBg = hasWarnings ? 'bg-yellow-100' : 'bg-green-100'

    return (
      <div className={`border-2 ${borderColor} rounded-lg p-4 sm:p-6 ${bgColor}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              {hasWarnings ? (
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 truncate">{currentFile.name}</p>
              <p className="text-sm text-gray-600">
                {(currentFile.size / (1024 * 1024)).toFixed(2)} MB
                {currentFile.imageMetadata?.width && currentFile.imageMetadata?.height && (
                  <> · {currentFile.imageMetadata.width}×{currentFile.imageMetadata.height}px</>
                )}
                {currentFile.imageMetadata?.dpi && (
                  <> · {currentFile.imageMetadata.dpi} DPI</>
                )}
              </p>
              {currentFile.url && !hasWarnings && (
                <p className="text-xs text-green-600 mt-1">✓ Archivo guardado en el servidor</p>
              )}
            </div>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              type="button"
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {hasWarnings && (
          <div className="mt-4 pl-4 border-l-2 border-yellow-400 space-y-1">
            <p className="text-sm font-medium text-yellow-900">
              Avisos sobre tu diseño:
            </p>
            <ul className="text-sm text-yellow-800 list-disc list-inside space-y-0.5">
              {currentFile.qualityWarnings!.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
            <p className="text-xs text-yellow-700 mt-2">
              Puedes continuar con este archivo, pero el resultado de impresión podría verse afectado. Si quieres, sube un archivo de mayor calidad.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-300 hover:border-primary-400 bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <Upload className="h-5 w-5 text-primary-600" />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">
            {isDragActive ? 'Suelta tu archivo aquí' : 'Arrastra tu diseño o haz clic para seleccionar'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Tamaño máximo: 150MB
          </p>
        </div>

        <Button type="button" variant="outline" size="sm">
          Seleccionar Archivo
        </Button>
      </div>
    </div>
  )
}
