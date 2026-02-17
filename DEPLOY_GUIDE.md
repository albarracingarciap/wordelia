# Guía de Despliegue en Servidor Node.js

Como tu servidor tiene **Node.js 20.19.4**, es perfecto para Next.js 16.

Aquí tienes los pasos exactos para configurar la aplicación en tu panel:

### 1. Preparar archivos para subir
Sube **todo el contenido** de tu carpeta del proyecto al servidor, **EXCEPTO**:
- `node_modules` (se instalarán en el servidor)
- `.next` (se generará al construir en el servidor)
- `.git`

Asegúrate de incluir:
- `package.json` y `package-lock.json`
- `next.config.ts`
- `server.js` (el archivo que creamos)
- Carpeta `app`, `components`, `public`, etc.

### 2. Configuración en el Panel (Crear Aplicación)
Rellena los campos así:

- **Node.js version**: `20.19.4`
- **Application mode**: `Production`
- **Application root**: La carpeta donde subiste los archivos.
- **Application URL**: `wordelia.com`
- **Application startup file**: `server.js`

### 3. Variables de Entorno (Environment Variables)
Añade las siguientes variables (copia los valores de tu `.env.local`):

| Nombre | Valor |
|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | *tu_url_de_supabase* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *tu_clave_anon_publica* |
| `NODE_ENV` | `production` |

### 4. Instalación y Construcción (Build)

Una vez creada la aplicación, deberías ver botones para ejecutar comandos o una consola SSH.

1.  **Instalar dependencias**:
    Ejecuta el botón **"Run NPM Install"** (o escribe `npm install` en la consola).

2.  **Construir la aplicación**:
    Este paso es **CRUCIAL**. Next.js necesita compilar el código antes de arrancar.
    Ejecuta el script de construcción:
    `npm run build`
    *(Si el panel no tiene botón para esto, busca la opción "Run script" y escribe "build").*

3.  **Reiniciar**:
    Dale al botón **"Restart Application"**.

### Solución de Problemas
- Si la aplicación da error al iniciar, revisa los **Logs** (suele haber una pestaña "Logs" o archivo `passenger.log` / `error.log`).
- Si dice "module not found", es que `npm install` no terminó bien.
- Si dice "could not find .next/server...", es que `npm run build` no se ejecutó o falló.
