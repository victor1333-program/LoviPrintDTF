import { prisma } from './src/lib/prisma'
import bcrypt from 'bcryptjs'

async function createCustomer() {
  console.log('🔧 Creando usuario cliente de prueba...\n')

  const customerData = {
    email: 'cliente@test.com',
    name: 'Cliente Test',
    phone: '+34 600 123 456',
    password: 'cliente123',
    role: 'CUSTOMER' as const,
    isProfessional: false,
  }

  try {
    // Verificar si ya existe
    const existing = await prisma.user.findUnique({
      where: { email: customerData.email },
    })

    if (existing) {
      console.log('⚠️  El usuario ya existe. Actualizando contraseña...')
      const hashedPassword = await bcrypt.hash(customerData.password, 10)

      await prisma.user.update({
        where: { email: customerData.email },
        data: {
          password: hashedPassword,
          name: customerData.name,
          phone: customerData.phone,
        },
      })

      console.log('✅ Usuario actualizado correctamente\n')
    } else {
      console.log('➕ Creando nuevo usuario...')
      const hashedPassword = await bcrypt.hash(customerData.password, 10)

      await prisma.user.create({
        data: {
          ...customerData,
          password: hashedPassword,
        },
      })

      console.log('✅ Usuario creado correctamente\n')
    }

    console.log('📋 Credenciales del cliente:')
    console.log('─'.repeat(50))
    console.log(`Email:    ${customerData.email}`)
    console.log(`Password: ${customerData.password}`)
    console.log(`Nombre:   ${customerData.name}`)
    console.log(`Teléfono: ${customerData.phone}`)
    console.log(`Rol:      ${customerData.role}`)
    console.log('─'.repeat(50))
    console.log('\n🌐 URLs para acceder:')
    console.log(`Login:    http://147.93.53.104:3001/login`)
    console.log(`Cuenta:   http://147.93.53.104:3001/account`)
    console.log(`Pedidos:  http://147.93.53.104:3001/account/orders`)
    console.log('\n✨ El cliente puede ahora:')
    console.log('  • Hacer pedidos desde la web')
    console.log('  • Ver su historial de pedidos')
    console.log('  • Gestionar su perfil')
    console.log('  • Ver sus puntos de fidelidad')
    console.log('  • Gestionar sus bonos/vouchers')

  } catch (error) {
    console.error('❌ Error al crear usuario:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createCustomer()
