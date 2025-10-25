/**
 * Health Check Endpoint
 * Verifica el estado de la aplicación y sus servicios
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fileLogger } from '@/lib/monitoring/file-logger'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  services: {
    database: ServiceStatus
    filesystem: ServiceStatus
    memory: ServiceStatus
  }
  version: string
}

interface ServiceStatus {
  status: 'ok' | 'error' | 'warning'
  message?: string
  details?: any
}

async function checkDatabase(): Promise<ServiceStatus> {
  try {
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime

    if (responseTime > 1000) {
      return {
        status: 'warning',
        message: 'Database responding slowly',
        details: { responseTime },
      }
    }

    return {
      status: 'ok',
      details: { responseTime },
    }
  } catch (error) {
    fileLogger.critical('HealthCheck', 'Database health check failed', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

function checkFilesystem(): ServiceStatus {
  try {
    const fs = require('fs')
    const tmpFile = '/tmp/.loviprintdtf-health-check'

    // Intentar escribir un archivo temporal
    fs.writeFileSync(tmpFile, 'test')
    fs.unlinkSync(tmpFile)

    return { status: 'ok' }
  } catch (error) {
    fileLogger.error('HealthCheck', 'Filesystem health check failed', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

function checkMemory(): ServiceStatus {
  try {
    const used = process.memoryUsage()
    const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100

    if (heapUsedPercent > 90) {
      return {
        status: 'error',
        message: 'Memory usage critical',
        details: {
          heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
          percentage: Math.round(heapUsedPercent) + '%',
        },
      }
    }

    if (heapUsedPercent > 80) {
      return {
        status: 'warning',
        message: 'Memory usage high',
        details: {
          heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
          percentage: Math.round(heapUsedPercent) + '%',
        },
      }
    }

    return {
      status: 'ok',
      details: {
        heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
        percentage: Math.round(heapUsedPercent) + '%',
      },
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function GET() {
  try {
    const startTime = Date.now()

    // Ejecutar checks en paralelo
    const [database, filesystem, memory] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkFilesystem()),
      Promise.resolve(checkMemory()),
    ])

    const services = {
      database,
      filesystem,
      memory,
    }

    // Determinar estado general
    const hasError = Object.values(services).some((s) => s.status === 'error')
    const hasWarning = Object.values(services).some((s) => s.status === 'warning')

    const status: 'healthy' | 'degraded' | 'unhealthy' = hasError
      ? 'unhealthy'
      : hasWarning
      ? 'degraded'
      : 'healthy'

    const health: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
      version: process.env.npm_package_version || '0.1.0',
    }

    const responseTime = Date.now() - startTime

    // Log si hay problemas
    if (status !== 'healthy') {
      fileLogger.warn('HealthCheck', `System status: ${status}`, {
        services,
        responseTime,
      })
    }

    // Retornar con código de estado apropiado
    const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    return NextResponse.json(health, { status: httpStatus })
  } catch (error) {
    fileLogger.critical('HealthCheck', 'Health check endpoint failed', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}
