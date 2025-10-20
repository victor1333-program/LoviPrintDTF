import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad - LoviPrintDTF',
  description: 'Política de privacidad y protección de datos de LoviPrintDTF',
}

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Responsable del Tratamiento</h2>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <ul className="list-none space-y-1 text-gray-700">
                  <li><strong>Responsable:</strong> Maria Dolores Villena Garcia</li>
                  <li><strong>NIF:</strong> 77598953N</li>
                  <li><strong>Dirección:</strong> Calle Antonio Lopes del Oro 7, Hellín (Albacete)</li>
                  <li><strong>Email:</strong> info@loviprintdtf.es</li>
                  <li><strong>Sitio web:</strong> www.loviprintdtf.es</li>
                </ul>
              </div>
              <p className="text-gray-700 mb-4">
                En cumplimiento del Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016,
                relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales
                (RGPD) y la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los
                derechos digitales (LOPDGDD), le informamos sobre el tratamiento de sus datos personales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Datos Personales que Recopilamos</h2>
              <p className="text-gray-700 mb-4">
                LoviPrintDTF puede recopilar y tratar las siguientes categorías de datos personales:
              </p>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1. Datos de Identificación</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                  <li>Nombre y apellidos</li>
                  <li>NIF/NIE</li>
                  <li>Dirección postal</li>
                  <li>Teléfono</li>
                  <li>Correo electrónico</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2. Datos de Navegación</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                  <li>Dirección IP</li>
                  <li>Tipo de navegador</li>
                  <li>Sistema operativo</li>
                  <li>Páginas visitadas</li>
                  <li>Tiempo de navegación</li>
                  <li>Cookies (ver nuestra <a href="/politica-cookies" className="text-primary-600 hover:text-primary-700 underline">Política de Cookies</a>)</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3. Datos Comerciales</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                  <li>Historial de pedidos</li>
                  <li>Productos adquiridos</li>
                  <li>Bonos y saldo disponible</li>
                  <li>Puntos de fidelización</li>
                  <li>Preferencias de compra</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2.4. Datos Bancarios</h3>
                <p className="text-gray-700 mb-4">
                  Los datos bancarios son procesados directamente por nuestro proveedor de pagos (Stripe) y no son
                  almacenados en nuestros servidores. LoviPrintDTF solo recibe confirmación del pago sin acceso a
                  los datos completos de la tarjeta.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Finalidad del Tratamiento</h2>
              <p className="text-gray-700 mb-4">
                Sus datos personales serán tratados para las siguientes finalidades:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li><strong>Gestión de pedidos:</strong> Procesar sus compras y gestionar los envíos</li>
                <li><strong>Gestión de bonos:</strong> Administrar sus bonos prepagados y saldo disponible</li>
                <li><strong>Comunicaciones comerciales:</strong> Enviarle información sobre productos, ofertas y promociones (con su consentimiento)</li>
                <li><strong>Mejora del servicio:</strong> Analizar el uso del sitio web para mejorar la experiencia de usuario</li>
                <li><strong>Cumplimiento legal:</strong> Cumplir con las obligaciones legales aplicables (facturación, contabilidad, etc.)</li>
                <li><strong>Atención al cliente:</strong> Responder a sus consultas y solicitudes</li>
                <li><strong>Prevención de fraude:</strong> Detectar y prevenir actividades fraudulentas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Legitimación del Tratamiento</h2>
              <p className="text-gray-700 mb-4">
                La base legal para el tratamiento de sus datos personales es:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li><strong>Ejecución del contrato:</strong> Para procesar sus pedidos y gestionar los servicios contratados</li>
                <li><strong>Consentimiento:</strong> Para el envío de comunicaciones comerciales (puede revocarlo en cualquier momento)</li>
                <li><strong>Interés legítimo:</strong> Para la mejora de nuestros servicios y prevención de fraude</li>
                <li><strong>Cumplimiento legal:</strong> Para cumplir con las obligaciones legales (facturación, contabilidad, etc.)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Conservación de los Datos</h2>
              <p className="text-gray-700 mb-4">
                Los datos personales serán conservados durante los siguientes plazos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li><strong>Datos de clientes:</strong> Mientras se mantenga la relación comercial y, posteriormente, durante el plazo de prescripción de las obligaciones legales (generalmente 6 años)</li>
                <li><strong>Datos de navegación:</strong> Máximo 2 años</li>
                <li><strong>Comunicaciones comerciales:</strong> Hasta que revoque su consentimiento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Destinatarios de los Datos</h2>
              <p className="text-gray-700 mb-4">
                Sus datos personales podrán ser comunicados a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li><strong>Proveedores de servicios:</strong> Empresas de hosting, pasarelas de pago (Stripe), empresas de mensajería</li>
                <li><strong>Administraciones públicas:</strong> Cuando sea legalmente obligatorio (Hacienda, etc.)</li>
                <li><strong>Entidades financieras:</strong> Para la gestión de pagos y devoluciones</li>
              </ul>
              <p className="text-gray-700 mb-4">
                No se realizarán transferencias internacionales de datos fuera del Espacio Económico Europeo, salvo las
                necesarias para el funcionamiento de servicios como Stripe (que cuenta con las garantías adecuadas).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Derechos del Usuario</h2>
              <p className="text-gray-700 mb-4">
                Como titular de los datos personales, tiene derecho a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
                <li><strong>Acceso:</strong> Obtener información sobre sus datos personales que estamos tratando</li>
                <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos cuando ya no sean necesarios</li>
                <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos</li>
                <li><strong>Limitación:</strong> Solicitar la limitación del tratamiento de sus datos</li>
                <li><strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado y de uso común</li>
                <li><strong>Revocación del consentimiento:</strong> Retirar el consentimiento en cualquier momento</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Para ejercer estos derechos, puede enviarnos un correo electrónico a <strong>info@loviprintdtf.es</strong>,
                adjuntando copia de su DNI o documento identificativo equivalente.
              </p>
              <p className="text-gray-700 mb-4">
                Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD)
                si considera que el tratamiento de sus datos personales vulnera la normativa aplicable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Seguridad de los Datos</h2>
              <p className="text-gray-700 mb-4">
                LoviPrintDTF ha adoptado las medidas de seguridad técnicas y organizativas necesarias para garantizar
                la seguridad de sus datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado,
                teniendo en cuenta el estado de la tecnología, la naturaleza de los datos almacenados y los riesgos a los
                que están expuestos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Menores de Edad</h2>
              <p className="text-gray-700 mb-4">
                Este sitio web no está dirigido a menores de 14 años. Si es menor de edad, debe contar con el consentimiento
                de sus padres o tutores legales para el uso del sitio web y el tratamiento de sus datos personales.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Modificaciones</h2>
              <p className="text-gray-700 mb-4">
                LoviPrintDTF se reserva el derecho de modificar esta Política de Privacidad para adaptarla a cambios
                legislativos o en nuestros servicios. Las modificaciones se publicarán en esta página con antelación
                suficiente a su aplicación.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contacto</h2>
              <p className="text-gray-700 mb-4">
                Para cualquier consulta sobre esta Política de Privacidad o sobre el tratamiento de sus datos personales,
                puede contactarnos en:
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <ul className="list-none space-y-1 text-gray-700">
                  <li><strong>Email:</strong> info@loviprintdtf.es</li>
                  <li><strong>Dirección:</strong> Calle Antonio Lopes del Oro 7, Hellín (Albacete)</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
