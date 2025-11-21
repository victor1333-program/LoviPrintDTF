"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent } from "@/components/ui/Card"
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageCircle
} from "lucide-react"
import toast from "react-hot-toast"

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulación de envío
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast.success('¡Mensaje enviado! Te responderemos pronto.')

      // Limpiar formulario
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
    } catch (error) {
      toast.error('Error al enviar el mensaje. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email',
      value: 'info@loviprintdtf.es',
      link: 'mailto:info@loviprintdtf.es',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Teléfono',
      value: '+34 614 051 291',
      link: 'tel:+34614051291',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Dirección',
      value: 'Calle Antonio Lopes del Oro 7, Hellín, Albacete',
      link: 'https://maps.app.goo.gl/xFaTPNsGpKBAb6Ku6',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Horario',
      value: 'Lun-Vie: 10:00-13:30 y 17:30-20:30 | Sáb: 10:00-13:30',
      link: null,
      color: 'from-purple-500 to-purple-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 to-orange-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Necesitas Ayuda?
            </h1>
            <p className="text-xl text-orange-100">
              Estamos aquí para resolver todas tus dudas sobre impresión DTF.
              Contáctanos y te responderemos lo antes posible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 -mt-10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {contactInfo.map((info, i) => (
              <Card key={i} className="hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center mx-auto mb-4 text-white`}>
                    {info.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{info.title}</h3>
                  {info.link ? (
                    <a
                      href={info.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-orange-600 transition-colors"
                    >
                      {info.value}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-600">{info.value}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Form & Map Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Envíanos un Mensaje
              </h2>
              <p className="text-gray-600 mb-8">
                Completa el formulario y nos pondremos en contacto contigo en menos de 24 horas.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Nombre Completo"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Juan Pérez"
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="juan@ejemplo.com"
                  />
                  <Input
                    label="Teléfono"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+34 600 000 000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="presupuesto">Solicitar Presupuesto</option>
                    <option value="pedido">Consulta sobre Pedido</option>
                    <option value="bonos">Información sobre Bonos</option>
                    <option value="tecnico">Consulta Técnica</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Cuéntanos en qué podemos ayudarte..."
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Enviar Mensaje
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Info & Benefits */}
            <div className="space-y-8">
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    ¿Por qué contactarnos?
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-gray-900">Presupuestos Personalizados</h4>
                        <p className="text-sm text-gray-700">
                          Te hacemos un presupuesto a medida según tus necesidades
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-gray-900">Asesoramiento Técnico</h4>
                        <p className="text-sm text-gray-700">
                          Te ayudamos a preparar tus archivos para mejores resultados
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-gray-900">Bonos Empresariales</h4>
                        <p className="text-sm text-gray-700">
                          Condiciones especiales para empresas con alto volumen
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-gray-900">Soporte Prioritario</h4>
                        <p className="text-sm text-gray-700">
                          Respuesta en menos de 24h en días laborables
                        </p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* WhatsApp CTA */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    ¿Necesitas ayuda urgente?
                  </h3>
                  <p className="text-gray-700 mb-6">
                    Escríbenos por WhatsApp y te respondemos al instante
                  </p>
                  <Button
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => window.open('https://wa.me/34614051291', '_blank')}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Abrir WhatsApp
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
