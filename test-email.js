const { PrismaClient } = require('@prisma/client')
const nodemailer = require('nodemailer')

const prisma = new PrismaClient()

async function testEmail() {
  try {
    console.log('🔍 Obteniendo configuración de email desde la base de datos...')

    // Obtener configuración de email
    const settings = await prisma.setting.findMany({
      where: {
        category: 'email',
        key: {
          in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from_name', 'smtp_from_email']
        }
      }
    })

    console.log('\n📧 Configuración encontrada:')
    const config = {}
    settings.forEach(s => {
      config[s.key] = s.value
      // Ocultar password en el log
      if (s.key === 'smtp_password') {
        console.log(`  ${s.key}: ${'*'.repeat(s.value.length)}`)
      } else {
        console.log(`  ${s.key}: ${s.value}`)
      }
    })

    // Verificar que tenemos toda la configuración necesaria
    if (!config.smtp_host || !config.smtp_user || !config.smtp_password) {
      console.error('\n❌ Configuración de email incompleta')
      process.exit(1)
    }

    // Obtener email del administrador
    const adminEmailSetting = await prisma.setting.findUnique({
      where: { key: 'admin_notification_email' }
    })

    const adminEmail = adminEmailSetting?.value || 'info@loviprintdtf.es'
    console.log(`\n📬 Email del administrador: ${adminEmail}`)

    // Crear transporter
    console.log('\n🔧 Creando transporter de nodemailer...')
    const port = parseInt(config.smtp_port || '587')

    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: port,
      secure: port === 465, // true para 465, false para otros puertos
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password,
      },
      debug: true, // Habilitar logs de debug
      logger: true, // Habilitar logger
    })

    console.log('\n✅ Transporter creado exitosamente')
    console.log(`   Host: ${config.smtp_host}`)
    console.log(`   Port: ${port}`)
    console.log(`   Secure: ${port === 465}`)

    // Verificar conexión
    console.log('\n🔌 Verificando conexión con el servidor SMTP...')
    await transporter.verify()
    console.log('✅ Conexión SMTP verificada exitosamente')

    // Enviar email de prueba
    console.log(`\n📤 Enviando email de prueba a ${adminEmail}...`)
    const info = await transporter.sendMail({
      from: `"${config.smtp_from_name}" <${config.smtp_from_email}>`,
      to: adminEmail,
      subject: '✅ Test de Email - LoviPrintDTF',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #667eea;">Test de Email Exitoso</h1>
          <p>Este es un email de prueba del sistema de notificaciones de LoviPrintDTF.</p>
          <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          <p>Si recibes este email, significa que la configuración SMTP está funcionando correctamente.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Configuración utilizada:<br>
            - Host: ${config.smtp_host}<br>
            - Port: ${port}<br>
            - From: ${config.smtp_from_email}
          </p>
        </body>
        </html>
      `,
      text: `Test de Email Exitoso\n\nEste es un email de prueba del sistema de notificaciones de LoviPrintDTF.\n\nFecha: ${new Date().toLocaleString('es-ES')}\n\nSi recibes este email, significa que la configuración SMTP está funcionando correctamente.`
    })

    console.log('\n✅ Email enviado exitosamente!')
    console.log(`   Message ID: ${info.messageId}`)
    console.log(`   Response: ${info.response}`)

    console.log('\n🎉 Test completado con éxito. Revisa la bandeja de entrada de', adminEmail)

  } catch (error) {
    console.error('\n❌ Error en el test de email:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testEmail()
