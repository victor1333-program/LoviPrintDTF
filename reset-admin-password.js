const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetAdminPassword() {
  try {
    // Nueva contraseña: admin123
    const newPassword = 'admin123'
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const admin = await prisma.user.update({
      where: { email: 'admin@loviprintdtf.es' },
      data: {
        password: hashedPassword,
      },
    })

    console.log('✅ Contraseña del admin actualizada correctamente')
    console.log('Email:', admin.email)
    console.log('Nueva contraseña: admin123')
    console.log('\n⚠️  Por favor, cambia esta contraseña después de iniciar sesión')

  } catch (error) {
    console.error('❌ Error al actualizar contraseña:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
