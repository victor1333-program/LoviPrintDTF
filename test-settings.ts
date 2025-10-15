import { prisma } from './src/lib/prisma'

async function testSettings() {
  console.log('🔍 Verificando configuraciones en la base de datos...\n')

  // Obtener todas las configuraciones
  const settings = await prisma.setting.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  })

  console.log(`Total de configuraciones: ${settings.length}\n`)

  // Agrupar por categoría
  const grouped = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, typeof settings>)

  // Mostrar por categoría
  for (const [category, items] of Object.entries(grouped)) {
    console.log(`📁 ${category.toUpperCase()} (${items.length} items)`)
    items.forEach(item => {
      const value = item.value.length > 50 ? item.value.substring(0, 50) + '...' : item.value
      console.log(`   - ${item.key}: ${value}`)
    })
    console.log('')
  }

  // Verificar configuraciones críticas
  console.log('✅ Configuraciones críticas:')
  const critical = ['site_name', 'contact_email', 'tax_rate', 'shipping_cost']
  for (const key of critical) {
    const setting = settings.find(s => s.key === key)
    console.log(`   - ${key}: ${setting ? '✓ Existe' : '✗ No encontrado'}`)
  }

  await prisma.$disconnect()
}

testSettings().catch(console.error)
