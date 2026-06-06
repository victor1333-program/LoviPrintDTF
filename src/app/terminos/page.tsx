import { Metadata } from 'next'
import { BUSINESS, formatAddressOneLine } from '@/lib/business-info'

export const metadata: Metadata = {
  title: 'Términos y Condiciones - LoviPrintDTF',
  description: 'Términos y condiciones de uso de LoviPrintDTF',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Información General</h2>
              <p className="text-gray-700 mb-4">
                El presente documento establece los Términos y Condiciones de uso del sitio web {BUSINESS.website},
                propiedad de {BUSINESS.legalName} (en adelante, "{BUSINESS.commercialName}").
              </p>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="font-semibold text-gray-900">Datos del titular:</p>
                <ul className="list-none mt-2 space-y-1 text-gray-700">
                  <li><strong>Nombre:</strong> {BUSINESS.legalName}</li>
                  <li><strong>NIF:</strong> {BUSINESS.nif}</li>
                  <li><strong>Domicilio fiscal:</strong> {formatAddressOneLine(BUSINESS.fiscalAddress)}</li>
                  <li><strong>Email:</strong> {BUSINESS.email}</li>
                  <li><strong>Teléfono:</strong> {BUSINESS.phone}</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Objeto y Ámbito de Aplicación</h2>
              <p className="text-gray-700 mb-4">
                LoviPrintDTF se dedica a la impresión y venta de transferencias DTF (Direct to Film) para textil
                y otras superficies. Estos términos regulan el acceso y uso del sitio web, así como la compra de
                productos y servicios ofrecidos.
              </p>
              <p className="text-gray-700 mb-4">
                El uso de este sitio web implica la aceptación plena y sin reservas de todas las disposiciones
                incluidas en estos Términos y Condiciones.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Productos y Servicios</h2>
              <p className="text-gray-700 mb-4">
                LoviPrintDTF ofrece los siguientes productos y servicios:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li>Impresión DTF personalizada por metros</li>
                <li>Bonos prepagados de metros DTF</li>
                <li>Transferencias DTF para textil</li>
                <li>Diseños personalizados (bajo consulta)</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Todos los productos están sujetos a disponibilidad. LoviPrintDTF se reserva el derecho de
                modificar, suspender o discontinuar cualquier producto o servicio sin previo aviso.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Precios y Pago</h2>
              <p className="text-gray-700 mb-4">
                Los precios mostrados en el sitio web incluyen el IVA español (21%) salvo que se indique lo contrario.
              </p>
              <p className="text-gray-700 mb-4">
                LoviPrintDTF se reserva el derecho de modificar los precios en cualquier momento, aunque se respetarán
                los precios vigentes en el momento de realizar el pedido.
              </p>
              <p className="text-gray-700 mb-4">
                Formas de pago aceptadas:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li>Tarjeta de crédito/débito (a través de Stripe)</li>
                <li>Bonos prepagados</li>
                <li>Transferencia bancaria (para pedidos superiores a 500€)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Proceso de Compra</h2>
              <p className="text-gray-700 mb-4">
                Para realizar una compra, el usuario deberá:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li>Seleccionar los productos deseados</li>
                <li>Añadirlos al carrito de compra</li>
                <li>Rellenar el formulario de pedido con sus datos</li>
                <li>Elegir el método de pago</li>
                <li>Confirmar el pedido</li>
              </ol>
              <p className="text-gray-700 mb-4">
                Una vez confirmado el pedido y efectuado el pago, el usuario recibirá un email de confirmación
                con los detalles del pedido y el número de seguimiento (cuando esté disponible).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Bonos Prepagados</h2>
              <p className="text-gray-700 mb-4">
                Los bonos prepagados de LoviPrintDTF tienen las siguientes características:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li><strong>No caducan:</strong> Pueden utilizarse en cualquier momento</li>
                <li><strong>No son reembolsables:</strong> Una vez adquiridos, no se devuelve el importe</li>
                <li><strong>Uso flexible:</strong> Pueden utilizarse en múltiples pedidos hasta agotar el saldo</li>
                <li><strong>Personales e intransferibles:</strong> Solo puede usarlos el titular de la cuenta</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Diseños Personalizados</h2>
              <p className="text-gray-700 mb-4">
                Al subir diseños personalizados para su impresión, el usuario:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li>Garantiza ser el titular de los derechos de autor del diseño</li>
                <li>Exime a LoviPrintDTF de cualquier responsabilidad derivada del uso de imágenes protegidas</li>
                <li>Acepta que LoviPrintDTF puede rechazar diseños que infrinjan derechos de terceros o contengan contenido inapropiado</li>
                <li>Autoriza a LoviPrintDTF a reproducir el diseño únicamente para la ejecución del pedido</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Derecho de Desistimiento</h2>
              <p className="text-gray-700 mb-4">
                Como consumidor o usuaria, dispones de un plazo de 14 días naturales desde la recepción del
                producto para desistir del contrato sin necesidad de justificación, conforme al Real Decreto
                Legislativo 1/2007, de 16 de noviembre, por el que se aprueba el texto refundido de la Ley
                General para la Defensa de los Consumidores y Usuarios.
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Importante &mdash; productos personalizados:</strong> el artículo 103.c) del RDL 1/2007
                excluye del derecho de desistimiento aquellos bienes confeccionados conforme a las
                especificaciones del consumidor o claramente personalizados. Por la propia naturaleza del
                servicio, las transferencias DTF se imprimen a medida a partir del diseño que tú nos envías,
                por lo que <strong>no es posible aceptar la devolución de un trabajo personalizado</strong>.
                Sabemos que esto puede generar dudas, así que si tienes cualquier consulta antes de comprar
                contáctanos y te ayudamos a confirmar que el resultado va a ser el que esperas.
              </p>
              <p className="text-gray-700 mb-4">
                Esta excepción <strong>no afecta</strong> a tu derecho a recibir un producto en perfecto estado:
                si llega defectuoso o no se corresponde con lo que pediste, lo reimprimimos o te devolvemos el
                importe (ver sección 9. Garantía y Responsabilidad).
              </p>
              <p className="text-gray-700 mb-4">
                Otras excepciones aplicables a nuestro servicio:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li>Bonos prepagados ya utilizados parcial o totalmente.</li>
                <li>Pedidos en producción cuya impresión ya se haya iniciado en máquina.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Garantía y Responsabilidad</h2>
              <p className="text-gray-700 mb-4">
                LoviPrintDTF garantiza la calidad de sus productos. En caso de defectos de fabricación o errores
                en la impresión imputables a LoviPrintDTF, el cliente podrá solicitar:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li>Reimpresión del producto sin coste adicional</li>
                <li>Devolución del importe pagado</li>
              </ul>
              <p className="text-gray-700 mb-4">
                LoviPrintDTF no se hace responsable de:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li>Errores en el diseño original proporcionado por el cliente</li>
                <li>Diferencias de color debidas a la calibración de pantallas</li>
                <li>Aplicaciones incorrectas de las transferencias por parte del cliente</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Protección de Datos</h2>
              <p className="text-gray-700 mb-4">
                LoviPrintDTF se compromete a proteger la privacidad de sus usuarios conforme al Reglamento General
                de Protección de Datos (RGPD) y la legislación española aplicable. Para más información, consulte
                nuestra <a href="/privacidad" className="text-primary-600 hover:text-primary-700 underline">
                Política de Privacidad</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Modificaciones</h2>
              <p className="text-gray-700 mb-4">
                LoviPrintDTF se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento.
                Las modificaciones entrarán en vigor desde su publicación en el sitio web. Se recomienda revisar
                periódicamente esta página.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Legislación Aplicable</h2>
              <p className="text-gray-700 mb-4">
                Estos Términos y Condiciones se rigen por la legislación española. Para cualquier controversia,
                las partes se someten a los juzgados y tribunales del domicilio del consumidor.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Para cualquier consulta relacionada con estos Términos y Condiciones, puede contactarnos en:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <ul className="list-none space-y-1 text-gray-700">
                  <li><strong>Email:</strong> {BUSINESS.email}</li>
                  <li><strong>Teléfono:</strong> {BUSINESS.phone}</li>
                  <li><strong>Dirección fiscal:</strong> {formatAddressOneLine(BUSINESS.fiscalAddress)}</li>
                  <li><strong>Tienda física:</strong> {formatAddressOneLine(BUSINESS.physicalAddress)}</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
