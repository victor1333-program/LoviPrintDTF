export const CONSENT_STORAGE_KEY = "cookieConsent"
const LEGACY_KEY = "cookiesAccepted"

export interface ConsentCategories {
  necessary: true
  analytics: boolean
  marketing: boolean
  personalization: boolean
  timestamp: string
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

export function getStoredConsent(): ConsentCategories | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...parsed, necessary: true }
    }
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy === "true") {
      return migrateFromLegacy(true)
    }
    if (legacy === "false") {
      return migrateFromLegacy(false)
    }
  } catch {}
  return null
}

function migrateFromLegacy(accepted: boolean): ConsentCategories {
  const consent: ConsentCategories = {
    necessary: true,
    analytics: accepted,
    marketing: accepted,
    personalization: accepted,
    timestamp: new Date().toISOString(),
  }
  saveConsent(consent)
  try {
    localStorage.removeItem(LEGACY_KEY)
  } catch {}
  return consent
}

export function saveConsent(consent: Omit<ConsentCategories, "necessary" | "timestamp"> & { timestamp?: string }) {
  if (typeof window === "undefined") return
  const full: ConsentCategories = {
    necessary: true,
    analytics: consent.analytics,
    marketing: consent.marketing,
    personalization: consent.personalization,
    timestamp: consent.timestamp || new Date().toISOString(),
  }
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(full))
  } catch {}
  applyConsent(full)
}

export function applyConsent(c: ConsentCategories) {
  if (typeof window === "undefined" || !window.gtag) return
  window.gtag("consent", "update", {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: c.marketing ? "granted" : "denied",
    ad_user_data: c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
    personalization_storage: c.personalization ? "granted" : "denied",
  })
}

export function openCookiePreferences() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event("lovi:open-cookie-preferences"))
}
