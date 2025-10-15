import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    // Solo admins pueden ver configuraciones sensibles
    const isAdmin = session?.user?.role === 'ADMIN'

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const key = searchParams.get('key')

    // Si solicitan una clave específica
    if (key) {
      const setting = await prisma.setting.findUnique({
        where: { key },
      })

      if (!setting) {
        return NextResponse.json({ value: null })
      }

      // Solo retornar configuraciones públicas o si es admin
      const publicSettings = [
        'site_name',
        'site_logo',
        'whatsapp_number',
        'whatsapp_enabled',
        'whatsapp_message',
        'whatsapp_greeting',
        'contact_email'
      ]
      if (!isAdmin && !publicSettings.includes(key)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      return NextResponse.json(setting)
    }

    // Si solicitan por categoría
    if (category) {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const settings = await prisma.setting.findMany({
        where: { category },
        orderBy: { key: 'asc' },
      })

      return NextResponse.json(settings)
    }

    // Todas las configuraciones (solo admin)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.setting.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    })

    // Agrupar por categoría
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }
      acc[setting.category].push(setting)
      return acc
    }, {} as Record<string, typeof settings>)

    return NextResponse.json(grouped)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { key, value, label, type, category } = body

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      create: {
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        label: label || key,
        type: type || 'TEXT',
        category: category || 'general',
      },
      update: {
        value: typeof value === 'string' ? value : JSON.stringify(value),
        label,
        type,
        category,
      },
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Error updating setting:', error)
    return NextResponse.json({ error: 'Error updating setting' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()

    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Soportar tanto actualización individual como en masa
    if (body.settings && Array.isArray(body.settings)) {
      // Actualizar en masa
      const promises = body.settings.map((s: any) =>
        prisma.setting.upsert({
          where: { key: s.key },
          create: {
            key: s.key,
            value: typeof s.value === 'string' ? s.value : JSON.stringify(s.value),
            label: s.label || s.key,
            type: s.type || 'TEXT',
            category: s.category || 'general',
          },
          update: {
            value: typeof s.value === 'string' ? s.value : JSON.stringify(s.value),
          },
        })
      )

      await Promise.all(promises)
      return NextResponse.json({ success: true })
    } else if (body.key) {
      // Actualizar individual
      const { key, value, label, type, category } = body

      if (!key || value === undefined) {
        return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
      }

      const setting = await prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          label: label || key,
          type: type || 'TEXT',
          category: category || 'email',
        },
        update: {
          value: typeof value === 'string' ? value : JSON.stringify(value),
        },
      })

      return NextResponse.json(setting)
    } else {
      return NextResponse.json(
        { error: 'Either settings array or individual key/value required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Error updating settings' }, { status: 500 })
  }
}
