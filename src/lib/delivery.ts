const CUTOFF_HOUR = 13

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    if (!isWeekend(result)) added++
  }
  return result
}

/**
 * Estima la fecha de entrega según la regla de producción:
 *   - Pedido antes de las 13:00 en día laborable → entrega al siguiente día laborable (24h)
 *   - Pedido después de las 13:00 → +2 días laborables (48h, entra en producción del día siguiente)
 *   - Pedido en fin de semana → se trata como realizado el lunes antes de las 13:00
 */
export function estimateDeliveryDate(now: Date = new Date()): Date {
  if (isWeekend(now)) {
    const monday = new Date(now)
    while (monday.getDay() !== 1) {
      monday.setDate(monday.getDate() + 1)
    }
    return addBusinessDays(monday, 1)
  }

  const daysToAdd = now.getHours() < CUTOFF_HOUR ? 1 : 2
  return addBusinessDays(now, daysToAdd)
}

/**
 * Formatea la fecha para mostrar al cliente: "martes 22 de abril"
 */
export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/**
 * Calcula cuántos minutos quedan hasta el cutoff (13:00). Negativo si ya pasó.
 */
export function minutesUntilCutoff(now: Date = new Date()): number {
  if (isWeekend(now)) return -1
  const cutoff = new Date(now)
  cutoff.setHours(CUTOFF_HOUR, 0, 0, 0)
  return Math.round((cutoff.getTime() - now.getTime()) / 60000)
}
