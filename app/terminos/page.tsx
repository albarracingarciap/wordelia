import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
    title: "Términos y condiciones · Wordelia",
    description: "Condiciones de uso del servicio Wordelia.",
};

export default function TerminosPage() {
    return (
        <LegalPage title="Términos y condiciones" lastUpdated="30 de junio de 2026">
            <p>
                Estos términos y condiciones regulan el acceso y uso de Wordelia (en adelante, «el Servicio»),
                titularidad de <strong>[NOMBRE LEGAL DE LA EMPRESA]</strong>, con NIF/CIF <strong>[NIF/CIF]</strong> y
                domicilio en <strong>[DIRECCIÓN COMPLETA]</strong>. Al registrarte o utilizar el Servicio aceptas
                estos términos en su totalidad. Si no estás de acuerdo con ellos, por favor no uses Wordelia.
            </p>

            <h2>1. Objeto del servicio</h2>
            <p>
                Wordelia es una plataforma para lectores que permite organizar tu biblioteca, registrar tus
                lecturas, acceder a análisis literario (guías de discusión y genomas literarios), participar en clubs
                de lectura y gestionar listas de deseos, entre otras funcionalidades.
            </p>
            <p>
                El Servicio se encuentra actualmente en fase beta. Algunas funcionalidades pueden cambiar, estar
                limitadas o no estar disponibles de forma permanente.
            </p>

            <h2>2. Registro y cuenta de usuario</h2>
            <ul>
                <li>Para acceder a determinadas funcionalidades debes crear una cuenta facilitando datos veraces y actualizados.</li>
                <li>Eres responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada desde tu cuenta.</li>
                <li>Debes ser mayor de edad o contar con el consentimiento de tus representantes legales para usar el Servicio.</li>
                <li>Notifícanos de inmediato cualquier uso no autorizado de tu cuenta en <a href="mailto:hola@wordelia.es">hola@wordelia.es</a>.</li>
            </ul>

            <h2>3. Uso aceptable</h2>
            <p>Al usar Wordelia te comprometes a no:</p>
            <ul>
                <li>Utilizar el Servicio con fines ilícitos o contrarios a estos términos.</li>
                <li>Publicar contenido ofensivo, difamatorio, que infrinja derechos de terceros o revele spoilers fuera de los espacios habilitados.</li>
                <li>Suplantar la identidad de otras personas o entidades.</li>
                <li>Intentar acceder de forma no autorizada a los sistemas, interferir en su funcionamiento o extraer datos de forma masiva.</li>
            </ul>

            <h2>4. Contenido del usuario</h2>
            <p>
                Conservas la titularidad del contenido que publicas en Wordelia (notas, reseñas, mensajes en clubs,
                listas, etc.). Al publicarlo, nos concedes una licencia no exclusiva, gratuita y mundial para
                alojarlo y mostrarlo en el Servicio con la finalidad de prestártelo. Eres responsable del contenido
                que compartes y de contar con los derechos necesarios para ello.
            </p>

            <h2>5. Propiedad intelectual</h2>
            <p>
                El Servicio, su marca, su diseño, su software y los materiales de análisis literario elaborados por
                Wordelia (guías de discusión y genomas literarios) están protegidos por derechos de propiedad
                intelectual e industrial y son titularidad de Wordelia o de sus licenciantes. No se permite su
                reproducción, distribución o transformación sin autorización expresa.
            </p>

            <h2>6. Planes, pagos y suscripciones</h2>
            <ul>
                <li>Wordelia ofrece un plan gratuito y planes de pago con funcionalidades adicionales.</li>
                <li>Los precios, condiciones y características de cada plan se indican en la propia plataforma y pueden modificarse, comunicándolo con la debida antelación.</li>
                <li>Determinados recursos (guías y genomas) pueden adquirirse de forma individual o quedar incluidos en clubs o planes de suscripción.</li>
                <li>Las condiciones específicas de facturación, renovación y reembolso se detallarán en el momento de la contratación.</li>
            </ul>

            <h2>7. Clubs y contenido de terceros</h2>
            <p>
                Wordelia permite la creación y participación en clubs de lectura. El contenido generado por otros
                usuarios o por organizaciones de terceros es responsabilidad de quien lo publica. Wordelia no se hace
                responsable de las opiniones o materiales aportados por terceros, sin perjuicio de su retirada cuando
                infrinjan estos términos o la ley.
            </p>

            <h2>8. Disponibilidad y modificaciones del servicio</h2>
            <p>
                Trabajamos para mantener el Servicio disponible y funcionando correctamente, pero no garantizamos su
                disponibilidad ininterrumpida. Podemos modificar, suspender o discontinuar total o parcialmente el
                Servicio, especialmente durante la fase beta, procurando minimizar el impacto para los usuarios.
            </p>

            <h2>9. Limitación de responsabilidad</h2>
            <p>
                El Servicio se presta «tal cual». En la medida permitida por la ley, Wordelia no será responsable de
                los daños indirectos o de la pérdida de datos derivados del uso o de la imposibilidad de uso del
                Servicio. Nada en estos términos excluye la responsabilidad que no pueda limitarse legalmente.
            </p>

            <h2>10. Baja y cancelación</h2>
            <p>
                Puedes dejar de usar Wordelia y eliminar tu cuenta en cualquier momento. Podremos suspender o cancelar
                tu cuenta si incumples estos términos o realizas un uso fraudulento del Servicio.
            </p>

            <h2>11. Protección de datos</h2>
            <p>
                El tratamiento de tus datos personales se rige por nuestra{" "}
                <a href="/privacidad">política de privacidad</a>.
            </p>

            <h2>12. Ley aplicable y jurisdicción</h2>
            <p>
                Estos términos se rigen por la legislación española. Para la resolución de cualquier controversia, las
                partes se someten a los juzgados y tribunales de <strong>[CIUDAD]</strong>, salvo que la normativa de
                consumo establezca otro fuero.
            </p>

            <h2>13. Contacto</h2>
            <p>
                Para cualquier consulta sobre estos términos, escríbenos a{" "}
                <a href="mailto:hola@wordelia.es">hola@wordelia.es</a>.
            </p>
        </LegalPage>
    );
}
