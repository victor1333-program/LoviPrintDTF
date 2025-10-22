/**
 * Mapeo de códigos postales españoles a provincias
 * Basado en los 2 primeros dígitos del CP
 */

export interface ProvinceInfo {
  code: string
  name: string
  glsCode: string // Código numérico GLS (34 para todas las provincias españolas)
}

const SPANISH_PROVINCES: Record<string, ProvinceInfo> = {
  '01': { code: '01', name: 'Álava', glsCode: '34' },
  '02': { code: '02', name: 'Albacete', glsCode: '34' },
  '03': { code: '03', name: 'Alicante', glsCode: '34' },
  '04': { code: '04', name: 'Almería', glsCode: '34' },
  '05': { code: '05', name: 'Ávila', glsCode: '34' },
  '06': { code: '06', name: 'Badajoz', glsCode: '34' },
  '07': { code: '07', name: 'Islas Baleares', glsCode: '34' },
  '08': { code: '08', name: 'Barcelona', glsCode: '34' },
  '09': { code: '09', name: 'Burgos', glsCode: '34' },
  '10': { code: '10', name: 'Cáceres', glsCode: '34' },
  '11': { code: '11', name: 'Cádiz', glsCode: '34' },
  '12': { code: '12', name: 'Castellón', glsCode: '34' },
  '13': { code: '13', name: 'Ciudad Real', glsCode: '34' },
  '14': { code: '14', name: 'Córdoba', glsCode: '34' },
  '15': { code: '15', name: 'A Coruña', glsCode: '34' },
  '16': { code: '16', name: 'Cuenca', glsCode: '34' },
  '17': { code: '17', name: 'Girona', glsCode: '34' },
  '18': { code: '18', name: 'Granada', glsCode: '34' },
  '19': { code: '19', name: 'Guadalajara', glsCode: '34' },
  '20': { code: '20', name: 'Guipúzcoa', glsCode: '34' },
  '21': { code: '21', name: 'Huelva', glsCode: '34' },
  '22': { code: '22', name: 'Huesca', glsCode: '34' },
  '23': { code: '23', name: 'Jaén', glsCode: '34' },
  '24': { code: '24', name: 'León', glsCode: '34' },
  '25': { code: '25', name: 'Lleida', glsCode: '34' },
  '26': { code: '26', name: 'La Rioja', glsCode: '34' },
  '27': { code: '27', name: 'Lugo', glsCode: '34' },
  '28': { code: '28', name: 'Madrid', glsCode: '34' },
  '29': { code: '29', name: 'Málaga', glsCode: '34' },
  '30': { code: '30', name: 'Murcia', glsCode: '34' },
  '31': { code: '31', name: 'Navarra', glsCode: '34' },
  '32': { code: '32', name: 'Ourense', glsCode: '34' },
  '33': { code: '33', name: 'Asturias', glsCode: '34' },
  '34': { code: '34', name: 'Palencia', glsCode: '34' },
  '35': { code: '35', name: 'Las Palmas', glsCode: '34' },
  '36': { code: '36', name: 'Pontevedra', glsCode: '34' },
  '37': { code: '37', name: 'Salamanca', glsCode: '34' },
  '38': { code: '38', name: 'Santa Cruz de Tenerife', glsCode: '34' },
  '39': { code: '39', name: 'Cantabria', glsCode: '34' },
  '40': { code: '40', name: 'Segovia', glsCode: '34' },
  '41': { code: '41', name: 'Sevilla', glsCode: '34' },
  '42': { code: '42', name: 'Soria', glsCode: '34' },
  '43': { code: '43', name: 'Tarragona', glsCode: '34' },
  '44': { code: '44', name: 'Teruel', glsCode: '34' },
  '45': { code: '45', name: 'Toledo', glsCode: '34' },
  '46': { code: '46', name: 'Valencia', glsCode: '34' },
  '47': { code: '47', name: 'Valladolid', glsCode: '34' },
  '48': { code: '48', name: 'Vizcaya', glsCode: '34' },
  '49': { code: '49', name: 'Zamora', glsCode: '34' },
  '50': { code: '50', name: 'Zaragoza', glsCode: '34' },
  '51': { code: '51', name: 'Ceuta', glsCode: '34' },
  '52': { code: '52', name: 'Melilla', glsCode: '34' },
}

/**
 * Obtener información de provincia desde código postal español
 */
export function getProvinceFromPostalCode(postalCode: string): ProvinceInfo | null {
  if (!postalCode || postalCode.length < 2) {
    return null
  }

  // Extraer los 2 primeros dígitos
  const provinceCode = postalCode.substring(0, 2)

  return SPANISH_PROVINCES[provinceCode] || null
}

/**
 * Obtener nombre de provincia desde código postal
 */
export function getProvinceName(postalCode: string): string {
  const province = getProvinceFromPostalCode(postalCode)
  return province?.name || ''
}

/**
 * Validar si un código postal es español válido
 */
export function isValidSpanishPostalCode(postalCode: string): boolean {
  if (!postalCode) return false

  // Formato: 5 dígitos
  const regex = /^\d{5}$/
  if (!regex.test(postalCode)) return false

  // Verificar que la provincia existe
  const provinceCode = postalCode.substring(0, 2)
  return provinceCode in SPANISH_PROVINCES
}

/**
 * Mapeo de países europeos para GLS
 */
export interface CountryInfo {
  code: string // Código ISO 2 letras
  name: string
  glsCode: string // Código numérico GLS
  requiresIncoterm: boolean // Si requiere incoterm (fuera UE)
  euroBusinessParcel: boolean // Si acepta EuroBusinessParcel
}

export const GLS_COUNTRIES: Record<string, CountryInfo> = {
  'ES': { code: 'ES', name: 'España', glsCode: '34', requiresIncoterm: false, euroBusinessParcel: false },
  'PT': { code: 'PT', name: 'Portugal', glsCode: '351', requiresIncoterm: false, euroBusinessParcel: false },
  'FR': { code: 'FR', name: 'Francia', glsCode: '33', requiresIncoterm: false, euroBusinessParcel: true },
  'IT': { code: 'IT', name: 'Italia', glsCode: '39', requiresIncoterm: false, euroBusinessParcel: true },
  'DE': { code: 'DE', name: 'Alemania', glsCode: '49', requiresIncoterm: false, euroBusinessParcel: true },
  'BE': { code: 'BE', name: 'Bélgica', glsCode: '32', requiresIncoterm: false, euroBusinessParcel: true },
  'NL': { code: 'NL', name: 'Holanda', glsCode: '31', requiresIncoterm: false, euroBusinessParcel: true },
  'GB': { code: 'GB', name: 'Reino Unido', glsCode: '44', requiresIncoterm: true, euroBusinessParcel: true },
  'AT': { code: 'AT', name: 'Austria', glsCode: '43', requiresIncoterm: false, euroBusinessParcel: true },
  'PL': { code: 'PL', name: 'Polonia', glsCode: '48', requiresIncoterm: false, euroBusinessParcel: true },
  'CZ': { code: 'CZ', name: 'República Checa', glsCode: '42', requiresIncoterm: false, euroBusinessParcel: true },
  'SE': { code: 'SE', name: 'Suecia', glsCode: '46', requiresIncoterm: false, euroBusinessParcel: true },
  'DK': { code: 'DK', name: 'Dinamarca', glsCode: '45', requiresIncoterm: false, euroBusinessParcel: true },
  'NO': { code: 'NO', name: 'Noruega', glsCode: '47', requiresIncoterm: true, euroBusinessParcel: true },
  'CH': { code: 'CH', name: 'Suiza', glsCode: '411', requiresIncoterm: true, euroBusinessParcel: true },
  'IE': { code: 'IE', name: 'Irlanda', glsCode: '353', requiresIncoterm: false, euroBusinessParcel: true },
  'LU': { code: 'LU', name: 'Luxemburgo', glsCode: '352', requiresIncoterm: false, euroBusinessParcel: true },
  'FI': { code: 'FI', name: 'Finlandia', glsCode: '358', requiresIncoterm: false, euroBusinessParcel: true },
  'GR': { code: 'GR', name: 'Grecia', glsCode: '30', requiresIncoterm: false, euroBusinessParcel: true },
  'HU': { code: 'HU', name: 'Hungría', glsCode: '36', requiresIncoterm: false, euroBusinessParcel: true },
  'RO': { code: 'RO', name: 'Rumanía', glsCode: '40', requiresIncoterm: false, euroBusinessParcel: true },
  'BG': { code: 'BG', name: 'Bulgaria', glsCode: '359', requiresIncoterm: false, euroBusinessParcel: true },
  'HR': { code: 'HR', name: 'Croacia', glsCode: '385', requiresIncoterm: false, euroBusinessParcel: true },
  'SK': { code: 'SK', name: 'Eslovaquia', glsCode: '421', requiresIncoterm: false, euroBusinessParcel: true },
  'SI': { code: 'SI', name: 'Eslovenia', glsCode: '386', requiresIncoterm: false, euroBusinessParcel: true },
  'EE': { code: 'EE', name: 'Estonia', glsCode: '360', requiresIncoterm: false, euroBusinessParcel: true },
  'LV': { code: 'LV', name: 'Letonia', glsCode: '78', requiresIncoterm: false, euroBusinessParcel: true },
  'LT': { code: 'LT', name: 'Lituania', glsCode: '77', requiresIncoterm: false, euroBusinessParcel: true },
  'CY': { code: 'CY', name: 'Chipre', glsCode: '301', requiresIncoterm: false, euroBusinessParcel: true },
  'MT': { code: 'MT', name: 'Malta', glsCode: '443', requiresIncoterm: false, euroBusinessParcel: true },
  'AD': { code: 'AD', name: 'Andorra', glsCode: '9738', requiresIncoterm: false, euroBusinessParcel: false },
}

/**
 * Obtener información de país para GLS
 */
export function getCountryInfo(countryCode: string): CountryInfo | null {
  const upperCode = countryCode?.trim().toUpperCase()
  return GLS_COUNTRIES[upperCode] || null
}

/**
 * Normalizar código de país (puede venir como "España", "ES", "34")
 */
export function normalizeCountryCode(country: string): string {
  if (!country) return 'ES'

  const upperCountry = country.trim().toUpperCase()

  // Si ya es un código ISO de 2 letras válido
  if (GLS_COUNTRIES[upperCountry]) {
    return upperCountry
  }

  // Buscar por nombre
  const countryEntry = Object.values(GLS_COUNTRIES).find(
    c => c.name.toUpperCase() === upperCountry
  )

  if (countryEntry) {
    return countryEntry.code
  }

  // Buscar por código numérico GLS
  const countryByGlsCode = Object.values(GLS_COUNTRIES).find(
    c => c.glsCode === upperCountry
  )

  if (countryByGlsCode) {
    return countryByGlsCode.code
  }

  // Por defecto España
  return 'ES'
}

/**
 * Formatear teléfono móvil para GLS internacional
 * Formato: 00 + código país + número (solo dígitos)
 */
export function formatInternationalMobile(phone: string, countryCode: string): string {
  if (!phone) return ''

  // Limpiar el teléfono (solo dígitos)
  const cleanPhone = phone.replace(/\D/g, '')

  if (!cleanPhone) return ''

  const country = getCountryInfo(countryCode)
  if (!country) return cleanPhone

  // Si ya empieza con 00, devolverlo tal cual
  if (cleanPhone.startsWith('00')) {
    return cleanPhone
  }

  // Para España (34), si empieza con 6 o 7, añadir 0034
  if (country.code === 'ES') {
    if (cleanPhone.startsWith('6') || cleanPhone.startsWith('7')) {
      return `0034${cleanPhone}`
    }
    return cleanPhone
  }

  // Para otros países, añadir 00 + código país
  return `00${country.glsCode}${cleanPhone}`
}
