/**
 * Migración: cambiar los precios de catálogo a la convención "IVA incluido".
 *
 * Qué hace:
 *  - Divide Product.basePrice por 1.21
 *  - Divide PriceRange.price por 1.21
 *  - Divide Voucher.price (plantillas de bono del admin) por 1.21
 *  - Ajusta setting `free_shipping_threshold` a 82.64 (= 100€ IVA incl.)
 *  - Marca flag `prices_are_tax_included = true` para que sea idempotente
 *
 * Qué NO hace:
 *  - NO toca ShippingMethod.price ni `shipping_cost` setting: el sistema actual
 *    no añade IVA al envío, así que esos valores ya son lo que paga el cliente.
 *  - NO toca pedidos, facturas ni stock pasado.
 *
 * Uso:
 *   node scripts/migrate-prices-to-tax-included.js --dry   # solo imprime
 *   node scripts/migrate-prices-to-tax-included.js          # aplica cambios
 */

const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const DIVISOR = 1.21
const FLAG_KEY = 'prices_are_tax_included'

function round2(n) {
  return Math.round(n * 100) / 100
}

function formatRow(label, before, after, displayed) {
  return [
    label.padEnd(40),
    `${before.toFixed(2)}€`.padStart(10),
    '→'.padStart(3),
    `${after.toFixed(2)}€`.padStart(10),
    `  (cliente verá ${displayed.toFixed(2)}€ IVA incl.)`,
  ].join('')
}

async function main() {
  const isDry = process.argv.includes('--dry')
  console.log(`\n=== Migración precios "IVA incluido" ${isDry ? '(DRY RUN)' : '(APLICANDO)'} ===\n`)

  // 1. Idempotencia
  const flag = await prisma.setting.findUnique({ where: { key: FLAG_KEY } })
  if (flag && flag.value === 'true') {
    console.log('⏭️  Migración ya aplicada anteriormente. Nada que hacer.')
    console.log(`   (setting ${FLAG_KEY} = true)`)
    return
  }

  // 2. Cargar estado actual
  const products = await prisma.product.findMany({
    include: { priceRanges: true },
  })
  const vouchers = await prisma.voucher.findMany({
    where: { isTemplate: true },
  })
  const settings = await prisma.setting.findMany({
    where: { key: { in: ['free_shipping_threshold', 'shipping_cost'] } },
  })
  const shippingMethods = await prisma.shippingMethod.findMany()

  // 3. Backup
  if (!isDry) {
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(backupDir, `prices-pre-iva-migration-${stamp}.json`)
    fs.writeFileSync(backupPath, JSON.stringify({ products, vouchers, settings, shippingMethods }, null, 2))
    console.log(`💾 Backup guardado en ${backupPath}\n`)
  }

  // 4. Preparar cambios y mostrar tabla
  console.log('Cambios planificados:\n')
  const changes = []

  for (const p of products) {
    const before = Number(p.basePrice)
    const after = round2(before / DIVISOR)
    const displayed = round2(after * DIVISOR)
    console.log(formatRow(`📦 ${p.name} (basePrice)`, before, after, displayed))
    changes.push({ type: 'product', id: p.id, newBasePrice: after })

    for (const r of p.priceRanges) {
      const rb = Number(r.price)
      const ra = round2(rb / DIVISOR)
      const rd = round2(ra * DIVISOR)
      const rangeLabel = r.toQty
        ? `   tramo ${Number(r.fromQty)}-${Number(r.toQty)}`
        : `   tramo ${Number(r.fromQty)}+`
      console.log(formatRow(rangeLabel, rb, ra, rd))
      changes.push({ type: 'priceRange', id: r.id, newPrice: ra })
    }
  }

  for (const v of vouchers) {
    const before = Number(v.price)
    const after = round2(before / DIVISOR)
    const displayed = round2(after * DIVISOR)
    console.log(formatRow(`🎟️  ${v.name} (voucher.price)`, before, after, displayed))
    changes.push({ type: 'voucher', id: v.id, newPrice: after })
  }

  const thresholdSetting = settings.find((s) => s.key === 'free_shipping_threshold')
  const oldThreshold = thresholdSetting ? Number(thresholdSetting.value) : 100
  console.log(formatRow(`⚙️  free_shipping_threshold`, oldThreshold, 82.64, 100))
  console.log('\n💡 ShippingMethod.price y shipping_cost setting NO se modifican')
  console.log('   (el sistema no aplica IVA al envío; sus valores ya son los que paga el cliente).\n')

  // 5. Aplicar
  if (isDry) {
    console.log('🛑 DRY RUN: no se ha modificado nada. Vuelve a ejecutar sin --dry para aplicar.\n')
    return
  }

  console.log('💾 Aplicando cambios en BD...')
  await prisma.$transaction([
    ...changes
      .filter((c) => c.type === 'product')
      .map((c) =>
        prisma.product.update({ where: { id: c.id }, data: { basePrice: c.newBasePrice } }),
      ),
    ...changes
      .filter((c) => c.type === 'priceRange')
      .map((c) =>
        prisma.priceRange.update({ where: { id: c.id }, data: { price: c.newPrice } }),
      ),
    ...changes
      .filter((c) => c.type === 'voucher')
      .map((c) =>
        prisma.voucher.update({ where: { id: c.id }, data: { price: c.newPrice } }),
      ),
    prisma.setting.upsert({
      where: { key: 'free_shipping_threshold' },
      update: { value: '82.64' },
      create: {
        key: 'free_shipping_threshold',
        value: '82.64',
        label: 'Envío gratis a partir de (€ sin IVA, equivale a 100€ IVA incl.)',
        type: 'NUMBER',
        category: 'shipping',
      },
    }),
    prisma.setting.upsert({
      where: { key: FLAG_KEY },
      update: { value: 'true' },
      create: {
        key: FLAG_KEY,
        value: 'true',
        label: 'Precios de catálogo migrados a IVA incluido',
        type: 'BOOLEAN',
        category: 'general',
      },
    }),
  ])

  console.log('\n✅ Migración completada.')
}

main()
  .catch((e) => {
    console.error('❌ Error en migración:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
