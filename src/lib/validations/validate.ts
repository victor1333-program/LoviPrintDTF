/**
 * Helper para validar requests con Zod en API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { logger } from '@/lib/logger'

/**
 * Valida el body de un request con un schema Zod
 * Retorna los datos validados o una respuesta de error
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data, error: null }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }))

      logger.warn('Validation error in API request', { context: { errors } })

      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Datos inválidos',
            details: errors,
          },
          { status: 400 }
        ),
      }
    }

    if (error instanceof SyntaxError) {
      return {
        data: null,
        error: NextResponse.json(
          { error: 'JSON inválido' },
          { status: 400 }
        ),
      }
    }

    logger.error('Unexpected validation error', error)

    return {
      data: null,
      error: NextResponse.json(
        { error: 'Error al procesar la solicitud' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Valida query params con un schema Zod
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  try {
    const { searchParams } = new URL(request.url)
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    const data = schema.parse(params)
    return { data, error: null }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }))

      logger.warn('Query params validation error', { context: { errors } })

      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Parámetros inválidos',
            details: errors,
          },
          { status: 400 }
        ),
      }
    }

    logger.error('Unexpected query validation error', error)

    return {
      data: null,
      error: NextResponse.json(
        { error: 'Error al procesar parámetros' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Valida path params (desde context.params)
 */
export function validatePathParams<T>(
  params: unknown,
  schema: z.ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  try {
    const data = schema.parse(params)
    return { data, error: null }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }))

      logger.warn('Path params validation error', { context: { errors } })

      return {
        data: null,
        error: NextResponse.json(
          {
            error: 'Parámetros de ruta inválidos',
            details: errors,
          },
          { status: 400 }
        ),
      }
    }

    logger.error('Unexpected path validation error', error)

    return {
      data: null,
      error: NextResponse.json(
        { error: 'Error al procesar parámetros de ruta' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Helper para sanitizar datos sensibles antes de validar
 */
export function sanitizeInput<T extends Record<string, any>>(
  data: T,
  keysToSanitize: string[] = ['password', 'token', 'secret']
): T {
  const sanitized = { ...data } as any

  for (const key of keysToSanitize) {
    if (key in sanitized && typeof sanitized[key] === 'string') {
      // Remover caracteres peligrosos para XSS
      sanitized[key] = sanitized[key]
        .replace(/[<>'"]/g, '')
        .trim()
    }
  }

  return sanitized as T
}
