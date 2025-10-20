import { PrismaClient, ProductType, StockStatus, VoucherType } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Crear usuario admin
  const hashedPassword = await hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dtfprint.com' },
    update: {},
    create: {
      email: 'admin@dtfprint.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user created')

  // 2. Crear categorías
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'dtf-textil' },
      update: {},
      create: {
        name: 'DTF Textil',
        slug: 'dtf-textil',
        description: 'Transferencias DTF de alta calidad para todo tipo de textiles',
        order: 1,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'uv-dtf' },
      update: {},
      create: {
        name: 'UV DTF',
        slug: 'uv-dtf',
        description: 'Impresión UV DTF para superficies rígidas y especiales',
        order: 2,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'consumibles' },
      update: {},
      create: {
        name: 'Consumibles',
        slug: 'consumibles',
        description: 'Tintas, films, adhesivos y materiales para impresión DTF',
        order: 3,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'bonos' },
      update: {},
      create: {
        name: 'Bonos',
        slug: 'bonos',
        description: 'Bonos prepagados de metros con descuentos especiales',
        order: 4,
        isActive: true,
      },
    }),
  ])
  console.log('✅ Categories created')

  // 3. Crear productos DTF Textil con rangos de precios
  const dtfTextil = await prisma.product.upsert({
    where: { slug: 'dtf-textil-premium' },
    update: {},
    create: {
      name: 'DTF Textil Premium',
      slug: 'dtf-textil-premium',
      shortDescription: 'Film DTF de alta calidad para textil',
      description: 'Nuestro film DTF premium ofrece colores vibrantes, excelente durabilidad y aplicación fácil en todo tipo de textiles. Perfecto para camisetas, sudaderas, bolsas y más.',
      categoryId: categories[0].id,
      productType: ProductType.DTF_TEXTILE,
      basePrice: 15.00,
      unit: 'metros',
      minQuantity: 0.5,
      maxQuantity: 100,
      stockStatus: StockStatus.IN_STOCK,
      isFeatured: true,
      specifications: {
        width: '30cm o 60cm',
        resolution: '1440dpi',
        durability: '50+ lavados',
        application: 'Plancha o prensa térmica 160-170°C',
        materials: 'Algodón, poliéster, mezclas',
      },
    },
  })

  // Rangos de precio para DTF Textil (basado en la competencia)
  await Promise.all([
    prisma.priceRange.upsert({
      where: { id: 'dtf-range-1' },
      update: {},
      create: {
        id: 'dtf-range-1',
        productId: dtfTextil.id,
        fromQty: 0.5,
        toQty: 0.9,
        price: 15.00,
      },
    }),
    prisma.priceRange.upsert({
      where: { id: 'dtf-range-2' },
      update: {},
      create: {
        id: 'dtf-range-2',
        productId: dtfTextil.id,
        fromQty: 1,
        toQty: 5,
        price: 12.50,
        discountPct: 16.67,
      },
    }),
    prisma.priceRange.upsert({
      where: { id: 'dtf-range-3' },
      update: {},
      create: {
        id: 'dtf-range-3',
        productId: dtfTextil.id,
        fromQty: 6,
        toQty: 10,
        price: 11.00,
        discountPct: 26.67,
      },
    }),
    prisma.priceRange.upsert({
      where: { id: 'dtf-range-4' },
      update: {},
      create: {
        id: 'dtf-range-4',
        productId: dtfTextil.id,
        fromQty: 11,
        toQty: null,
        price: 9.50,
        discountPct: 36.67,
      },
    }),
  ])

  // 4. Crear producto UV DTF
  const uvDtf = await prisma.product.upsert({
    where: { slug: 'uv-dtf-rigidos' },
    update: {},
    create: {
      name: 'UV DTF para Rígidos',
      slug: 'uv-dtf-rigidos',
      shortDescription: 'Transferencias UV DTF para superficies rígidas',
      description: 'UV DTF de última generación para aplicar en cristal, metal, madera, plástico y otras superficies rígidas. Acabado brillante y gran adherencia.',
      categoryId: categories[1].id,
      productType: ProductType.DTF_UV,
      basePrice: 20.00,
      unit: 'metros',
      minQuantity: 0.25,
      maxQuantity: 50,
      stockStatus: StockStatus.IN_STOCK,
      isFeatured: true,
      specifications: {
        width: '30cm',
        resolution: '1440dpi',
        durability: 'Resistente al agua y UV',
        application: 'Aplicación directa sin calor',
        materials: 'Cristal, metal, madera, plástico, cerámica',
      },
    },
  })

  // Rangos de precio para UV DTF
  await Promise.all([
    prisma.priceRange.upsert({
      where: { id: 'uv-range-1' },
      update: {},
      create: {
        id: 'uv-range-1',
        productId: uvDtf.id,
        fromQty: 0.25,
        toQty: 0.49,
        price: 20.00,
      },
    }),
    prisma.priceRange.upsert({
      where: { id: 'uv-range-2' },
      update: {},
      create: {
        id: 'uv-range-2',
        productId: uvDtf.id,
        fromQty: 0.5,
        toQty: 2,
        price: 18.00,
        discountPct: 10,
      },
    }),
    prisma.priceRange.upsert({
      where: { id: 'uv-range-3' },
      update: {},
      create: {
        id: 'uv-range-3',
        productId: uvDtf.id,
        fromQty: 2.1,
        toQty: null,
        price: 16.00,
        discountPct: 20,
      },
    }),
  ])

  // 5. Crear bonos prepagados
  const bono10m = await prisma.product.upsert({
    where: { slug: 'bono-10-metros' },
    update: {},
    create: {
      name: 'Bono 10 Metros DTF',
      slug: 'bono-10-metros',
      shortDescription: 'Ahorra 15% con este bono de 10 metros',
      description: 'Bono prepagado de 10 metros de DTF textil con 15% de descuento. Válido por 6 meses.',
      categoryId: categories[3].id,
      productType: ProductType.VOUCHER,
      basePrice: 106.25, // 10m * 12.50 (precio con descuento)
      unit: 'bono',
      minQuantity: 1,
      maxQuantity: 10,
      stockStatus: StockStatus.IN_STOCK,
      metadata: {
        meters: 10,
        validityDays: 180,
        discountPct: 15,
      },
    },
  })

  await prisma.priceRange.create({
    data: {
      productId: bono10m.id,
      fromQty: 1,
      toQty: null,
      price: 106.25,
    },
  })

  const bono25m = await prisma.product.upsert({
    where: { slug: 'bono-25-metros' },
    update: {},
    create: {
      name: 'Bono 25 Metros DTF',
      slug: 'bono-25-metros',
      shortDescription: 'Ahorra 20% con este bono de 25 metros',
      description: 'Bono prepagado de 25 metros de DTF textil con 20% de descuento. Válido por 12 meses.',
      categoryId: categories[3].id,
      productType: ProductType.VOUCHER,
      basePrice: 250.00, // 25m * 10 (precio con descuento)
      unit: 'bono',
      minQuantity: 1,
      maxQuantity: 5,
      stockStatus: StockStatus.IN_STOCK,
      isFeatured: true,
      metadata: {
        meters: 25,
        validityDays: 365,
        discountPct: 20,
      },
    },
  })

  await prisma.priceRange.create({
    data: {
      productId: bono25m.id,
      fromQty: 1,
      toQty: null,
      price: 250.00,
    },
  })

  console.log('✅ Products created')

  // 6. Crear plantillas de diseño
  const templates = await Promise.all([
    prisma.template.upsert({
      where: { slug: 'camiseta-basica-texto' },
      update: {},
      create: {
        name: 'Camiseta Básica con Texto',
        slug: 'camiseta-basica-texto',
        description: 'Plantilla simple para camiseta con texto personalizable',
        category: 'textil',
        imageUrl: '/templates/camiseta-texto-preview.png',
        fileUrl: '/templates/camiseta-texto.png',
        thumbnailUrl: '/templates/camiseta-texto-thumb.png',
        dimensions: { width: 3000, height: 3000, dpi: 300 },
        isPremium: false,
        tags: ['camiseta', 'texto', 'basico'],
        isActive: true,
      },
    }),
    prisma.template.upsert({
      where: { slug: 'logo-circular' },
      update: {},
      create: {
        name: 'Logo Circular',
        slug: 'logo-circular',
        description: 'Plantilla para logo circular perfecto para prendas',
        category: 'logos',
        imageUrl: '/templates/logo-circular-preview.png',
        fileUrl: '/templates/logo-circular.png',
        thumbnailUrl: '/templates/logo-circular-thumb.png',
        dimensions: { width: 2000, height: 2000, dpi: 300 },
        isPremium: false,
        tags: ['logo', 'circular', 'marca'],
        isActive: true,
      },
    }),
  ])
  console.log('✅ Templates created')

  // 7. Configuración del sistema
  await Promise.all([
    // General
    prisma.setting.upsert({
      where: { key: 'site_name' },
      update: {},
      create: {
        key: 'site_name',
        value: 'LoviPrintDTF',
        label: 'Nombre del sitio',
        type: 'TEXT',
        category: 'general',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'site_logo' },
      update: {},
      create: {
        key: 'site_logo',
        value: '',
        label: 'URL del logo',
        type: 'TEXT',
        category: 'general',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'contact_email' },
      update: {},
      create: {
        key: 'contact_email',
        value: 'info@loviprintdtf.com',
        label: 'Email de contacto',
        type: 'TEXT',
        category: 'general',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'tax_rate' },
      update: {},
      create: {
        key: 'tax_rate',
        value: '0.21',
        label: 'IVA (%)',
        type: 'NUMBER',
        category: 'general',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'professional_discount' },
      update: {},
      create: {
        key: 'professional_discount',
        value: '30',
        label: 'Descuento profesional (%)',
        type: 'NUMBER',
        category: 'general',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'points_per_euro' },
      update: {},
      create: {
        key: 'points_per_euro',
        value: '10',
        label: 'Puntos por cada euro gastado',
        type: 'NUMBER',
        category: 'general',
      },
    }),

    // Pagos
    prisma.setting.upsert({
      where: { key: 'stripe_test_mode' },
      update: {},
      create: {
        key: 'stripe_test_mode',
        value: 'true',
        label: 'Modo de prueba Stripe',
        type: 'BOOLEAN',
        category: 'payments',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'stripe_publishable_key_test' },
      update: {},
      create: {
        key: 'stripe_publishable_key_test',
        value: '',
        label: 'Stripe Publishable Key (Test)',
        type: 'TEXT',
        category: 'payments',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'stripe_secret_key_test' },
      update: {},
      create: {
        key: 'stripe_secret_key_test',
        value: '',
        label: 'Stripe Secret Key (Test)',
        type: 'TEXT',
        category: 'payments',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'stripe_publishable_key_live' },
      update: {},
      create: {
        key: 'stripe_publishable_key_live',
        value: '',
        label: 'Stripe Publishable Key (Producción)',
        type: 'TEXT',
        category: 'payments',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'stripe_secret_key_live' },
      update: {},
      create: {
        key: 'stripe_secret_key_live',
        value: '',
        label: 'Stripe Secret Key (Producción)',
        type: 'TEXT',
        category: 'payments',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'stripe_webhook_secret' },
      update: {},
      create: {
        key: 'stripe_webhook_secret',
        value: '',
        label: 'Stripe Webhook Secret',
        type: 'TEXT',
        category: 'payments',
      },
    }),

    // Email SMTP
    prisma.setting.upsert({
      where: { key: 'smtp_host' },
      update: {},
      create: {
        key: 'smtp_host',
        value: '',
        label: 'Servidor SMTP',
        type: 'TEXT',
        category: 'email',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'smtp_port' },
      update: {},
      create: {
        key: 'smtp_port',
        value: '587',
        label: 'Puerto SMTP',
        type: 'NUMBER',
        category: 'email',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'smtp_user' },
      update: {},
      create: {
        key: 'smtp_user',
        value: '',
        label: 'Usuario SMTP',
        type: 'TEXT',
        category: 'email',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'smtp_password' },
      update: {},
      create: {
        key: 'smtp_password',
        value: '',
        label: 'Contraseña SMTP',
        type: 'TEXT',
        category: 'email',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'smtp_from_name' },
      update: {},
      create: {
        key: 'smtp_from_name',
        value: 'LoviPrintDTF',
        label: 'Nombre del remitente',
        type: 'TEXT',
        category: 'email',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'smtp_from_email' },
      update: {},
      create: {
        key: 'smtp_from_email',
        value: 'info@loviprintdtf.com',
        label: 'Email del remitente',
        type: 'TEXT',
        category: 'email',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'admin_notification_email' },
      update: {},
      create: {
        key: 'admin_notification_email',
        value: 'admin@loviprintdtf.com',
        label: 'Email para notificaciones admin',
        type: 'TEXT',
        category: 'email',
      },
    }),

    // Almacenamiento
    prisma.setting.upsert({
      where: { key: 'storage_provider' },
      update: {},
      create: {
        key: 'storage_provider',
        value: 'cloudinary',
        label: 'Proveedor de almacenamiento',
        type: 'TEXT',
        category: 'storage',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'cloudinary_cloud_name' },
      update: {},
      create: {
        key: 'cloudinary_cloud_name',
        value: '',
        label: 'Cloudinary Cloud Name',
        type: 'TEXT',
        category: 'storage',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'cloudinary_api_key' },
      update: {},
      create: {
        key: 'cloudinary_api_key',
        value: '',
        label: 'Cloudinary API Key',
        type: 'TEXT',
        category: 'storage',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'cloudinary_api_secret' },
      update: {},
      create: {
        key: 'cloudinary_api_secret',
        value: '',
        label: 'Cloudinary API Secret',
        type: 'TEXT',
        category: 'storage',
      },
    }),

    // Validación de archivos
    prisma.setting.upsert({
      where: { key: 'file_max_size_mb' },
      update: {},
      create: {
        key: 'file_max_size_mb',
        value: '0',
        label: 'Tamaño máximo de archivo (MB, 0 = sin límite)',
        type: 'NUMBER',
        category: 'validation',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'file_min_dpi' },
      update: {},
      create: {
        key: 'file_min_dpi',
        value: '300',
        label: 'DPI mínimo requerido',
        type: 'NUMBER',
        category: 'validation',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'file_allowed_formats' },
      update: {},
      create: {
        key: 'file_allowed_formats',
        value: 'png,pdf',
        label: 'Formatos permitidos (separados por coma)',
        type: 'TEXT',
        category: 'validation',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'file_width_per_meter_cm' },
      update: {},
      create: {
        key: 'file_width_per_meter_cm',
        value: '56',
        label: 'Ancho por metro (cm)',
        type: 'NUMBER',
        category: 'validation',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'file_height_per_meter_cm' },
      update: {},
      create: {
        key: 'file_height_per_meter_cm',
        value: '100',
        label: 'Alto por metro (cm)',
        type: 'NUMBER',
        category: 'validation',
      },
    }),

    // WhatsApp
    prisma.setting.upsert({
      where: { key: 'whatsapp_number' },
      update: {},
      create: {
        key: 'whatsapp_number',
        value: '',
        label: 'Número de WhatsApp (formato: 34612345678)',
        type: 'TEXT',
        category: 'general',
      },
    }),

    // Envíos
    prisma.setting.upsert({
      where: { key: 'shipping_cost' },
      update: {},
      create: {
        key: 'shipping_cost',
        value: '6.00',
        label: 'Coste de envío estándar (€)',
        type: 'NUMBER',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'free_shipping_threshold' },
      update: {},
      create: {
        key: 'free_shipping_threshold',
        value: '100.00',
        label: 'Envío gratis a partir de (€)',
        type: 'NUMBER',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'shipping_provider' },
      update: {},
      create: {
        key: 'shipping_provider',
        value: 'gls',
        label: 'Proveedor de envíos',
        type: 'TEXT',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_enabled' },
      update: {},
      create: {
        key: 'gls_enabled',
        value: 'false',
        label: 'Activar integración con GLS',
        type: 'BOOLEAN',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_api_url' },
      update: {},
      create: {
        key: 'gls_api_url',
        value: 'https://api.gls-spain.es',
        label: 'URL de la API de GLS',
        type: 'TEXT',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_client_id' },
      update: {},
      create: {
        key: 'gls_client_id',
        value: '',
        label: 'GLS Client ID',
        type: 'TEXT',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_username' },
      update: {},
      create: {
        key: 'gls_username',
        value: '',
        label: 'GLS Usuario',
        type: 'TEXT',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_password' },
      update: {},
      create: {
        key: 'gls_password',
        value: '',
        label: 'GLS Contraseña',
        type: 'TEXT',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_sender_name' },
      update: {},
      create: {
        key: 'gls_sender_name',
        value: 'LoviPrintDTF',
        label: 'Nombre del remitente',
        type: 'TEXT',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_sender_address' },
      update: {},
      create: {
        key: 'gls_sender_address',
        value: '',
        label: 'Dirección del remitente',
        type: 'TEXT',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_sender_city' },
      update: {},
      create: {
        key: 'gls_sender_city',
        value: '',
        label: 'Ciudad del remitente',
        type: 'TEXT',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_sender_zipcode' },
      update: {},
      create: {
        key: 'gls_sender_zipcode',
        value: '',
        label: 'Código postal del remitente',
        type: 'TEXT',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_sender_country' },
      update: {},
      create: {
        key: 'gls_sender_country',
        value: 'ES',
        label: 'País del remitente (código ISO)',
        type: 'TEXT',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_sender_phone' },
      update: {},
      create: {
        key: 'gls_sender_phone',
        value: '',
        label: 'Teléfono del remitente',
        type: 'TEXT',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_sender_email' },
      update: {},
      create: {
        key: 'gls_sender_email',
        value: '',
        label: 'Email del remitente',
        type: 'TEXT',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: 'gls_test_mode' },
      update: {},
      create: {
        key: 'gls_test_mode',
        value: 'true',
        label: 'Modo de prueba GLS',
        type: 'BOOLEAN',
        category: 'shipping',
      },
    }),
  ])
  console.log('✅ Settings created')

  // 8. Crear métodos de envío
  await Promise.all([
    prisma.shippingMethod.upsert({
      where: { id: 'shipping-standard' },
      update: {},
      create: {
        id: 'shipping-standard',
        name: 'Envío Estándar 24/48h',
        description: 'Entrega en 24-48 horas laborables',
        price: 6.00,
        estimatedDays: '24-48h',
        isActive: true,
        order: 1,
      },
    }),
    prisma.shippingMethod.upsert({
      where: { id: 'shipping-express' },
      update: {},
      create: {
        id: 'shipping-express',
        name: 'Envío Urgente 24h',
        description: 'Entrega urgente en 24 horas',
        price: 12.00,
        estimatedDays: '24h',
        isActive: true,
        order: 2,
      },
    }),
  ])
  console.log('✅ Shipping methods created')

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
