/**
 * File Logger - Sistema de logging a archivos
 * Escribe logs estructurados a archivos para auditoría y debugging
 */

import fs from 'fs'
import path from 'path'

const LOG_DIR = process.env.LOG_DIR || '/var/log/loviprintdtf'
const MAX_LOG_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_LOG_FILES = 5

export type LogLevel = 'info' | 'warn' | 'error' | 'critical' | 'security'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  category: string
  message: string
  context?: Record<string, any>
  error?: {
    message: string
    stack?: string
    code?: string
  }
  request?: {
    method?: string
    path?: string
    ip?: string
    userAgent?: string
  }
  user?: {
    id?: string
    email?: string
    role?: string
  }
}

class FileLogger {
  private logDir: string
  private currentDate: string

  constructor(logDir: string = LOG_DIR) {
    this.logDir = logDir
    this.currentDate = this.getDateString()
    this.ensureLogDirectory()
  }

  private getDateString(): string {
    const now = new Date()
    return now.toISOString().split('T')[0] // YYYY-MM-DD
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true, mode: 0o755 })
      } catch (error) {
        console.error('Failed to create log directory:', error)
      }
    }
  }

  private getLogFilePath(level: LogLevel): string {
    const date = this.getDateString()

    // Rotar si cambió el día
    if (date !== this.currentDate) {
      this.currentDate = date
      this.rotateOldLogs()
    }

    return path.join(this.logDir, `${level}-${date}.log`)
  }

  private rotateOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir)
      const logFiles = files.filter(f => f.endsWith('.log'))

      // Agrupar por tipo de log
      const filesByType: Record<string, string[]> = {}
      for (const file of logFiles) {
        const type = file.split('-')[0]
        if (!filesByType[type]) filesByType[type] = []
        filesByType[type].push(file)
      }

      // Rotar cada tipo
      for (const [type, typeFiles] of Object.entries(filesByType)) {
        if (typeFiles.length > MAX_LOG_FILES) {
          // Ordenar por fecha (más antiguos primero)
          typeFiles.sort()

          // Eliminar los más antiguos
          const toDelete = typeFiles.slice(0, typeFiles.length - MAX_LOG_FILES)
          for (const file of toDelete) {
            fs.unlinkSync(path.join(this.logDir, file))
          }
        }
      }
    } catch (error) {
      console.error('Failed to rotate logs:', error)
    }
  }

  private checkFileSize(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        if (stats.size > MAX_LOG_SIZE) {
          // Comprimir y rotar
          const timestamp = Date.now()
          const newPath = filePath.replace('.log', `.${timestamp}.log`)
          fs.renameSync(filePath, newPath)
        }
      }
    } catch (error) {
      console.error('Failed to check file size:', error)
    }
  }

  public log(entry: LogEntry) {
    try {
      const filePath = this.getLogFilePath(entry.level)
      this.checkFileSize(filePath)

      const logLine = JSON.stringify(entry) + '\n'

      // Escribir de forma asíncrona (no bloqueante)
      fs.appendFile(filePath, logLine, (err) => {
        if (err) {
          console.error('Failed to write log:', err)
        }
      })

      // También escribir a consola en desarrollo
      if (process.env.NODE_ENV === 'development') {
        const color = this.getColorForLevel(entry.level)
        console.log(color, `[${entry.level.toUpperCase()}] ${entry.category}: ${entry.message}`)
      }
    } catch (error) {
      console.error('Failed to log:', error)
    }
  }

  private getColorForLevel(level: LogLevel): string {
    const colors = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      critical: '\x1b[35m', // Magenta
      security: '\x1b[41m', // Red background
    }
    return colors[level] || '\x1b[0m'
  }

  public info(category: string, message: string, context?: Record<string, any>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      category,
      message,
      context,
    })
  }

  public warn(category: string, message: string, context?: Record<string, any>) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      category,
      message,
      context,
    })
  }

  public error(
    category: string,
    message: string,
    error?: Error | unknown,
    context?: Record<string, any>
  ) {
    const errorInfo = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        }
      : { message: String(error) }

    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      category,
      message,
      error: errorInfo,
      context,
    })
  }

  public critical(
    category: string,
    message: string,
    error?: Error | unknown,
    context?: Record<string, any>
  ) {
    const errorInfo = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        }
      : { message: String(error) }

    this.log({
      timestamp: new Date().toISOString(),
      level: 'critical',
      category,
      message,
      error: errorInfo,
      context,
    })
  }

  public security(
    category: string,
    message: string,
    context?: Record<string, any>
  ) {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'security',
      category,
      message,
      context,
    })
  }

  public logRequest(
    level: LogLevel,
    category: string,
    message: string,
    req?: {
      method?: string
      path?: string
      ip?: string
      userAgent?: string
    },
    user?: {
      id?: string
      email?: string
      role?: string
    },
    context?: Record<string, any>
  ) {
    this.log({
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      request: req,
      user,
      context,
    })
  }
}

// Singleton instance
export const fileLogger = new FileLogger()

// Exportar para uso directo
export default fileLogger
