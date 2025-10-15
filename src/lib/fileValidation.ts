import { prisma } from './prisma'

interface ValidationSettings {
  maxSizeMB: number
  minDPI: number
  allowedFormats: string[]
  widthPerMeterCM: number
  heightPerMeterCM: number
}

let cachedSettings: ValidationSettings | null = null
let settingsLastFetched = 0
const SETTINGS_CACHE_TTL = 5 * 60 * 1000 // 5 minutos

async function getValidationSettings(): Promise<ValidationSettings> {
  const now = Date.now()

  // Usar cache si no ha expirado
  if (cachedSettings && (now - settingsLastFetched) < SETTINGS_CACHE_TTL) {
    return cachedSettings
  }

  try {
    const settings = await prisma.setting.findMany({
      where: {
        category: 'validation',
        key: {
          in: [
            'file_max_size_mb',
            'file_min_dpi',
            'file_allowed_formats',
            'file_width_per_meter_cm',
            'file_height_per_meter_cm'
          ]
        }
      }
    })

    const config: Record<string, string> = {}
    settings.forEach(s => {
      config[s.key] = s.value
    })

    cachedSettings = {
      maxSizeMB: parseFloat(config.file_max_size_mb || '0'),
      minDPI: parseInt(config.file_min_dpi || '300'),
      allowedFormats: (config.file_allowed_formats || 'png,pdf').split(',').map(f => f.trim().toLowerCase()),
      widthPerMeterCM: parseInt(config.file_width_per_meter_cm || '56'),
      heightPerMeterCM: parseInt(config.file_height_per_meter_cm || '100'),
    }

    settingsLastFetched = now
    return cachedSettings
  } catch (error) {
    console.error('Error fetching validation settings:', error)
    // Valores por defecto
    return {
      maxSizeMB: 0, // Sin límite
      minDPI: 300,
      allowedFormats: ['png', 'pdf'],
      widthPerMeterCM: 56,
      heightPerMeterCM: 100,
    }
  }
}

export interface FileValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  metadata?: {
    width?: number
    height?: number
    dpi?: number
    format?: string
    sizeKB?: number
  }
}

/**
 * Valida un archivo basándose en la configuración del sistema
 */
export async function validateFile(
  file: File,
  quantityMeters?: number
): Promise<FileValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const settings = await getValidationSettings()

  // 1. Validar tamaño del archivo
  const sizeInMB = file.size / (1024 * 1024)
  if (settings.maxSizeMB > 0 && sizeInMB > settings.maxSizeMB) {
    errors.push(`El archivo supera el tamaño máximo permitido de ${settings.maxSizeMB}MB`)
  }

  // 2. Validar formato
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (!fileExtension || !settings.allowedFormats.includes(fileExtension)) {
    errors.push(
      `Formato no permitido. Solo se aceptan: ${settings.allowedFormats.map(f => f.toUpperCase()).join(', ')}`
    )
  }

  // 3. Obtener metadata de la imagen (si es PNG)
  let metadata: FileValidationResult['metadata'] = {
    format: fileExtension,
    sizeKB: Math.round(file.size / 1024),
  }

  if (fileExtension === 'png' || fileExtension === 'jpg' || fileExtension === 'jpeg') {
    try {
      const imageMetadata = await getImageMetadata(file)
      metadata = { ...metadata, ...imageMetadata }

      // 4. Validar DPI
      if (imageMetadata.dpi && imageMetadata.dpi < settings.minDPI) {
        errors.push(
          `La resolución es demasiado baja (${imageMetadata.dpi} DPI). Se requiere mínimo ${settings.minDPI} DPI para garantizar la calidad de impresión.`
        )
      }

      // 5. Validar dimensiones si se especificó cantidad de metros
      if (quantityMeters && imageMetadata.width && imageMetadata.height && imageMetadata.dpi) {
        const expectedWidthPx = cmToPixels(settings.widthPerMeterCM, imageMetadata.dpi)
        const expectedHeightPx = cmToPixels(settings.heightPerMeterCM * quantityMeters, imageMetadata.dpi)

        const widthDiffPercent = Math.abs((imageMetadata.width - expectedWidthPx) / expectedWidthPx) * 100
        const heightDiffPercent = Math.abs((imageMetadata.height - expectedHeightPx) / expectedHeightPx) * 100

        if (widthDiffPercent > 10) {
          warnings.push(
            `El ancho del archivo (${imageMetadata.width}px) difiere del esperado para ${settings.widthPerMeterCM}cm (${Math.round(expectedWidthPx)}px a ${imageMetadata.dpi} DPI)`
          )
        }

        if (heightDiffPercent > 10) {
          warnings.push(
            `La altura del archivo (${imageMetadata.height}px) difiere de la esperada para ${quantityMeters}m (${Math.round(expectedHeightPx)}px a ${imageMetadata.dpi} DPI)`
          )
        }
      }
    } catch (error) {
      warnings.push('No se pudo verificar la resolución del archivo. Asegúrate de que cumple con los requisitos.')
    }
  }

  // PDF: solo validar que sea PDF válido
  if (fileExtension === 'pdf') {
    warnings.push('Asegúrate de que el PDF tiene la resolución adecuada (mínimo 300 DPI)')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata,
  }
}

/**
 * Obtiene metadata de una imagen
 */
async function getImageMetadata(file: File): Promise<{
  width?: number
  height?: number
  dpi?: number
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // Intentar leer DPI de PNG
        let dpi: number | undefined

        if (file.type === 'image/png') {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer
            dpi = extractPNGDPI(arrayBuffer)
          } catch (error) {
            console.warn('Could not extract DPI from PNG:', error)
          }
        }

        resolve({
          width: img.width,
          height: img.height,
          dpi,
        })
      }

      img.onerror = () => {
        reject(new Error('Error loading image'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Error reading file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Extrae DPI de un archivo PNG
 */
function extractPNGDPI(arrayBuffer: ArrayBuffer): number | undefined {
  const view = new DataView(arrayBuffer)

  // Verificar que es PNG (magic number: 89 50 4E 47)
  if (view.getUint32(0) !== 0x89504e47) {
    return undefined
  }

  let offset = 8 // Saltar PNG signature

  while (offset < view.byteLength) {
    const length = view.getUint32(offset)
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7)
    )

    // pHYs chunk contiene información de DPI
    if (type === 'pHYs') {
      const pixelsPerUnitX = view.getUint32(offset + 8)
      const pixelsPerUnitY = view.getUint32(offset + 12)
      const unit = view.getUint8(offset + 16)

      // Si unit = 1, es pixels per meter
      if (unit === 1) {
        // Convertir de pixels/meter a DPI
        const dpiX = Math.round((pixelsPerUnitX * 2.54) / 100)
        const dpiY = Math.round((pixelsPerUnitY * 2.54) / 100)
        return Math.max(dpiX, dpiY)
      }
    }

    offset += 12 + length
  }

  return undefined
}

/**
 * Convierte centímetros a píxeles basándose en DPI
 */
function cmToPixels(cm: number, dpi: number): number {
  const inches = cm / 2.54
  return Math.round(inches * dpi)
}

/**
 * Convierte píxeles a centímetros basándose en DPI
 */
export function pixelsToCm(pixels: number, dpi: number): number {
  const inches = pixels / dpi
  return inches * 2.54
}

/**
 * Calcula las dimensiones recomendadas para un pedido
 */
export async function getRecommendedDimensions(
  quantityMeters: number
): Promise<{
  widthPx: number
  heightPx: number
  widthCm: number
  heightCm: number
  dpi: number
}> {
  const settings = await getValidationSettings()

  return {
    widthPx: cmToPixels(settings.widthPerMeterCM, settings.minDPI),
    heightPx: cmToPixels(settings.heightPerMeterCM * quantityMeters, settings.minDPI),
    widthCm: settings.widthPerMeterCM,
    heightCm: settings.heightPerMeterCM * quantityMeters,
    dpi: settings.minDPI,
  }
}
