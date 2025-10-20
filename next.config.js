/** @type {import('next').NextConfig} */
const nextConfig = {
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
