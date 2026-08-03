import type { Metadata } from "next";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LegalProse } from "@/components/legal/LegalProse";

export const metadata: Metadata = {
    title: "Normas de la comunidad | Wordelia",
    description: "Cómo convivimos en Wordelia: respeto, reseñas honestas y una comunidad lectora sana.",
};

export default function NormasPage() {
    return (
        <div className="space-y-8">
            <SectionHeader
                eyebrow="COMUNIDAD"
                title="Normas de la comunidad"
                subtitle="Cómo convivimos en Wordelia para que sea un espacio seguro y acogedor. Última actualización: 3 de agosto de 2026."
            />

            <div className="mx-auto max-w-[760px]">
                <LegalProse>
                    <p>
                        Wordelia es una comunidad para disfrutar de la lectura sin prisas y en buena compañía. Estas
                        normas explican qué esperamos de quienes participan y qué no tiene cabida, para que sea un
                        espacio seguro y acogedor. Al usar las funciones de comunidad (reseñas, clubs, retos,
                        comentarios y perfiles) aceptas seguirlas.
                    </p>

                    <h2>1. Nuestro espíritu</h2>
                    <p>
                        Nos une el amor por los libros. Trata a los demás como te gustaría que te tratasen: con respeto,
                        curiosidad y generosidad. Se puede discrepar de un libro, de una reseña o de una opinión sin
                        faltar al respeto a la persona que hay detrás.
                    </p>

                    <h2>2. Lo que esperamos de ti</h2>
                    <ul>
                        <li><strong>Respeto</strong> en reseñas, clubs, comentarios y mensajes.</li>
                        <li><strong>Reseñas honestas</strong>: comparte tu opinión sincera sobre el libro, no ataques a autores ni a otros lectores.</li>
                        <li><strong>Marca los spoilers</strong>: usa las opciones para ocultarlos y avisa antes de destripar la trama.</li>
                        <li><strong>Aporta</strong>: contenido relacionado con la lectura y la comunidad.</li>
                        <li><strong>Cuida tu cuenta</strong>: eres responsable de lo que se publica desde ella.</li>
                    </ul>

                    <h2>3. Lo que no se permite</h2>
                    <ul>
                        <li>Acoso, amenazas, insultos o ataques personales.</li>
                        <li>Discurso de odio o discriminación por raza, etnia, género, orientación, religión, discapacidad o cualquier otra condición.</li>
                        <li>Contenido sexual explícito, violento o ilegal, y todo lo que ponga en riesgo a menores.</li>
                        <li>Spam, publicidad no solicitada, estafas o autopromoción reiterada.</li>
                        <li>Suplantar la identidad de otras personas, autores u organizaciones.</li>
                        <li>Compartir archivos o enlaces de descarga de obras protegidas por derechos de autor (piratería).</li>
                        <li>Spoilers sin aviso fuera de los espacios habilitados.</li>
                        <li>Recoger datos de otros usuarios o interferir en el funcionamiento del servicio.</li>
                    </ul>

                    <h2>4. Clubs y retos</h2>
                    <p>
                        Los clubs son espacios de conversación entre lectores; quien los organiza puede establecer
                        normas adicionales dentro del respeto a estas. Los <strong>retos propuestos por la comunidad</strong>{" "}
                        se revisan por el equipo antes de publicarse: por eso pueden tardar en aparecer, y podemos no
                        aprobar los que no encajen con estas normas o con el espíritu de Wordelia.
                    </p>

                    <h2>5. Moderación y consecuencias</h2>
                    <p>
                        Cuando algo incumple estas normas podemos actuar de forma proporcionada: desde un aviso o la
                        retirada del contenido hasta la suspensión temporal o permanente de la cuenta en los casos graves
                        o reincidentes. Procuramos ser justos y tener en cuenta el contexto.
                    </p>

                    <h2>6. Cómo reportar</h2>
                    <p>
                        Si ves algo que no debería estar aquí, ayúdanos a mantener la comunidad sana. En los clubs puedes
                        usar la opción de <strong>reportar</strong>; para cualquier otro caso, escríbenos a{" "}
                        <a href="mailto:hola@wordelia.es">hola@wordelia.es</a> con el enlace o los detalles. Revisamos
                        todos los avisos.
                    </p>

                    <h2>7. Relación con otras condiciones</h2>
                    <p>
                        Estas normas complementan nuestros <a href="/terminos">términos y condiciones</a> y nuestra{" "}
                        <a href="/privacidad">política de privacidad</a>. Podemos actualizarlas para mejorar la
                        convivencia; publicaremos aquí la fecha de la última revisión.
                    </p>

                    <h2>8. Contacto</h2>
                    <p>
                        ¿Dudas o sugerencias sobre estas normas? Escríbenos a{" "}
                        <a href="mailto:hola@wordelia.es">hola@wordelia.es</a>.
                    </p>
                </LegalProse>
            </div>
        </div>
    );
}
