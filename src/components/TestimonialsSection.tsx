'use client'

import { useState } from 'react'
import { Star, Quote, ChevronLeft, ChevronRight, Badge as BadgeIcon } from 'lucide-react'
import { Badge } from './ui/Badge'

interface Testimonial {
  id: number
  name: string
  role: string
  company?: string
  image: string
  rating: number
  text: string
  category: 'particular' | 'profesional' | 'empresa'
}

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'María García',
      role: 'Diseñadora Gráfica',
      company: 'Estudio Creativo',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      rating: 5,
      text: 'La calidad de impresión DTF es excepcional. Los colores son vibrantes y la durabilidad es increíble. He lavado las camisetas más de 30 veces y siguen como el primer día. Totalmente recomendable para proyectos profesionales.',
      category: 'profesional'
    },
    {
      id: 2,
      name: 'Carlos Rodríguez',
      role: 'Propietario',
      company: 'Tienda de Merchandising',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      rating: 5,
      text: 'Trabajo con LoviPrintDTF desde hace 6 meses y estoy encantado. El servicio es rápido, los precios competitivos y la calidad siempre constante. Los bonos me permiten ahorrar mucho en mis pedidos mensuales. ¡100% recomendable!',
      category: 'empresa'
    },
    {
      id: 3,
      name: 'Laura Martínez',
      role: 'Organizadora de Eventos',
      image: 'https://randomuser.me/api/portraits/women/68.jpg',
      rating: 5,
      text: 'Necesitaba camisetas personalizadas urgentes para un evento corporativo. LoviPrintDTF las tuvo listas en 24h con una calidad impresionante. El equipo fue muy profesional y atento. Sin duda repetiré para futuros eventos.',
      category: 'profesional'
    },
    {
      id: 4,
      name: 'Pedro Sánchez',
      role: 'Cliente Particular',
      image: 'https://randomuser.me/api/portraits/men/46.jpg',
      rating: 5,
      text: 'Hice un pedido pequeño de solo 3 diseños para regalos personalizados y el trato fue excelente. No hay cantidad mínima y la calidad es profesional. Las fotos quedaron perfectas con colores muy vivos. ¡Súper contento!',
      category: 'particular'
    },
    {
      id: 5,
      name: 'Ana López',
      role: 'Propietaria',
      company: 'Marca de Ropa Deportiva',
      image: 'https://randomuser.me/api/portraits/women/12.jpg',
      rating: 5,
      text: 'La tecnología DTF ha revolucionado mi negocio. Puedo ofrecer diseños personalizados sin inventario y la calidad supera mis expectativas. El sistema de bonos es perfecto para mi volumen de producción mensual.',
      category: 'empresa'
    },
    {
      id: 6,
      name: 'Javier Hernández',
      role: 'Entrenador',
      company: 'Club Deportivo',
      image: 'https://randomuser.me/api/portraits/men/22.jpg',
      rating: 5,
      text: 'Encargamos equipaciones para todo el equipo con logos personalizados. El resultado es profesional, las transferencias aguantan perfectamente el uso deportivo y los lavados frecuentes. Relación calidad-precio imbatible.',
      category: 'profesional'
    }
  ]

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    )
  }

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    )
  }

  const categories = {
    particular: { name: 'Cliente', color: 'bg-blue-100 text-blue-800' },
    profesional: { name: 'Profesional', color: 'bg-purple-100 text-purple-800' },
    empresa: { name: 'Empresa', color: 'bg-green-100 text-green-800' }
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <section className="py-20 bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="warning" className="mb-4">
            <Star className="h-3 w-3 mr-1" />
            Testimonios
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Lo que dicen nuestros <span className="text-primary-600">Clientes</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Miles de clientes satisfechos confían en nuestra calidad DTF
          </p>
        </div>

        {/* Carousel */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Main testimonial card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
              {/* Quote icon background */}
              <div className="absolute top-8 right-8 opacity-5">
                <Quote className="w-32 h-32 text-primary-600" />
              </div>

              <div className="relative z-10">
                {/* Testimonial header */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
                  {/* Image */}
                  <div className="relative">
                    <img
                      src={currentTestimonial.image}
                      alt={currentTestimonial.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary-200 shadow-lg"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-primary-600 rounded-full p-2 shadow-lg">
                      <BadgeIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {currentTestimonial.name}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {currentTestimonial.role}
                      {currentTestimonial.company && (
                        <span className="font-semibold"> · {currentTestimonial.company}</span>
                      )}
                    </p>

                    {/* Category badge */}
                    <Badge className={`${categories[currentTestimonial.category].color} mb-3`}>
                      {categories[currentTestimonial.category].name}
                    </Badge>

                    {/* Rating */}
                    <div className="flex items-center gap-1 justify-center md:justify-start">
                      {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Testimonial text */}
                <div className="mb-8">
                  <Quote className="w-8 h-8 text-primary-400 mb-4" />
                  <p className="text-gray-700 text-lg leading-relaxed italic">
                    "{currentTestimonial.text}"
                  </p>
                </div>

                {/* Navigation dots */}
                <div className="flex justify-center gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex
                          ? 'w-8 bg-primary-600'
                          : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Ver testimonio ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 bg-white hover:bg-primary-50 rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 z-10"
              aria-label="Testimonio anterior"
            >
              <ChevronLeft className="w-6 h-6 text-primary-600" />
            </button>

            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 bg-white hover:bg-primary-50 rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 z-10"
              aria-label="Testimonio siguiente"
            >
              <ChevronRight className="w-6 h-6 text-primary-600" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            <div className="text-center">
              <div className="text-4xl font-black text-primary-600 mb-2">500+</div>
              <div className="text-gray-600">Clientes Satisfechos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-primary-600 mb-2">5000+</div>
              <div className="text-gray-600">Pedidos Completados</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-primary-600 mb-2">4.9</div>
              <div className="text-gray-600">Valoración Media</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-primary-600 mb-2">98%</div>
              <div className="text-gray-600">Clientes Repiten</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
