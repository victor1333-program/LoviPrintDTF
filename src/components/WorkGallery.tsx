'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, Maximize2, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'

interface GalleryImage {
  id: number
  src: string
  title: string
  category: string
}

export function WorkGallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  // Imágenes de ejemplo de trabajos DTF
  const galleryImages: GalleryImage[] = [
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&h=800&fit=crop',
      title: 'Camisetas Personalizadas',
      category: 'Textil'
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
      title: 'Hoodies con Logo',
      category: 'Textil'
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop',
      title: 'Diseños Coloridos',
      category: 'DTF'
    },
    {
      id: 4,
      src: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&h=800&fit=crop',
      title: 'Merchandising',
      category: 'Corporativo'
    },
    {
      id: 5,
      src: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=800&fit=crop',
      title: 'Arte Urbano',
      category: 'DTF'
    },
    {
      id: 6,
      src: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=800&fit=crop',
      title: 'Estampación Profesional',
      category: 'Textil'
    }
  ]

  const openModal = (id: number) => {
    setSelectedImage(id)
  }

  const closeModal = () => {
    setSelectedImage(null)
  }

  const nextImage = () => {
    if (selectedImage !== null) {
      const currentIndex = galleryImages.findIndex(img => img.id === selectedImage)
      const nextIndex = (currentIndex + 1) % galleryImages.length
      setSelectedImage(galleryImages[nextIndex].id)
    }
  }

  const prevImage = () => {
    if (selectedImage !== null) {
      const currentIndex = galleryImages.findIndex(img => img.id === selectedImage)
      const prevIndex = currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1
      setSelectedImage(galleryImages[prevIndex].id)
    }
  }

  const selectedImageData = galleryImages.find(img => img.id === selectedImage)

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="warning" className="mb-4">
            <Camera className="h-3 w-3 mr-1" />
            Galería de Trabajos
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nuestros <span className="text-primary-600">Trabajos DTF</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explora algunos de nuestros proyectos más destacados. Calidad profesional en cada impresión.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          {galleryImages.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              onClick={() => openModal(image.id)}
            >
              <img
                src={image.src}
                alt={image.title}
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <Badge className="mb-2 bg-primary-500">{image.category}</Badge>
                  <h3 className="text-white font-bold text-lg">{image.title}</h3>
                </div>

                {/* Icon Maximize */}
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2">
                  <Maximize2 className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            ¿Quieres resultados como estos en tus productos?
          </p>
          <Button size="lg" className="bg-primary-600 hover:bg-primary-700">
            <Sparkles className="h-5 w-5 mr-2" />
            Solicita tu Presupuesto
          </Button>
        </div>
      </div>

      {/* Modal de imagen ampliada */}
      {selectedImage !== null && selectedImageData && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Botón cerrar */}
          <button
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-10"
            onClick={closeModal}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Botón anterior */}
          <button
            className="absolute left-4 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation()
              prevImage()
            }}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          {/* Botón siguiente */}
          <button
            className="absolute right-4 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation()
              nextImage()
            }}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Imagen */}
          <div
            className="relative max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImageData.src}
              alt={selectedImageData.title}
              className="w-full h-full object-contain rounded-lg"
            />

            {/* Info de la imagen */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 rounded-b-lg">
              <Badge className="mb-2 bg-primary-500">{selectedImageData.category}</Badge>
              <h3 className="text-white font-bold text-2xl">{selectedImageData.title}</h3>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
