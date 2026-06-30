import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
    title: "Política de cookies · Wordelia",
    description: "Qué cookies utiliza Wordelia y cómo puedes gestionarlas.",
};

export default function CookiesPage() {
    return (
        <LegalPage title="Política de cookies" lastUpdated="30 de junio de 2026">
            <p>
                Esta política de cookies explica qué son las cookies, cuáles utiliza Wordelia, con qué finalidad y
                cómo puedes gestionarlas. Forma parte de nuestra{" "}
                <a href="/privacidad">política de privacidad</a>.
            </p>

            <h2>1. ¿Qué son las cookies?</h2>
            <p>
                Una cookie es un pequeño archivo de texto que un sitio web almacena en tu dispositivo cuando lo
                visitas. Las cookies permiten que el sitio recuerde tus acciones y preferencias (como el inicio de
                sesión) durante un tiempo, para que no tengas que volver a configurarlas cada vez. También se usan
                tecnologías similares, como el almacenamiento local del navegador, a las que se aplica esta política.
            </p>

            <h2>2. ¿Por qué las usamos?</h2>
            <p>Wordelia utiliza cookies y tecnologías similares para:</p>
            <ul>
                <li>Mantener tu sesión iniciada y garantizar el funcionamiento seguro de la plataforma.</li>
                <li>Recordar tus preferencias y configuración.</li>
                <li>Entender cómo se usa el servicio para mejorarlo (analítica).</li>
            </ul>

            <h2>3. Tipos de cookies que utilizamos</h2>
            <h3>Cookies técnicas o necesarias</h3>
            <p>
                Imprescindibles para el funcionamiento del sitio y la prestación del servicio (por ejemplo, para
                mantener la sesión iniciada). No requieren consentimiento.
            </p>
            <h3>Cookies de preferencias</h3>
            <p>Permiten recordar opciones que personalizan tu experiencia.</p>
            <h3>Cookies analíticas</h3>
            <p>
                Nos ayudan a conocer de forma agregada cómo interactúan los usuarios con Wordelia. Se instalan solo
                con tu consentimiento.
            </p>

            <h2>4. Cookies utilizadas</h2>
            <p>A continuación se detallan las principales cookies (la relación puede actualizarse):</p>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Cookie</th>
                            <th>Proveedor</th>
                            <th>Finalidad</th>
                            <th>Tipo</th>
                            <th>Duración</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>sb-access-token / sb-refresh-token</td>
                            <td>Supabase</td>
                            <td>Mantener la sesión del usuario autenticado.</td>
                            <td>Técnica</td>
                            <td>Sesión / [DURACIÓN]</td>
                        </tr>
                        <tr>
                            <td>[COOKIE_CONSENTIMIENTO]</td>
                            <td>Wordelia</td>
                            <td>Recordar tus preferencias sobre cookies.</td>
                            <td>Preferencias</td>
                            <td>[DURACIÓN]</td>
                        </tr>
                        <tr>
                            <td>[COOKIE_ANALITICA]</td>
                            <td>[PROVEEDOR DE ANALÍTICA]</td>
                            <td>Medir el uso de la plataforma de forma agregada.</td>
                            <td>Analítica</td>
                            <td>[DURACIÓN]</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>5. Cookies de terceros</h2>
            <p>
                Algunos servicios que integramos pueden instalar sus propias cookies. Te recomendamos consultar las
                políticas de privacidad y cookies de dichos terceros para conocer cómo tratan tu información.
            </p>

            <h2>6. ¿Cómo gestionar o desactivar las cookies?</h2>
            <p>
                Puedes aceptar o rechazar las cookies no esenciales a través de nuestro panel de configuración cuando
                esté disponible. Además, puedes configurar tu navegador para bloquear o eliminar cookies en cualquier
                momento. Ten en cuenta que desactivar ciertas cookies puede afectar al funcionamiento del servicio.
            </p>
            <ul>
                <li>
                    <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer">Google Chrome</a>
                </li>
                <li>
                    <a href="https://support.mozilla.org/es/kb/Borrar%20cookies" target="_blank" rel="noreferrer">Mozilla Firefox</a>
                </li>
                <li>
                    <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer">Safari</a>
                </li>
                <li>
                    <a href="https://support.microsoft.com/es-es/microsoft-edge" target="_blank" rel="noreferrer">Microsoft Edge</a>
                </li>
            </ul>

            <h2>7. Cambios en esta política</h2>
            <p>
                Podemos actualizar esta política de cookies para reflejar cambios en las cookies que utilizamos o por
                motivos legales o técnicos. La fecha de la última actualización figura al inicio de este documento.
            </p>

            <h2>8. Contacto</h2>
            <p>
                Si tienes dudas sobre el uso de cookies en Wordelia, escríbenos a{" "}
                <a href="mailto:hola@wordelia.es">hola@wordelia.es</a>.
            </p>
        </LegalPage>
    );
}
