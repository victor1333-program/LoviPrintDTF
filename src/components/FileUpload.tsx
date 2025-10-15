"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "./ui/Button"
import { Upload, X, FileImage, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"

interface FileUploadProps {
  onFileUpload: (file: File) => void
  currentFile?: File | null
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

    onFileUpload(file)
    toast.success("Archivo cargado correctamente")
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
  })

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
