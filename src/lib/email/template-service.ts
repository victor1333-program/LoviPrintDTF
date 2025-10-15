import { prisma } from '@/lib/prisma'
import { EmailTemplateType } from '@prisma/client'
import { replaceVariables } from '@/types/email-templates'

/**
 * Obtiene una plantilla de email de la base de datos
 * Prioriza plantillas marcadas como "default" si existen
 */
export async function getEmailTemplate(type: EmailTemplateType) {
  try {
    // Primero buscar plantilla por defecto activa
    let template = await prisma.emailTemplate.findFirst({
      where: {
        type,
        isDefault: true,
        isActive: true,
      },
    })

    // Si no hay default, buscar cualquier plantilla activa de ese tipo
    if (!template) {
      template = await prisma.emailTemplate.findFirst({
        where: {
          type,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    }

    return template
  } catch (error) {
    console.error('Error fetching email template:', error)
    return null
  }
}

/**
 * Renderiza una plantilla de email con los datos proporcionados
 */
export async function renderEmailTemplate(
  type: EmailTemplateType,
  data: Record<string, any>
): Promise<{ subject: string; html: string; text?: string } | null> {
  try {
    const template = await getEmailTemplate(type)

    if (!template) {
      console.warn(`No email template found for type: ${type}`)
      return null
    }

    // Reemplazar variables en el asunto y contenido
    const subject = replaceVariables(template.subject, data)
    const html = replaceVariables(template.htmlContent, data)
    const text = template.textContent ? replaceVariables(template.textContent, data) : undefined

    return {
      subject,
      html,
      text,
    }
  } catch (error) {
    console.error('Error rendering email template:', error)
    return null
  }
}

/**
 * Verifica si existe una plantilla activa para un tipo específico
 */
export async function hasActiveTemplate(type: EmailTemplateType): Promise<boolean> {
  try {
    const count = await prisma.emailTemplate.count({
      where: {
        type,
        isActive: true,
      },
    })

    return count > 0
  } catch (error) {
    console.error('Error checking for active template:', error)
    return false
  }
}
