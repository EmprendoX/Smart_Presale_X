# Smart Pre‑Sale

**Objetivo**: Formalizar preventas grupales con depósitos y reglas transparentes.

**Stack**: Next.js 14 (App Router), TypeScript, Tailwind. **Persistencia en archivos JSON** (listo para migrar a Supabase).

## Comandos

```bash
npm install  # o pnpm install / yarn install
npm run dev  # localhost:3000
```

## Funcionalidad

* **Home**: Listado de proyectos publicados + progreso/depósito.
* **Detalle de proyecto**: Barra de progreso, días restantes, botón **Reservar** (KYC ligero, pago simulado).
* **Dashboard comprador**: Ver reservas con filtros, estadísticas, solicitar reembolso.
* **Panel Dev**: Listar proyectos creados, crear/editar proyectos + rondas, gestión completa.
* **Panel Admin**: Publicar proyectos, filtrar por estado, evaluar cierre de ronda (cumple/no cumple → reembolsos automáticos).

## Persistencia Actual (JSON)

Los datos se almacenan en archivos JSON en la carpeta `data/`:
- `data/projects.json` - Proyectos
- `data/rounds.json` - Rondas de preventa
- `data/reservations.json` - Reservas
- `data/transactions.json` - Transacciones

Los datos persisten entre reinicios del servidor (no se pierden en hot reload de desarrollo).

## Roles Demo

Selector en la navbar: **Comprador / Desarrollador / Admin** (localStorage `sps_user`).

Usuarios disponibles:
- **Ana (Comprador)**: `u_buyer_1`
- **Carlos (Dev)**: `u_dev_1`
- **Pat (Admin)**: `u_admin_1`

## Migración a Supabase

### Paso 1: Crear Proyecto en Supabase

1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. Espera a que el proyecto se inicialice completamente (puede tomar unos minutos)
3. Obtén tus credenciales desde el Dashboard:
   - Ve a **Settings** → **API**
   - Copia la **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copia la clave **anon** `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copia la clave **service_role** `secret` → `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **IMPORTANTE**: La clave `service_role` es secreta y nunca debe exponerse al cliente

### Paso 2: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Para más detalles sobre variables de entorno, consulta [`docs/environment-variables.md`](docs/environment-variables.md).

### Paso 3: Crear Tablas y Configuración

Ejecuta los siguientes archivos SQL en el **SQL Editor** de Supabase (en orden):

#### 3.1. Schema Principal

Ejecuta `supabase/schema.sql` completo. Este archivo incluye:
- Tablas principales (tenants, projects, rounds, reservations, transactions, etc.)
- Tablas KYC (kyc_profiles, kyc_documents)
- Índices para optimización
- Políticas RLS (Row Level Security)
- Datos iniciales (tenant por defecto)

#### 3.2. Storage Bucket para KYC

Ejecuta `supabase/storage-setup.sql` para crear el bucket de almacenamiento para documentos KYC:

- Crea el bucket `kyc-documents` (privado)
- Configura políticas de acceso (usuarios solo pueden acceder a sus propios archivos)
- Establece límites de tamaño y tipos MIME permitidos

**Nota**: También puedes crear el bucket manualmente desde el Dashboard:
1. Ve a **Storage** en el menú lateral
2. Clic en **New bucket**
3. Nombre: `kyc-documents`
4. Marca como **Private**
5. Crea las políticas manualmente usando el SQL de `storage-setup.sql`

### Paso 4: Configurar Autenticación

En el Dashboard de Supabase:

1. Ve a **Authentication** → **Providers**
2. Habilita **Email** provider (ya está habilitado por defecto)
3. Configura **Email Templates** si lo deseas (opcional)
4. Si usas OAuth, configura los providers necesarios (Google, GitHub, etc.)
5. En **URL Configuration**, agrega tus redirect URLs:
   - `http://localhost:3000/**` (desarrollo)
   - `https://your-domain.com/**` (producción)

### Paso 5: Verificar Instalación

1. Verifica que todas las tablas se crearon correctamente:
   - Ve a **Table Editor** en el Dashboard
   - Deberías ver todas las tablas: `tenants`, `projects`, `rounds`, `reservations`, `transactions`, `kyc_profiles`, `kyc_documents`, etc.

2. Verifica que RLS está habilitado:
   - En **Table Editor**, cada tabla debe mostrar "RLS enabled"

3. Verifica el bucket de storage:
   - Ve a **Storage** → Deberías ver el bucket `kyc-documents`

### Paso 6: Migrar Datos JSON a Supabase

Si tienes datos existentes en archivos JSON, ejecuta el script de migración:

```bash
npx ts-node -r tsconfig-paths/register scripts/migrate-to-supabase.ts
```

Este script:
- Migra todos los datos de `data/*.json` a Supabase
- Preserva IDs y relaciones
- Maneja duplicados (upsert)
- Muestra progreso en consola

**Nota**: Asegúrate de tener configuradas las variables de entorno antes de ejecutar el script.

### Paso 7: Probar la Aplicación

1. Inicia el servidor de desarrollo:
```bash
npm run dev
```

2. Verifica que la aplicación esté usando Supabase:
   - Abre la consola del navegador
   - No deberías ver errores relacionados con Supabase
   - Los datos deberían cargarse desde Supabase, no desde JSON

3. Prueba las funcionalidades principales:
   - **Autenticación**: Registro e inicio de sesión
   - **KYC**: Completar perfil y subir documentos
   - **Proyectos**: Crear y listar proyectos
   - **Reservas**: Crear reservas y procesar pagos

## Estructura de Datos

### Mapeo JSON → Supabase

| Campo JSON | Campo Supabase | Tipo |
|-----------|----------------|------|
| `id` | `id` | UUID |
| `slug` | `slug` | TEXT |
| `videoUrl` | `video_url` | TEXT |
| `developerId` | `developer_id` | TEXT |
| `createdAt` | `created_at` | TIMESTAMPTZ |
| `roundId` | `round_id` | UUID |
| `userId` | `user_id` | TEXT |
| `reservationId` | `reservation_id` | UUID |
| `payoutAt` | `payout_at` | TIMESTAMPTZ |

## Configuración de Pagos con Stripe

### Configuración Básica

1. Crea una cuenta en [Stripe](https://stripe.com) (o usa modo test)
2. Obtén tus claves API desde el [Dashboard de Stripe](https://dashboard.stripe.com/apikeys)
3. Agrega a tu `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Nota**: Si no configuras Stripe, la aplicación usará un driver mock para pruebas.

### Configurar Webhooks

1. En el Dashboard de Stripe, ve a **Developers** → **Webhooks**
2. Agrega un endpoint: `https://your-domain.com/api/payments/stripe/webhook`
3. Selecciona los eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copia el **Signing secret** y agrégalo a `STRIPE_WEBHOOK_SECRET`

### Stripe Connect (Multi-vendor)

Para escenarios marketplace donde cada desarrollador tiene su propia cuenta:

1. Configura Stripe Connect en tu cuenta
2. Agrega `STRIPE_CONNECT_ACCOUNT_ID` a las variables de entorno
3. El sistema usará **destination charges** automáticamente

## Escrow.com / Mangopay (Custodia)

Sustituye `/api/checkout` para abrir transacción en custodia y liberar al cumplir meta/fecha.

## Sistema KYC (Know Your Customer)

La aplicación incluye un sistema completo de KYC:

### Tablas KYC

- **`kyc_profiles`**: Almacena datos personales (nombre, fecha de nacimiento, dirección, etc.)
- **`kyc_documents`**: Rastrea documentos subidos (ID frontal, ID trasero, comprobante de domicilio)

### Storage

- **Bucket `kyc-documents`**: Almacena archivos de documentos de forma privada
- Los usuarios solo pueden acceder a sus propios documentos
- Límite de 5MB por archivo
- Tipos permitidos: JPEG, PNG, WebP, PDF

### Flujo de Verificación

1. Usuario completa datos personales → `kyc_profiles` con status `pending`
2. Usuario sube documentos → `kyc_documents` con status `pending`
3. Admin revisa y aprueba/rechaza → status cambia a `approved` o `rejected`
4. Usuario puede proceder con reservas una vez verificado

### Integración con Reservas

El sistema puede requerir KYC completo antes de permitir reservas de alto valor (configurable).

## Notificaciones (n8n / Postmark / Twilio)

Eventos a implementar:
- 80% alcanzado → campaña/WhatsApp
- Quedan 72h → recordatorio
- No cumplida → reembolsos/notificaciones

## Arquitectura

```
lib/
├── config.ts              # Configuración de servicio (JSON/Supabase)
├── services/
│   ├── db.ts             # Interfaz común
│   ├── json-db-service.ts # Implementación JSON
│   └── supabase-service.ts # Implementación Supabase (placeholder)
├── storage/
│   └── json-db.ts        # Funciones de lectura/escritura JSON
└── types.ts              # Tipos TypeScript
```

## Notas de Desarrollo

- Los datos JSON se inicializan automáticamente con proyectos de ejemplo si no existen
- Los cambios se guardan inmediatamente en los archivos JSON
- El directorio `data/` se crea automáticamente si no existe
- Para producción, considera usar Supabase para mejor escalabilidad y seguridad
