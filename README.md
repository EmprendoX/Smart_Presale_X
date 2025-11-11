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

### Paso 1: Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Obtén tus credenciales:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. Agrega a tu `.env.local`:
```env
USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Paso 2: Crear Tablas

Ejecuta este SQL en el SQL Editor de Supabase (disponible también en `supabase/schema.sql`):

```sql
-- Tabla de proyectos
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'MXN')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'review', 'published')),
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  description TEXT NOT NULL,
  developer_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de rondas
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('reservations', 'amount')),
  goal_value INTEGER NOT NULL,
  deposit_amount INTEGER NOT NULL,
  slots_per_person INTEGER NOT NULL,
  deadline_at TIMESTAMPTZ NOT NULL,
  rule TEXT NOT NULL CHECK (rule IN ('all_or_nothing', 'partial')),
  partial_threshold DECIMAL DEFAULT 0.7,
  status TEXT NOT NULL CHECK (status IN ('open', 'nearly_full', 'closed', 'not_met', 'fulfilled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de reservas
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  slots INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'refunded', 'assigned', 'waitlisted')),
  tx_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de transacciones
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('simulated', 'stripe', 'escrow')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'MXN')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'refunded')),
  payout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_rounds_project_id ON rounds(project_id);
CREATE INDEX idx_reservations_round_id ON reservations(round_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_transactions_reservation_id ON transactions(reservation_id);
```

### Paso 3: Implementar SupabaseService

1. Instala el cliente de Supabase:
```bash
npm install @supabase/supabase-js
```

2. Actualiza `lib/services/supabase-service.ts` con la implementación real usando el cliente de Supabase.

3. La aplicación automáticamente usará Supabase cuando `USE_SUPABASE=true`.

### Paso 4: Migrar Datos JSON a Supabase

Ejecuta el script `scripts/migrate-to-supabase.ts` para transferir datos existentes desde los JSON. Requiere que tengas configuradas las variables de entorno `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.

```bash
npx ts-node -r tsconfig-paths/register scripts/migrate-to-supabase.ts
```

Código base del script:

```typescript
// scripts/migrate-to-supabase.ts
import { createClient } from '@supabase/supabase-js';
import { jsonDb } from '../lib/storage/json-db';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function migrate() {
  // Migrar proyectos
  const projects = await jsonDb.getProjects();
  for (const p of projects) {
    await supabase.from('projects').insert({
      id: p.id,
      slug: p.slug,
      name: p.name,
      city: p.city,
      country: p.country,
      currency: p.currency,
      status: p.status,
      images: p.images,
      video_url: p.videoUrl,
      description: p.description,
      developer_id: p.developerId,
      created_at: p.createdAt
    });
  }

  // Similar para rounds, reservations, transactions...
}
```

### Paso 5: Configurar RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (ajusta según tus necesidades)
CREATE POLICY "Projects are viewable by everyone" ON projects FOR SELECT USING (true);
CREATE POLICY "Developers can insert their own projects" ON projects FOR INSERT WITH CHECK (auth.uid()::text = developer_id);

CREATE POLICY "Reservations are viewable by owner" ON reservations FOR SELECT USING (auth.uid()::text = user_id);
```

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

## Conectar Stripe Connect

1. Instala Stripe:
```bash
npm install stripe
```

2. En `/api/checkout`:
   - Crear PaymentIntent con **destination charges** a la cuenta conectada del desarrollador
   - Retener fondos hasta cumplir meta
   - `payout` al cerrar la ronda exitosamente

3. Manejar webhooks:
   - `payment_intent.succeeded`
   - `charge.refunded`

## Escrow.com / Mangopay (Custodia)

Sustituye `/api/checkout` para abrir transacción en custodia y liberar al cumplir meta/fecha.

## KYC/AML

Si depósito >= 1,000 → lanzar verificación (Persona/Onfido) y bloquear `payout` hasta verificado.

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
