import type { Metadata } from "next"
import Link from "next/link"
import { BUSINESS, formatAddressOneLine } from "@/lib/business-info"

export const metadata: Metadata = {
  title: "Aviso Legal - LoviPrintDTF",
  description: "Información legal de LoviPrintDTF conforme a la Ley 34/2002 de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE).",
  alternates: { canonical: "https://loviprintdtf.es/aviso-legal" },
  robots: { index: true, follow: true },
}

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Aviso Legal</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Última actualización: {new Date().toLocaleDateString("es-ES")}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Datos identificativos del titular
              </h2>
              <p className="text-gray-700 mb-4">
                En cumplimiento del deber de información recogido en el artículo 10 de la
                Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información
                y de Comercio Electrónico (LSSI-CE), se facilitan a continuación los datos
                identificativos del titular del sitio web{" "}
                <strong>www.loviprintdtf.es</strong>:
              </p>
              <div className="bg-gray-100 p-6 rounded-lg mb-4">
                <ul className="list-none space-y-2 text-gray-700">
                  <li>
                    <strong>Titular:</strong> {BUSINESS.legalName}
                  </li>
                  <li>
                    <strong>Nombre comercial:</strong> {BUSINESS.commercialName}
                  </li>
                  <li>
                    <strong>NIF:</strong> {BUSINESS.nif}
                  </li>
                  <li>
                    <strong>Domicilio fiscal:</strong> {formatAddressOneLine(BUSINESS.fiscalAddress)}, {BUSINESS.fiscalAddress.country}
                  </li>
                  <li>
                    <strong>Tienda física (atención al cliente):</strong> {formatAddressOneLine(BUSINESS.physicalAddress)}, {BUSINESS.physicalAddress.country}
                  </li>
                  <li>
                    <strong>Correo electrónico:</strong>{" "}
                    <a
                      href={`mailto:${BUSINESS.email}`}
                      className="text-primary-600 hover:text-primary-700 underline"
                    >
                      {BUSINESS.email}
                    </a>
                  </li>
                  <li>
                    <strong>Teléfono:</strong>{" "}
                    <a
                      href={`tel:${BUSINESS.phoneE164}`}
                      className="text-primary-600 hover:text-primary-700 underline"
                    >
                      {BUSINESS.phone}
                    </a>
                  </li>
                  <li>
                    <strong>Actividad:</strong> Impresión y venta de transferencias DTF
                    (Direct to Film) para textil y superficies compatibles.
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Objeto
              </h2>
              <p className="text-gray-700 mb-4">
                El presente aviso legal regula el uso del sitio web{" "}
                <strong>www.loviprintdtf.es</strong> (en adelante, el "Sitio Web"), del que
                es titular {BUSINESS.legalName}. La navegación por el Sitio Web
                atribuye la condición de Usuario e implica la aceptación plena y sin
                reservas de todas las disposiciones incluidas en este aviso legal, que
                pueden sufrir modificaciones.
              </p>
              <p className="text-gray-700 mb-4">
                El Usuario se obliga a hacer un uso correcto del Sitio Web de conformidad
                con las leyes, la buena fe, el orden público, los usos del tráfico y el
                presente aviso legal.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Condiciones de uso
              </h2>
              <p className="text-gray-700 mb-4">
                El acceso al Sitio Web es gratuito, salvo por el coste de la conexión a
                través de la red de telecomunicaciones proporcionada por el proveedor
                contratado por los Usuarios. Determinados servicios son exclusivos para
                clientes registrados y su acceso se encuentra restringido.
              </p>
              <p className="text-gray-700 mb-4">
                El Usuario responderá de los daños y perjuicios de toda naturaleza que el
                titular pueda sufrir, directa o indirectamente, como consecuencia del
                incumplimiento de cualquiera de las obligaciones derivadas del aviso
                legal o de la ley en relación con la utilización del Sitio Web.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Propiedad intelectual e industrial
              </h2>
              <p className="text-gray-700 mb-4">
                Todos los contenidos del Sitio Web (textos, fotografías, gráficos,
                imágenes, iconos, tecnología, software, enlaces, contenidos audiovisuales
                o sonoros, diseño gráfico y códigos fuente) son propiedad intelectual de
                María Dolores Villena García o de terceros, sin que puedan entenderse
                cedidos al Usuario ninguno de los derechos de explotación sobre los
                mismos más allá de lo estrictamente necesario para el correcto uso del
                Sitio Web.
              </p>
              <p className="text-gray-700 mb-4">
                Las marcas, nombres comerciales o signos distintivos son titularidad del
                titular o de terceros, sin que pueda entenderse que el acceso al Sitio
                Web atribuya ningún derecho sobre los mismos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Exclusión de garantías y responsabilidad
              </h2>
              <p className="text-gray-700 mb-4">
                El titular no garantiza la disponibilidad y continuidad del funcionamiento
                del Sitio Web. Cuando ello sea razonablemente posible, se advertirá
                previamente de las interrupciones en el funcionamiento del Sitio Web.
              </p>
              <p className="text-gray-700 mb-4">
                El titular tampoco garantiza la utilidad del Sitio Web para la realización
                de ninguna actividad en particular, ni su infalibilidad y, en particular,
                aunque no de modo exclusivo, que los Usuarios puedan efectivamente
                utilizar el Sitio Web, acceder a las distintas páginas web que forman el
                Sitio Web o a aquellas desde las que se prestan los servicios.
              </p>
              <p className="text-gray-700 mb-4">
                El titular excluye, con toda la extensión permitida por el ordenamiento
                jurídico, cualquier responsabilidad por los daños y perjuicios de toda
                naturaleza que puedan deberse a la falta de disponibilidad, continuidad o
                calidad del funcionamiento del Sitio Web y de los servicios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Enlaces a terceros
              </h2>
              <p className="text-gray-700 mb-4">
                El Sitio Web puede contener enlaces a sitios web de terceros. El titular
                no asume responsabilidad alguna por los contenidos, informaciones o
                servicios que pudieran aparecer en dichos sitios, que tendrán
                exclusivamente carácter informativo y que en ningún caso implican
                relación alguna entre el titular y las personas o entidades titulares de
                tales contenidos o de los sitios donde se encuentren.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Protección de datos
              </h2>
              <p className="text-gray-700 mb-4">
                El tratamiento de los datos personales facilitados por los Usuarios se
                realiza conforme a la normativa vigente en materia de protección de
                datos. Puede consultar la información detallada en nuestra{" "}
                <Link
                  href="/privacidad"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Política de Privacidad
                </Link>{" "}
                y en nuestra{" "}
                <Link
                  href="/cookies"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Política de Cookies
                </Link>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Legislación aplicable y jurisdicción
              </h2>
              <p className="text-gray-700 mb-4">
                El presente aviso legal se rige por la legislación española vigente. Para
                la resolución de cualquier controversia que pudiera derivarse del acceso
                al Sitio Web, el Usuario y el titular, con renuncia expresa a cualquier
                otro fuero que pudiera corresponderles, se someten a los Juzgados y
                Tribunales del domicilio del consumidor conforme a la normativa aplicable.
              </p>
              <p className="text-gray-700 mb-4">
                Conforme al Reglamento (UE) 524/2013, los Usuarios consumidores pueden
                acudir a la{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Plataforma Europea de Resolución de Litigios en Línea
                </a>
                .
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Contacto
              </h2>
              <p className="text-gray-700 mb-4">
                Para cualquier consulta relacionada con el presente aviso legal, puede
                contactar con nosotros a través de:
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-gray-700">
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:info@loviprintdtf.es"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    info@loviprintdtf.es
                  </a>
                  <br />
                  <strong>Teléfono:</strong>{" "}
                  <a
                    href="tel:+34614051291"
                    className="text-primary-600 hover:text-primary-700 underline"
                  >
                    +34 614 051 291
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
