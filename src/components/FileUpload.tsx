"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "./ui/Button"
import { Upload, X, FileImage, CheckCircle2, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface UploadedFileData {
  url: string
  name: string
  size: number
  publicId?: string
  metadata?: any
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
      })

      toast.success("Archivo subido correctamente")
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
    return (
      <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{currentFile.name}</p>
              <p className="text-sm text-gray-600">
                {(currentFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              {currentFile.url && (
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
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-300 hover:border-primary-400 bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
          <Upload className="h-8 w-8 text-primary-600" />
        </div>

        <div>
          <p className="text-lg font-semibold text-gray-900 mb-2">
            {isDragActive ? 'Suelta tu archivo aquí' : 'Arrastra tu diseño o haz clic para seleccionar'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Formatos aceptados: PNG, JPG, PDF, PSD, AI
          </p>
          <p className="text-xs text-gray-500">
            Tamaño máximo: 150MB
          </p>
        </div>

        <Button type="button" variant="outline">
          Seleccionar Archivo
        </Button>
      </div>
    </div>
  )
}
