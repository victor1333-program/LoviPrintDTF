"use client"

import { openCookiePreferences } from "@/lib/consent"

interface ManageCookiesButtonProps {
  className?: string
  children?: React.ReactNode
}

export function ManageCookiesButton({ className, children }: ManageCookiesButtonProps) {
  return (
    <button
      type="button"
      onClick={openCookiePreferences}
      className={className}
    >
      {children || "Gestionar cookies"}
    </button>
  )
}
