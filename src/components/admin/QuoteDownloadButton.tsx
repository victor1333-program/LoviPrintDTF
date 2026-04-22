"use client"

import { Download } from "lucide-react"
import toast from "react-hot-toast"
import { useState } from "react"

interface QuoteDownloadButtonProps {
  fileUrl: string
  fileName: string
}

export default function QuoteDownloadButton({ fileUrl, fileName }: QuoteDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setDownloading(true)

      // Usar el endpoint API para descargar el archivo de manera segura
      const downloadUrl = `/api/admin/download-attachment?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(fileName)}`

      // Descargar el archivo
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al descargar el archivo')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Limpiar el objeto URL
      window.URL.revokeObjectURL(url)

      toast.success('Archivo descargado correctamente')
    } catch (error: any) {
      console.error('Error downloading file:', error)
      toast.error(error.message || 'Error al descargar el archivo')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-4 h-4" />
      {downloading ? 'Descargando...' : 'Descargar'}
    </button>
  )
}
