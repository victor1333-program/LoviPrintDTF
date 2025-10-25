/**
 * System Metrics Endpoint
 * Retorna métricas detalladas del sistema para monitoreo
 *
 * IMPORTANTE: Este endpoint debe estar protegido en producción
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fileLogger } from '@/lib/monitoring/file-logger'
import os from 'os'
import fs from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface SystemMetrics {
  timestamp: string
  system: {
    hostname: string
    platform: string
    arch: string
    uptime: number
    nodeVersion: string
  }
  cpu: {
    model: string
    cores: number
    loadAverage: number[]
    usage?: number
  }
  memory: {
    total: number
    free: number
    used: number
    usedPercent: number
    process: {
      heapUsed: number
      heapTotal: number
      rss: number
      external: number
    }
  }
  disk?: {
    total: number
    used: number
    free: number
    usedPercent: number
  }
  database: {
    connected: boolean
    responseTime?: number
    stats?: {
      users: number
      orders: number
      products: number
    }
  }
  application: {
    version: string
    environment: string
    pid: number
    uptime: number
  }
}

async function getCPUUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startUsage = process.cpuUsage()
    const startTime = Date.now()

    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage)
      const endTime = Date.now()
      const elapsedTime = (endTime - startTime) * 1000 // microsegundos

      const totalUsage = endUsage.user + endUsage.system
      const cpuPercent = (totalUsage / elapsedTime) * 100

      resolve(Math.round(cpuPercent * 100) / 100)
    }, 100)
  })
}

async function getDiskUsage(): Promise<{ total: number; used: number; free: number; usedPercent: number } | null> {
  try {
    const { stdout } = await execAsync("df -k / | tail -1 | awk '{print $2,$3,$4}'")
    const [total, used, free] = stdout.trim().split(' ').map(Number)

    return {
      total: Math.round((total * 1024) / (1024 * 1024 * 1024)), // GB
      used: Math.round((used * 1024) / (1024 * 1024 * 1024)), // GB
      free: Math.round((free * 1024) / (1024 * 1024 * 1024)), // GB
      usedPercent: Math.round((used / total) * 100),
    }
  } catch (error) {
    fileLogger.warn('Metrics', 'Failed to get disk usage', { error })
    return null
  }
}

async function getDatabaseMetrics() {
  try {
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime

    // Obtener estadísticas básicas
    const [users, orders, products] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.product.count(),
    ])

    return {
      connected: true,
      responseTime,
      stats: {
        users,
        orders,
        products,
      },
    }
  } catch (error) {
    fileLogger.error('Metrics', 'Failed to get database metrics', error)
    return {
      connected: false,
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación (opcional - descomentar para producción)
    const authHeader = request.headers.get('authorization')
    const validToken = process.env.METRICS_TOKEN

    if (validToken && authHeader !== `Bearer ${validToken}`) {
      fileLogger.security('Metrics', 'Unauthorized metrics access attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      })

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Recopilar métricas
    const cpus = os.cpus()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memUsage = process.memoryUsage()

    const [cpuUsage, diskUsage, dbMetrics] = await Promise.all([
      getCPUUsage(),
      getDiskUsage(),
      getDatabaseMetrics(),
    ])

    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        nodeVersion: process.version,
      },
      cpu: {
        model: cpus[0]?.model || 'unknown',
        cores: cpus.length,
        loadAverage: os.loadavg(),
        usage: cpuUsage,
      },
      memory: {
        total: Math.round(totalMem / (1024 * 1024 * 1024)), // GB
        free: Math.round(freeMem / (1024 * 1024 * 1024)), // GB
        used: Math.round(usedMem / (1024 * 1024 * 1024)), // GB
        usedPercent: Math.round((usedMem / totalMem) * 100),
        process: {
          heapUsed: Math.round(memUsage.heapUsed / (1024 * 1024)), // MB
          heapTotal: Math.round(memUsage.heapTotal / (1024 * 1024)), // MB
          rss: Math.round(memUsage.rss / (1024 * 1024)), // MB
          external: Math.round(memUsage.external / (1024 * 1024)), // MB
        },
      },
      database: dbMetrics,
      application: {
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'production',
        pid: process.pid,
        uptime: process.uptime(),
      },
    }

    if (diskUsage) {
      metrics.disk = diskUsage
    }

    // Log métricas críticas
    if (metrics.memory.usedPercent > 90) {
      fileLogger.warn('Metrics', 'High memory usage detected', {
        usedPercent: metrics.memory.usedPercent,
      })
    }

    if (metrics.disk && metrics.disk.usedPercent > 90) {
      fileLogger.warn('Metrics', 'High disk usage detected', {
        usedPercent: metrics.disk.usedPercent,
      })
    }

    return NextResponse.json(metrics)
  } catch (error) {
    fileLogger.error('Metrics', 'Failed to collect metrics', error)

    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
