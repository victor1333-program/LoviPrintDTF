declare global {
  interface Window {
    dataLayer: any[]
  }
}

interface GA4Item {
  item_id: string
  item_name: string
  item_category?: string
  price?: number
  quantity?: number
  item_variant?: string
}

function push(event: string, payload: Record<string, any>) {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ ecommerce: null })
  window.dataLayer.push({ event, ecommerce: payload })
}

export function trackViewItem(item: GA4Item) {
  push("view_item", {
    currency: "EUR",
    value: item.price ?? 0,
    items: [item],
  })
}

export function trackAddToCart(item: GA4Item) {
  push("add_to_cart", {
    currency: "EUR",
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [item],
  })
}

export function trackBeginCheckout(items: GA4Item[], value: number) {
  push("begin_checkout", {
    currency: "EUR",
    value,
    items,
  })
}

export function trackPurchase(params: {
  transactionId: string
  value: number
  items: GA4Item[]
  tax?: number
  shipping?: number
  coupon?: string
}) {
  push("purchase", {
    transaction_id: params.transactionId,
    currency: "EUR",
    value: params.value,
    tax: params.tax,
    shipping: params.shipping,
    coupon: params.coupon,
    items: params.items,
  })
}

export function trackGenerateLead(source: string, value?: number) {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: "generate_lead",
    lead_source: source,
    value: value ?? 0,
    currency: "EUR",
  })
}

const PENDING_PURCHASE_KEY = "lovi_pending_purchase"

export interface PendingPurchaseSnapshot {
  transactionId: string
  value: number
  tax?: number
  shipping?: number
  coupon?: string
  items: GA4Item[]
}

export function savePendingPurchase(snapshot: PendingPurchaseSnapshot) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(snapshot))
  } catch {}
}

export function consumePendingPurchase(transactionId: string): PendingPurchaseSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(PENDING_PURCHASE_KEY)
    if (!raw) return null
    const snapshot: PendingPurchaseSnapshot = JSON.parse(raw)
    if (snapshot.transactionId !== transactionId) return null
    sessionStorage.removeItem(PENDING_PURCHASE_KEY)
    return snapshot
  } catch {
    return null
  }
}
