import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, Printer } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sobre Nosotros */}
          <div>
            <div className="mb-4 relative h-14 sm:h-16 w-40 sm:w-48">
              <Image
                src="/logo.png"
                alt="LoviPrintDTF - Impresión DTF"
                fill
                className="object-contain object-left brightness-0 invert"
              />
            </div>
            <p className="text-sm mb-4">
              Impresión DTF profesional de alta calidad. Desde Hellín, Albacete, ofrecemos el mejor servicio de transferencias DTF para textil.
            </p>
          </div>

          {/* Enlaces Rápidos */}
          <div>
            <h4 className="text-white font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/productos/transfer-dtf" className="hover:text-primary-400 transition-colors">
                  Transfer DTF
                </Link>
              </li>
              <li>
                <Link href="/bonos" className="hover:text-primary-400 transition-colors">
                  Bonos
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary-400 transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-primary-400 transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Información Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Información Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terminos" className="hover:text-primary-400 transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-primary-400 transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/envios" className="hover:text-primary-400 transition-colors">
                  Envíos y Devoluciones
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-primary-400 transition-colors">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-400" />
                <span>Calle Antonio Lopes del Oro 7<br />Hellín, Albacete</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 text-primary-400" />
                <a href="mailto:info@loviprintdtf.es" className="hover:text-primary-400 transition-colors">
                  info@loviprintdtf.es
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-primary-400" />
                <a href="tel:+34614040296" className="hover:text-primary-400 transition-colors">
                  +34 614 04 02 96
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra Inferior */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>
            © {currentYear} LoviPrintDTF
          </p>
        </div>
      </div>
    </footer>
  )
}
