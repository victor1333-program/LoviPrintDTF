/** @type {import('next').NextConfig} */
const nextConfig = {
  // Content Security Policy headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              // Default: solo permitir recursos del propio dominio
              "default-src 'self'",

              // Scripts: propio dominio + Google (GTM, Analytics, Ads) + inline para GTM y Next.js
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.google-analytics.com https://*.googleadservices.com https://*.google.com",

              // Estilos: propio dominio + inline (Next.js usa inline styles) + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

              // Imágenes: propio dominio + data URIs + Cloudinary + Unsplash + Google
              "img-src 'self' data: blob: https: https://res.cloudinary.com https://images.unsplash.com https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com https://*.googleadservices.com",

              // Fuentes: propio dominio + Google Fonts + data URIs
              "font-src 'self' data: https://fonts.gstatic.com",

              // Conexiones: API + Google (Analytics, Ads, Tag Manager) + Stripe
              "connect-src 'self' https://*.google-analytics.com https://*.google.com https://*.googleadservices.com https://www.googletagmanager.com https://*.stripe.com",

              // Frames/iframes: GTM + WhatsApp + propio dominio
              "frame-src 'self' https://www.googletagmanager.com https://wa.me",

              // Media: solo propio dominio
              "media-src 'self'",

              // Objetos/embeds: ninguno (seguridad)
              "object-src 'none'",

              // Base URI: solo propio dominio (prevenir base tag injection)
              "base-uri 'self'",

              // Form actions: solo enviar a propio dominio
              "form-action 'self'",

              // Frame ancestors: NO permitir que el sitio sea embebido (anti-clickjacking)
              "frame-ancestors 'none'",

              // Upgrade insecure requests en producción
              "upgrade-insecure-requests",

              // Block all mixed content
              "block-all-mixed-content"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'loviprintdtf.es',
      },
      {
        protocol: 'https',
        hostname: 'www.loviprintdtf.es',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Permitir peticiones cross-origin desde el dominio en producción
  allowedDevOrigins: ['www.loviprintdtf.es', 'loviprintdtf.es'],

  // Configuración de webpack para pdfkit
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Para pdfkit en el servidor, ignoramos archivos que no son necesarios
      config.resolve.alias = {
        ...config.resolve.alias,
        'canvas': false,
        'bufferutil': false,
        'utf-8-validate': false,
      }

      // Archivos .afm y otros archivos de pdfkit deben tratarse como assets
      config.module.rules.push({
        test: /\.(afm|ttf|pfb)$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/pdfkit/[hash][ext]',
        },
      })
    }

    return config
  },
}

module.exports = nextConfig
