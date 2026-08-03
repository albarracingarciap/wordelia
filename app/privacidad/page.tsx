import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
    title: "Política de privacidad · Wordelia",
    description: "Cómo Wordelia recopila, usa y protege tus datos personales.",
};

export default function PrivacidadPage() {
    return (
        <LegalPage title="Política de privacidad" lastUpdated="30 de junio de 2026">
            <p>
                En Wordelia nos tomamos en serio tu privacidad. Esta política explica qué datos personales
                recopilamos, con qué finalidad, en qué nos basamos para tratarlos y qué derechos tienes sobre
                ellos. Al usar Wordelia aceptas las prácticas descritas en este documento.
            </p>

            <h2>1. Responsable del tratamiento</h2>
            <p>
                El responsable del tratamiento de tus datos es <strong>Pedro Albarracín Garcia</strong>, con
                NIF/CIF <strong>35081361J</strong> y domicilio en <strong>Calle Silos, 51, Alcalá de Guadaíra, Sevilla.</strong>.
            </p>
            <p>
                Para cualquier cuestión relacionada con tus datos puedes escribirnos a{" "}
                <a href="mailto:hola@wordelia.es">hola@wordelia.es</a>.
            </p>

            <h2>2. Qué datos recopilamos</h2>
            <p>Dependiendo de cómo uses Wordelia, podemos tratar las siguientes categorías de datos:</p>
            <ul>
                <li>
                    <strong>Datos de registro:</strong> nombre, dirección de correo electrónico y contraseña (cifrada)
                    cuando creas una cuenta.
                </li>
                <li>
                    <strong>Datos de perfil:</strong> nombre de usuario, avatar, fecha de nacimiento, géneros
                    favoritos y preferencias de lectura que decidas añadir.
                </li>
                <li>
                    <strong>Actividad de lectura:</strong> libros, sesiones de lectura, notas, citas, emociones,
                    clubs a los que perteneces y listas de deseos.
                </li>
                <li>
                    <strong>Comunicaciones:</strong> los datos que nos facilitas al escribirnos a través del
                    formulario de contacto o al suscribirte a la newsletter.
                </li>
                <li>
                    <strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo y navegador, y datos de uso
                    recogidos mediante cookies y tecnologías similares.
                </li>
            </ul>

            <h2>3. Con qué finalidad tratamos tus datos</h2>
            <ul>
                <li>Crear y gestionar tu cuenta y tu perfil de lector.</li>
                <li>Prestar y mejorar las funcionalidades de Wordelia (biblioteca, clubs, análisis literario, listas de deseos).</li>
                <li>Responder a tus consultas y solicitudes de soporte.</li>
                <li>Enviarte comunicaciones sobre el servicio y, si lo consientes, la newsletter.</li>
                <li>Garantizar la seguridad de la plataforma y prevenir usos fraudulentos.</li>
                <li>Cumplir con nuestras obligaciones legales.</li>
            </ul>

            <h2>4. Base jurídica del tratamiento</h2>
            <ul>
                <li>
                    <strong>Ejecución de un contrato:</strong> el tratamiento necesario para prestarte el servicio
                    que has solicitado al registrarte.
                </li>
                <li>
                    <strong>Consentimiento:</strong> para el envío de la newsletter y el uso de cookies no esenciales.
                    Puedes retirarlo en cualquier momento.
                </li>
                <li>
                    <strong>Interés legítimo:</strong> para mejorar el servicio, garantizar su seguridad y prevenir
                    abusos.
                </li>
                <li>
                    <strong>Obligación legal:</strong> cuando una norma nos exija conservar o comunicar determinados
                    datos.
                </li>
            </ul>

            <h2>5. Conservación de los datos</h2>
            <p>
                Conservamos tus datos mientras mantengas tu cuenta activa y, una vez la elimines, durante el tiempo
                necesario para cumplir con nuestras obligaciones legales y atender posibles responsabilidades. Los
                datos asociados a la newsletter se conservan hasta que te das de baja.
            </p>

            <h2>6. Destinatarios y encargados del tratamiento</h2>
            <p>
                No vendemos tus datos. Para prestar el servicio nos apoyamos en proveedores que actúan como
                encargados del tratamiento de tales datos.
            </p>
            
            <p>
                Algunos proveedores pueden estar ubicados fuera del Espacio Económico Europeo; en tales casos nos
                aseguramos de que existan garantías adecuadas para la transferencia internacional de datos.
            </p>

            <h2>7. Tus derechos</h2>
            <p>
                Puedes ejercer en cualquier momento los derechos de acceso, rectificación, supresión, oposición,
                limitación del tratamiento y portabilidad de tus datos, así como retirar el consentimiento prestado.
                Para ello, escríbenos a <a href="mailto:hola@wordelia.es">hola@wordelia.es</a>.
            </p>
            <p>
                Si consideras que no hemos atendido correctamente tu solicitud, tienes derecho a presentar una
                reclamación ante la Agencia Española de Protección de Datos (
                <a href="https://www.aepd.es" target="_blank" rel="noreferrer">www.aepd.es</a>).
            </p>

            <h2>8. Cookies</h2>
            <p>
                Wordelia utiliza cookies propias y de terceros. Puedes consultar el detalle en nuestra{" "}
                <a href="/cookies">política de cookies</a>.
            </p>

            <h2>9. Seguridad</h2>
            <p>
                Aplicamos medidas técnicas y organizativas razonables para proteger tus datos frente a accesos no
                autorizados, pérdida o alteración. Las contraseñas se almacenan siempre cifradas.
            </p>

            <h2>10. Cambios en esta política</h2>
            <p>
                Podemos actualizar esta política para reflejar cambios en el servicio o en la normativa aplicable. Si
                los cambios son significativos, te lo notificaremos por los medios oportunos. La fecha de la última
                actualización figura al inicio de este documento.
            </p>

            <h2>11. Contacto</h2>
            <p>
                Si tienes cualquier duda sobre esta política o sobre el tratamiento de tus datos, escríbenos a{" "}
                <a href="mailto:hola@wordelia.es">hola@wordelia.es</a>.
            </p>
        </LegalPage>
    );
}
