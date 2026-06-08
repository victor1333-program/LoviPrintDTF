import { Landmark } from "lucide-react"

interface PaymentMethodsBadgeProps {
  variant?: "footer" | "checkout"
  className?: string
}

function VisaIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-full w-auto" aria-label="Visa">
      <rect width="48" height="32" rx="4" fill="#fff" />
      <rect width="48" height="32" rx="4" fill="none" stroke="#E5E7EB" />
      <path
        fill="#1A1F71"
        d="M19.7 21.3h-2.8l1.7-10.6h2.8l-1.7 10.6zm9.9-10.3a7 7 0 0 0-2.5-.5c-2.7 0-4.7 1.5-4.7 3.6 0 1.6 1.4 2.4 2.5 3 1.1.5 1.5.9 1.5 1.4 0 .7-.9 1.1-1.7 1.1-1.2 0-1.8-.2-2.7-.6l-.4-.2-.4 2.6a8.8 8.8 0 0 0 3.2.6c2.9 0 4.8-1.4 4.8-3.7 0-1.2-.7-2.2-2.4-3-1-.5-1.6-.8-1.6-1.4 0-.5.5-1 1.7-1 1 0 1.7.2 2.2.4l.3.2.4-2.5zM34 17.7l1.1-3 .3 1c.4 1.2.7 2 .7 2h-2.1zm3.4-7H35a1.3 1.3 0 0 0-1.4.8l-4 9.8H33l.6-1.6h3.4l.3 1.6h2.5l-2.4-10.6zM15.4 10.7l-2.7 7.2-.3-1.5a8 8 0 0 0-3.7-4.3l2.5 9.2h2.8l4.2-10.6h-2.8z"
      />
    </svg>
  )
}

function MastercardIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-full w-auto" aria-label="Mastercard">
      <rect width="48" height="32" rx="4" fill="#fff" />
      <rect width="48" height="32" rx="4" fill="none" stroke="#E5E7EB" />
      <circle cx="20" cy="16" r="7" fill="#EB001B" />
      <circle cx="28" cy="16" r="7" fill="#F79E1B" />
      <path
        fill="#FF5F00"
        d="M24 10.6a7 7 0 0 1 0 10.8 7 7 0 0 1 0-10.8z"
      />
    </svg>
  )
}

function AmexIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-full w-auto" aria-label="American Express">
      <rect width="48" height="32" rx="4" fill="#1F72CD" />
      <text
        x="24"
        y="19"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="8"
        fill="#fff"
        letterSpacing="0.5"
      >
        AMEX
      </text>
    </svg>
  )
}

function BizumIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-full w-auto" aria-label="Bizum">
      <rect width="48" height="32" rx="4" fill="#fff" />
      <rect width="48" height="32" rx="4" fill="none" stroke="#E5E7EB" />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="10"
        fill="#00A0E2"
        letterSpacing="-0.3"
      >
        Bizum
      </text>
    </svg>
  )
}

function ApplePayIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-full w-auto" aria-label="Apple Pay">
      <rect width="48" height="32" rx="4" fill="#000" />
      <path
        fill="#fff"
        d="M12.6 13.5c-.5.6-1.4 1.1-2.2 1-.1-.9.3-1.8.8-2.4.5-.7 1.5-1.1 2.2-1.1.1 1 -.3 1.8-.8 2.5zm.8.2c-1.2-.1-2.3.7-2.9.7-.6 0-1.5-.6-2.5-.6-1.3 0-2.5.8-3.2 1.9-1.4 2.3-.4 5.7 1 7.5.7.9 1.5 1.9 2.5 1.9 1 0 1.4-.6 2.6-.6 1.2 0 1.5.6 2.6.6 1.1 0 1.8-.9 2.5-1.8.8-1 1.1-2.1 1.1-2.1s-2.1-.8-2.2-3.2c0-2 1.7-3 1.7-3 -.9-1.4-2.4-1.5-3-1.5zM21.4 12v11h1.7v-3.8h2.4c2.2 0 3.7-1.5 3.7-3.6 0-2.1-1.5-3.6-3.6-3.6h-4.2zm1.7 1.4h2c1.5 0 2.3.8 2.3 2.2 0 1.4-.8 2.2-2.3 2.2h-2v-4.4zm9.4 9.7c1.1 0 2.1-.6 2.6-1.4h.1v1.3h1.6V18c0-1.6-1.3-2.6-3.2-2.6-1.8 0-3.2 1-3.2 2.4h1.5c.1-.6.7-1.1 1.6-1.1 1.1 0 1.7.5 1.7 1.4v.6l-2.2.1c-2 .1-3.1 1-3.1 2.5 0 1.5 1.2 2.6 2.6 2.6zm.5-1.3c-.9 0-1.6-.5-1.6-1.2 0-.8.6-1.2 1.8-1.3l1.9-.1v.6c0 1.2-1 2-2.1 2zm5.6 4.1c1.6 0 2.3-.6 2.9-2.4l2.8-7.8h-1.7l-1.9 6h-.1l-1.9-6h-1.7l2.7 7.5-.1.5c-.2.8-.6 1.1-1.4 1.1-.1 0-.4 0-.5-.1v1.3l.9.1z"
      />
    </svg>
  )
}

function GooglePayIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-full w-auto" aria-label="Google Pay">
      <rect width="48" height="32" rx="4" fill="#fff" />
      <rect width="48" height="32" rx="4" fill="none" stroke="#E5E7EB" />
      <path
        fill="#5F6368"
        d="M22.4 16.4v3.2H21V12h2.9c.7 0 1.4.2 1.9.7s.8 1.1.8 1.8c0 .7-.3 1.3-.8 1.8s-1.1.7-1.9.7h-1.5v-.6zm0-3.2v2.4h1.5c.4 0 .8-.1 1-.4.5-.4.5-1.1 0-1.5-.3-.3-.6-.4-1-.4l-1.5-.1zm6.5 1.4c.7 0 1.3.2 1.7.6.4.4.6.9.6 1.5v3h-1.4v-.6h-.1c-.4.5-.9.7-1.5.7-.6 0-1.1-.2-1.4-.5-.4-.4-.6-.8-.6-1.3 0-.6.2-1 .6-1.3.4-.3 1-.5 1.7-.5.6 0 1.1.1 1.4.3v-.2c0-.3-.1-.6-.4-.8-.2-.2-.5-.3-.9-.3-.5 0-.9.2-1.2.7l-1.3-.6c.6-.4 1.2-.7 2.2-.7zm-1.8 3.6c0 .2.1.4.3.6.2.1.4.2.7.2.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1-.3-.2-.7-.3-1.2-.3-.4 0-.7.1-.9.2-.3.2-.5.4-.5.7v.2zm10-2.5L34 19.6h-1.4l1.2-2.7-2.1-4h1.5l1.5 3.5.1.2 1.4-3.7h1.6l-.7 1.2z"
      />
      <path
        fill="#4285F4"
        d="M16.9 16.2c0-.4 0-.7-.1-1H13v1.9h2.2c-.1.5-.4 1-.9 1.3v1.1h1.4c.8-.8 1.2-1.9 1.2-3.3z"
      />
      <path
        fill="#34A853"
        d="M13 20.3c1.1 0 2.1-.4 2.7-1l-1.4-1.1c-.4.3-.9.4-1.4.4-1 0-1.9-.7-2.2-1.7H9.4v1.1c.7 1.4 2 2.3 3.6 2.3z"
      />
      <path
        fill="#FBBC04"
        d="M10.7 16.9a2.6 2.6 0 0 1 0-1.6v-1.1H9.4a4.1 4.1 0 0 0 0 3.8l1.3-1z"
      />
      <path
        fill="#EA4335"
        d="M13 13.6c.6 0 1.1.2 1.5.6l1.1-1.1A4 4 0 0 0 13 12c-1.6 0-3 .9-3.6 2.3l1.3 1c.4-1 1.3-1.7 2.3-1.7z"
      />
    </svg>
  )
}

function TransferIcon() {
  return (
    <div
      className="h-full aspect-[3/2] flex items-center justify-center bg-white border border-gray-200 rounded"
      aria-label="Transferencia bancaria"
    >
      <Landmark className="h-4 w-4 text-gray-700" />
    </div>
  )
}

const METHODS = [
  { key: "visa", label: "Visa", Icon: VisaIcon },
  { key: "mastercard", label: "Mastercard", Icon: MastercardIcon },
  { key: "amex", label: "American Express", Icon: AmexIcon },
  { key: "bizum", label: "Bizum", Icon: BizumIcon },
  { key: "applepay", label: "Apple Pay", Icon: ApplePayIcon },
  { key: "googlepay", label: "Google Pay", Icon: GooglePayIcon },
  { key: "transfer", label: "Transferencia", Icon: TransferIcon },
] as const

export function PaymentMethodsBadge({
  variant = "footer",
  className = "",
}: PaymentMethodsBadgeProps) {
  const isCheckout = variant === "checkout"
  const iconHeight = isCheckout ? "h-7" : "h-6"

  return (
    <div className={className}>
      {isCheckout && (
        <p className="text-xs font-medium text-gray-600 mb-2">Métodos de pago aceptados</p>
      )}
      <ul className="flex flex-wrap items-center gap-2">
        {METHODS.map(({ key, label, Icon }) => (
          <li key={key} title={label} className={iconHeight}>
            <Icon />
          </li>
        ))}
      </ul>
    </div>
  )
}
