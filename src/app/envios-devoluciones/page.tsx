import { Metadata } from 'next'
import { Truck, Package, RotateCcw, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Envíos y Devoluciones - LoviPrintDTF',
  description: 'Información sobre envíos, plazos de entrega y política de devoluciones de LoviPrintDTF',
}

export default function EnviosDevolucionesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Envíos y Devoluciones</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>

            {/* ENVÍOS */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-semibold text-gray-900">Envíos</h2>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  Plazos de Entrega
                </h3>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500 p-4 rounded-lg mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Entrega Express 24-48h</p>
                  <p className="text-gray-700">
                    Los pedidos realizados antes de las <strong>13:00h</strong> se envían el mismo día.
                    El plazo de entrega es de 24-48 horas laborables en toda la Península Ibérica.
                  </p>
                </div>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                  <li><strong>Península:</strong> 24-48 horas laborables</li>
                  <li><strong>Baleares:</strong> 48-72 horas laborables</li>
                  <li><strong>Canarias, Ceuta y Melilla:</strong> 5-7 días laborables</li>
                </ul>
                <p className="text-sm text-gray-600 italic">
                  * Los plazos son orientativos. Los días festivos y fines de semana no se consideran días laborables.
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-600" />
                  Costes de Envío
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Importe del Pedido</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Coste de Envío</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-gray-700">Menos de 50€</td>
                        <td className="px-4 py-3 text-gray-700">6,50€ (IVA incluido)</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">Entre 50€ y 100€</td>
                        <td className="px-4 py-3 text-gray-700">4,95€ (IVA incluido)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-green-700">Más de 100€</td>
                        <td className="px-4 py-3 font-semibold text-green-700">GRATIS</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mt-4">
                  <p className="flex items-center gap-2 text-green-800 font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    ¡Envío gratis en pedidos superiores a 100€!
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  Seguimiento del Pedido
                </h3>
                <p className="text-gray-700 mb-4">
                  Una vez enviado tu pedido, recibirás un email con:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                  <li>Confirmación de envío</li>
                  <li>Número de seguimiento</li>
                  <li>Enlace para seguir el estado de tu pedido en tiempo real</li>
                  <li>Fecha estimada de entrega</li>
                </ul>
                <p className="text-gray-700 mb-4">
                  También puedes consultar el estado de tu pedido en tu área personal de nuestra web,
                  sección "Mis Pedidos".
                </p>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Empresas de Mensajería</h3>
                <p className="text-gray-700 mb-4">
                  Trabajamos con las principales empresas de mensajería en España para garantizar un servicio
                  rápido y seguro:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                  <li>SEUR</li>
                  <li>MRW</li>
                  <li>Correos Express</li>
                </ul>
              </div>
            </section>

            {/* DEVOLUCIONES */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-semibold text-gray-900">Devoluciones</h2>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Derecho de Desistimiento</h3>
                <p className="text-gray-700 mb-4">
                  Conforme a la Ley de Consumidores y Usuarios, dispones de un plazo de <strong>14 días naturales</strong>
                  desde la recepción del producto para devolver tu pedido sin necesidad de justificación.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
                  <p className="text-blue-900 font-medium mb-2">Condiciones para la devolución:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm ml-4">
                    <li>El producto debe estar en perfecto estado, sin usar y con su embalaje original</li>
                    <li>Debes notificarnos tu intención de devolución por email a info@loviprintdtf.es</li>
                    <li>Los gastos de envío de la devolución corren por cuenta del cliente</li>
                  </ul>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Excepciones al Derecho de Desistimiento
                </h3>
                <p className="text-gray-700 mb-4">
                  No se aceptarán devoluciones en los siguientes casos:
                </p>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-2 text-orange-900 ml-4">
                    <li>
                      <strong>Productos personalizados:</strong> Transferencias DTF con diseños personalizados
                      o hechos a medida según tus especificaciones
                    </li>
                    <li>
                      <strong>Bonos prepagados:</strong> Los bonos ya adquiridos no son reembolsables,
                      aunque pueden utilizarse en cualquier momento sin caducidad
                    </li>
                    <li>
                      <strong>Productos precintados no aptos para devolución:</strong> Por razones de higiene
                      o protección de la salud, si se ha roto el precinto
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Cómo Realizar una Devolución</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Notificación</h4>
                      <p className="text-gray-700">
                        Envía un email a <strong>info@loviprintdtf.es</strong> indicando:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-600 ml-4 mt-1">
                        <li>Número de pedido</li>
                        <li>Producto(s) que deseas devolver</li>
                        <li>Motivo de la devolución (opcional)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Confirmación</h4>
                      <p className="text-gray-700">
                        Te confirmaremos la devolución y te proporcionaremos las instrucciones de envío.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Envío del Producto</h4>
                      <p className="text-gray-700">
                        Envía el producto a la siguiente dirección:
                      </p>
                      <div className="bg-gray-100 p-3 rounded-lg mt-2 text-sm">
                        <p className="font-semibold">LoviPrintDTF</p>
                        <p>Maria Dolores Villena Garcia</p>
                        <p>Calle Antonio Lopes del Oro 7</p>
                        <p>02400 Hellín (Albacete)</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Reembolso</h4>
                      <p className="text-gray-700">
                        Una vez recibido y verificado el producto, procederemos al reembolso en un plazo
                        máximo de <strong>14 días naturales</strong> mediante el mismo método de pago utilizado
                        en la compra.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Productos Defectuosos o Errores en el Envío</h3>
                <p className="text-gray-700 mb-4">
                  Si recibes un producto defectuoso o diferente al que pediste:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                  <li>Contacta con nosotros inmediatamente en <strong>info@loviprintdtf.es</strong></li>
                  <li>Envíanos fotos del producto y del defecto detectado</li>
                  <li>Te enviaremos un reemplazo sin coste adicional</li>
                  <li>Los gastos de envío de la devolución correrán por nuestra cuenta</li>
                </ul>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                  <p className="text-green-900 font-medium">
                    En LoviPrintDTF garantizamos la calidad de nuestros productos. Si hay algún error imputable
                    a nosotros, nos haremos cargo de todos los costes de devolución y reemplazo.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contacto</h2>
              <p className="text-gray-700 mb-4">
                Para cualquier consulta sobre envíos o devoluciones, puedes contactarnos en:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <ul className="list-none space-y-1 text-gray-700">
                  <li><strong>Email:</strong> info@loviprintdtf.es</li>
                  <li><strong>Dirección:</strong> Calle Antonio Lopes del Oro 7, 02400 Hellín (Albacete)</li>
                  <li><strong>Horario de atención:</strong> Lunes a Viernes, 9:00h - 18:00h</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
