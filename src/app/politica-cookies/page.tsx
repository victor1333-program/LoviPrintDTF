import { Metadata } from 'next'
import { Cookie } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Cookies - LoviPrintDTF',
  description: 'Información sobre el uso de cookies en LoviPrintDTF',
}

export default function PoliticaCookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Cookie className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Política de Cookies</h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. ¿Qué son las cookies?</h2>
              <p className="text-gray-700 mb-4">
                Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (ordenador, tablet o móvil)
                cuando visita un sitio web. Las cookies permiten que el sitio web recuerde sus acciones y preferencias
                (como inicio de sesión, idioma, tamaño de fuente y otras preferencias de visualización) durante un
                período de tiempo, para que no tenga que volver a configurarlas cada vez que regrese al sitio o navegue
                de una página a otra.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. ¿Cómo utilizamos las cookies?</h2>
              <p className="text-gray-700 mb-4">
                En www.loviprintdtf.es utilizamos cookies para:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li>Mejorar la funcionalidad y el rendimiento del sitio web</li>
                <li>Recordar sus preferencias de navegación</li>
                <li>Mantener su sesión iniciada durante su visita</li>
                <li>Gestionar su carrito de compra</li>
                <li>Analizar cómo los usuarios utilizan nuestro sitio web para mejorar nuestros servicios</li>
                <li>Personalizar el contenido y los anuncios</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Tipos de cookies que utilizamos</h2>

              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">3.1. Cookies Estrictamente Necesarias</h3>
                  <p className="text-blue-800 mb-2">
                    Estas cookies son esenciales para que el sitio web funcione correctamente. Sin estas cookies,
                    ciertos servicios no pueden ser proporcionados.
                  </p>
                  <ul className="list-disc list-inside text-sm text-blue-700 ml-4 space-y-1">
                    <li><strong>Sesión de usuario:</strong> Mantiene su sesión iniciada mientras navega por el sitio</li>
                    <li><strong>Carrito de compra:</strong> Guarda los productos que ha añadido al carrito</li>
                    <li><strong>Seguridad:</strong> Protege el sitio web contra ataques maliciosos</li>
                  </ul>
                  <p className="text-sm text-blue-700 mt-2 italic">
                    Estas cookies no se pueden desactivar en nuestros sistemas.
                  </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">3.2. Cookies de Rendimiento y Analíticas</h3>
                  <p className="text-green-800 mb-2">
                    Estas cookies nos permiten contar visitas y fuentes de tráfico para medir y mejorar el
                    rendimiento de nuestro sitio web. Nos ayudan a saber qué páginas son las más y las menos
                    populares y a ver cómo se mueven los visitantes por el sitio.
                  </p>
                  <ul className="list-disc list-inside text-sm text-green-700 ml-4 space-y-1">
                    <li><strong>Google Analytics:</strong> Analiza el comportamiento de los usuarios en el sitio</li>
                    <li><strong>Métricas de rendimiento:</strong> Mide los tiempos de carga y el rendimiento técnico</li>
                  </ul>
                  <p className="text-sm text-green-700 mt-2">
                    Toda la información que recogen estas cookies es agregada y, por lo tanto, anónima.
                  </p>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">3.3. Cookies de Funcionalidad</h3>
                  <p className="text-purple-800 mb-2">
                    Estas cookies permiten que el sitio web recuerde las elecciones que hace (como su nombre de
                    usuario, idioma o la región en la que se encuentra) y proporcionan características mejoradas
                    y más personales.
                  </p>
                  <ul className="list-disc list-inside text-sm text-purple-700 ml-4 space-y-1">
                    <li><strong>Preferencias de usuario:</strong> Guarda sus preferencias de navegación</li>
                    <li><strong>Idioma:</strong> Recuerda el idioma seleccionado</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">3.4. Cookies de Publicidad y Marketing</h3>
                  <p className="text-orange-800 mb-2">
                    Estas cookies pueden ser establecidas a través de nuestro sitio web por nuestros socios
                    publicitarios. Pueden ser utilizadas por esas empresas para construir un perfil de sus
                    intereses y mostrarle anuncios relevantes en otros sitios web.
                  </p>
                  <ul className="list-disc list-inside text-sm text-orange-700 ml-4 space-y-1">
                    <li><strong>Publicidad personalizada:</strong> Muestra anuncios relevantes según sus intereses</li>
                    <li><strong>Remarketing:</strong> Le muestra anuncios de productos que ha visto en nuestro sitio</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cookies de Terceros</h2>
              <p className="text-gray-700 mb-4">
                Algunas cookies son colocadas por servicios de terceros que aparecen en nuestras páginas.
                Utilizamos los siguientes servicios de terceros:
              </p>

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Servicio</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Propósito</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Más información</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-gray-700 font-medium">Google Analytics</td>
                      <td className="px-4 py-3 text-gray-700">Análisis de tráfico web</td>
                      <td className="px-4 py-3 text-gray-700">
                        <a
                          href="https://policies.google.com/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 underline"
                        >
                          Política de Google
                        </a>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 font-medium">Stripe</td>
                      <td className="px-4 py-3 text-gray-700">Procesamiento de pagos</td>
                      <td className="px-4 py-3 text-gray-700">
                        <a
                          href="https://stripe.com/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 underline"
                        >
                          Política de Stripe
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Duración de las cookies</h2>
              <p className="text-gray-700 mb-4">
                Las cookies pueden ser de sesión o persistentes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li>
                  <strong>Cookies de sesión:</strong> Son temporales y se eliminan cuando cierra su navegador.
                  Se utilizan para mantener la sesión activa mientras navega por el sitio.
                </li>
                <li>
                  <strong>Cookies persistentes:</strong> Permanecen en su dispositivo durante un período de tiempo
                  específico o hasta que las elimine manualmente. Se utilizan para recordar sus preferencias en
                  visitas futuras.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cómo gestionar las cookies</h2>
              <p className="text-gray-700 mb-4">
                Puede controlar y/o eliminar las cookies como desee. Puede eliminar todas las cookies que ya están
                en su dispositivo y puede configurar la mayoría de los navegadores para evitar que se coloquen.
              </p>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-4">
                <p className="text-yellow-900 font-medium mb-2">Importante:</p>
                <p className="text-yellow-800 text-sm">
                  Si elimina o deshabilita nuestras cookies, es posible que experimente inconvenientes o que ciertas
                  características del sitio web no funcionen correctamente. Por ejemplo, es posible que no pueda
                  mantener su sesión iniciada o que su carrito de compra se vacíe.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Configuración por navegador:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li>
                  <strong>Google Chrome:</strong>{' '}
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    Instrucciones de Chrome
                  </a>
                </li>
                <li>
                  <strong>Mozilla Firefox:</strong>{' '}
                  <a
                    href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    Instrucciones de Firefox
                  </a>
                </li>
                <li>
                  <strong>Safari:</strong>{' '}
                  <a
                    href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    Instrucciones de Safari
                  </a>
                </li>
                <li>
                  <strong>Microsoft Edge:</strong>{' '}
                  <a
                    href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    Instrucciones de Edge
                  </a>
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Consentimiento</h2>
              <p className="text-gray-700 mb-4">
                Al utilizar nuestro sitio web y aceptar el banner de cookies, usted consiente el uso de cookies
                de acuerdo con esta Política de Cookies. Si no acepta el uso de estas cookies, por favor,
                desactívelas siguiendo las instrucciones de su navegador web.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Modificaciones</h2>
              <p className="text-gray-700 mb-4">
                LoviPrintDTF puede actualizar esta Política de Cookies para reflejar cambios en las tecnologías
                utilizadas o en la normativa aplicable. Le recomendamos revisar esta página periódicamente para
                estar informado sobre cómo utilizamos las cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Más información</h2>
              <p className="text-gray-700 mb-4">
                Para obtener más información sobre cómo protegemos su privacidad, consulte nuestra{' '}
                <a href="/politica-privacidad" className="text-primary-600 hover:text-primary-700 underline font-medium">
                  Política de Privacidad
                </a>.
              </p>
              <p className="text-gray-700 mb-4">
                Para cualquier consulta sobre esta Política de Cookies, puede contactarnos en:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <ul className="list-none space-y-1 text-gray-700">
                  <li><strong>Email:</strong> info@loviprintdtf.es</li>
                  <li><strong>Dirección:</strong> Calle Antonio Lopes del Oro 7, 02400 Hellín (Albacete)</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
