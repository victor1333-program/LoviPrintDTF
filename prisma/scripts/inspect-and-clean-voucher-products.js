/**
 * Desactiva los productos del catálogo que son bonos (productType=VOUCHER).
 *
 * Estos NO son los bonos reales que compran los clientes — esos viven en el
 * modelo Voucher (sección /admin/bonos). Sin embargo, los Voucher templates
 * apuntan a estos productos vía `Voucher.productId`, así que NO los borramos:
 * solo los desactivamos (isActive=false). Eso los oculta de /admin/productos
 * (que filtra por isActive=true) sin romper el flujo de compra de bonos.
 *
 * Uso:
 *   node prisma/scripts/inspect-and-clean-voucher-products.js          # inspecciona
 *   node prisma/scripts/inspect-and-clean-voucher-products.js --apply  # desactiva
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const apply = process.argv.includes('--apply')
  console.log(`\n=== ${apply ? 'DESACTIVANDO' : 'INSPECCIONANDO'} productos VOUCHER ===\n`)

  const products = await prisma.product.findMany({
    where: { productType: 'VOUCHER' },
    include: {
      _count: {
        select: {
          priceRanges: true,
          cartItems: true,
          orderItems: true,
          vouchers: true,
          discountCodes: true,
        },
      },
    },
  })

  if (products.length === 0) {
    console.log('No hay productos VOUCHER en /admin/productos. Nada que hacer.')
    return
  }

  for (const p of products) {
    console.log(`📦 ${p.name} (slug: ${p.slug}, isActive: ${p.isActive})`)
    console.log(`   priceRanges: ${p._count.priceRanges}, cartItems: ${p._count.cartItems}, orderItems: ${p._count.orderItems}`)
    console.log(`   vouchers (FK voucher.productId): ${p._count.vouchers}, discountCodes: ${p._count.discountCodes}`)
    console.log()
  }

  if (!apply) {
    console.log('🛑 Modo inspección. Ejecuta con --apply para desactivar.\n')
    return
  }

  const result = await prisma.product.updateMany({
    where: { productType: 'VOUCHER', isActive: true },
    data: { isActive: false },
  })

  console.log(`✅ ${result.count} producto(s) VOUCHER desactivado(s).`)
  console.log('   Quedan ocultos en /admin/productos pero los Voucher templates siguen funcionando.\n')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => prisma.$disconnect())
