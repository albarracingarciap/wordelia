# Guía de Migración de Base de Datos

Esta carpeta contiene todos los scripts necesarios para migrar la base de datos de Wordelia desde Supabase gratuito a una instancia self-hosted.

## 📋 Pre-requisitos

1. Node.js instalado
2. Acceso a la instancia self-hosted de Supabase
3. Credenciales configuradas en `.env.migration`

## 🚀 Proceso de Migración

### Paso 1: Configurar Credenciales

Edita el archivo `.env.migration` y completa las credenciales faltantes (si las hay):

```bash
nano .env.migration
```

### Paso 2: Instalar Dependencias

```bash
cd ../..
npm install @supabase/supabase-js dotenv
```

### Paso 3: Exportar Datos de la Instancia Actual

```bash
# Exportar datos de las tablas
node supabase/migration/1_export_data.js

# Exportar archivos de storage
node supabase/migration/2_export_storage.js
```

**Resultado esperado:** Archivos JSON en `supabase/migration/exports/`

### Paso 4: Configurar Schema en Nueva Instancia

Para aplicar el schema, necesitas acceso directo a PostgreSQL.

**Opción A: Si tienes acceso SSH a tu servidor**

```bash
# Conectar al servidor y ejecutar
ssh tu-servidor
cd /ruta/a/supabase
psql -h db -U postgres -d postgres -f /ruta/a/wordelia-beta/supabase/migration/3_setup_new_instance.sql
```

**Opción B: Si usas Docker localmente**

```bash
# Copiar el script al contenedor
docker cp supabase/migration/3_setup_new_instance.sql supabase-db:/tmp/

# Ejecutar dentro del contenedor
docker exec -it supabase-db psql -U postgres -d postgres -f /tmp/3_setup_new_instance.sql
```

**Opción C: Ejecutar desde tu máquina (si tienes acceso remoto)**

Primero, edita `.env.migration` con la IP pública de tu servidor en `POSTGRES_HOST`, luego:

```bash
# Asegúrate de tener psql instalado
psql -h supabase.wordelia.es -U postgres -d postgres -p 5432 -f supabase/migration/3_setup_new_instance.sql
```

### Paso 5: Importar Datos

```bash
# Importar datos a las tablas
node supabase/migration/4_import_data.js

# Importar archivos al storage
node supabase/migration/5_import_storage.js
```

### Paso 6: Verificar Migración

```bash
node supabase/migration/6_verify_migration.js
```

**Este script compara los conteos de registros entre ambas instancias.**

### Paso 7: Actualizar Configuración de la Aplicación

```bash
chmod +x supabase/migration/7_update_env.sh
./supabase/migration/7_update_env.sh
```

Luego reinicia tu servidor de desarrollo:

```bash
npm run dev
```

## ✅ Verificación Manual

Después de la migración, verifica manualmente:

1. **Autenticación**
   - Inicia sesión con una cuenta existente
   - Verifica que el perfil se carga correctamente

2. **Libros**
   - Ver tu biblioteca
   - Agregar un nuevo libro
   - Actualizar estado de un libro

3. **Funciones Avanzadas**
   - Crear una nota
   - Verificar insignias
   - Subir avatar

## 📊 Estructura de Archivos

```
supabase/migration/
├── .env.migration              # Credenciales (NO COMMITEAR)
├── README.md                   # Esta guía
├── 1_export_data.js           # Exporta tablas
├── 2_export_storage.js        # Exporta storage
├── 3_setup_new_instance.sql   # Configura schema
├── 4_import_data.js           # Importa datos
├── 5_import_storage.js        # Importa archivos
├── 6_verify_migration.js      # Verifica migración
├── 7_update_env.sh            # Actualiza .env.local
├── exports/                    # Datos exportados
│   ├── *.json                 # Tablas
│   └── storage/               # Archivos
├── imports/                    # Reportes de importación
└── backups/                    # Backups de .env.local
```

## 🔄 Rollback

Si algo sale mal:

```bash
# Restaurar configuración anterior
cp supabase/migration/backups/.env.local.backup.* .env.local
npm run dev
```

## ⚠️ Notas Importantes

- **No elimines** la instancia antigua hasta confirmar que todo funciona
- **Guarda** los backups en un lugar seguro
- **Verifica** que todas las funcionalidades críticas funcionan antes de hacer el cambio permanente
- **Ten en cuenta** que los usuarios autenticados necesitarán hacer logout/login después de la migración si cambian los tokens

## 🆘 Problemas Comunes

### "Connection refused" al ejecutar psql

Verifica que:
- El puerto 5432 está abierto en tu firewall
- PostgreSQL acepta conexiones remotas
- El host es correcto (podría ser la IP pública en vez de "db")

### "Permission denied" en scripts .sh

Ejecuta:
```bash
chmod +x supabase/migration/*.sh
```

### Errores de foreign key al importar

Los scripts importan en el orden correcto, pero si hay problemas:
- Verifica que el schema se aplicó correctamente
- Revisa los logs para identificar qué registro causa el problema

## 📞 Soporte

Si encuentras problemas durante la migración, revisa:
1. Los archivos de log en `exports/_export_summary.json`
2. Los reportes en `imports/_import_summary.json`
3. El reporte de verificación en `imports/_verification_report.json`
