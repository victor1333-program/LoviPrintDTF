'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { getStoredConsent } from '@/lib/consent'

export function ClarityAnalytics() {
  const [enabled, setEnabled] = useState(false)
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

  useEffect(() => {
    const check = () => setEnabled(!!getStoredConsent()?.analytics)
    check()
    window.addEventListener('lovi:consent-changed', check)
    return () => window.removeEventListener('lovi:consent-changed', check)
  }, [])

  if (!projectId || !enabled) return null

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${projectId}");`}
    </Script>
  )
}
