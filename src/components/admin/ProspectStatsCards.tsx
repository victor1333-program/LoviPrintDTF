'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Users, UserCheck, Clock, Calendar } from 'lucide-react'

interface ProspectStats {
  totalActivos: number
  porEstado: {
    verde: number
    amarillo: number
    rojo: number
  }
  pendientesHoy: number
  pendientesSemana: number
}

export function ProspectStatsCards() {
  const [stats, setStats] = useState<ProspectStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/prospects/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    {
      title: 'Total Activos',
      value: stats.totalActivos,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'En Verde',
      value: stats.porEstado.verde,
      icon: UserCheck,
      color: 'bg-green-500'
    },
    {
      title: 'Pendientes Hoy',
      value: stats.pendientesHoy,
      icon: Clock,
      color: stats.pendientesHoy > 0 ? 'bg-red-500' : 'bg-gray-400'
    },
    {
      title: 'Esta Semana',
      value: stats.pendientesSemana,
      icon: Calendar,
      color: 'bg-yellow-500'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
