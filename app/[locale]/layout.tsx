import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { routing } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/providers/AuthProvider';
import { TenantProvider } from '@/providers/TenantProvider';
import type { Tenant, TenantSettings } from '@/lib/types';
import { buildCssVariables, resolveTenantTheme } from '@/lib/tenant/theme';
import '../globals.css';

// Mensajes por defecto como fallback
const defaultMessages = {
  nav: {
    projects: "Proyectos",
    myReservations: "Mis Reservas",
    devPanel: "Panel Dev",
    admin: "Admin",
    language: "Idioma",
    communities: "Comunidades",
    spanish: "Español",
    english: "English",
    howItWorks: "Cómo funciona"
  },
  home: {
    title: "Proyectos Verificados",
    published: "Publicado",
    progress: "Progreso",
    deposit: "Depósito",
    viewDetail: "Ver detalle →"
  }
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const tenantContext = extractTenantContext();
  const theme = resolveTenantTheme(tenantContext.settings);
  const cssVariables = buildCssVariables(theme);

  // Obtener mensajes con manejo de errores
  let messages: any = defaultMessages;
  try {
    const loadedMessages = await getMessages();
    // Verificar que messages sea un objeto válido
    if (loadedMessages && typeof loadedMessages === 'object') {
      messages = loadedMessages;
    }
  } catch (error: any) {
    // Silenciar errores de NEXT_NOT_FOUND durante el build
    if (error?.digest !== 'NEXT_NOT_FOUND') {
      console.error('Error loading messages, using defaults:', error);
    }
    messages = defaultMessages;
  }

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body
        style={cssVariables as CSSProperties}
        className="bg-[color:var(--tenant-background)] text-foreground"
        data-tenant={tenantContext.tenant?.slug ?? 'default'}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TenantProvider value={tenantContext}>
            <AuthProvider>
              <ToastProvider>
                <Navbar />
                <main className="container py-8">{children}</main>
              </ToastProvider>
            </AuthProvider>
          </TenantProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

function extractTenantContext(): { tenant: Tenant | null; settings: TenantSettings | null } {
  const cookieStore = cookies();
  const encoded = cookieStore.get('tenant_settings')?.value;

  if (!encoded) {
    return { tenant: null, settings: null };
  }

  try {
    const decoded = decodeURIComponent(encoded);
    const payload = JSON.parse(decoded) as {
      tenant?: any;
      settings?: any;
    };

    const tenant = payload.tenant ? mapTenant(payload.tenant) : null;
    const settings = payload.settings ? mapTenantSettings(payload.settings) : null;

    return { tenant, settings };
  } catch (error) {
    console.error('[layout] Failed to parse tenant settings cookie', error);
    return { tenant: null, settings: null };
  }
}

function mapTenant(raw: any): Tenant | null {
  if (!raw?.id || !raw?.slug || !raw?.name || !raw?.status) {
    return null;
  }

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    status: raw.status,
    region: raw.region ?? null,
    metadata: raw.metadata ?? null,
    createdAt: new Date(raw.created_at ?? Date.now()).toISOString(),
    updatedAt: new Date(raw.updated_at ?? Date.now()).toISOString()
  };
}

function mapTenantSettings(raw: any): TenantSettings {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    logoUrl: raw.logo_url ?? null,
    darkLogoUrl: raw.dark_logo_url ?? null,
    squareLogoUrl: raw.square_logo_url ?? null,
    faviconUrl: raw.favicon_url ?? null,
    primaryColor: raw.primary_color ?? null,
    primaryColorForeground: raw.primary_color_foreground ?? null,
    secondaryColor: raw.secondary_color ?? null,
    accentColor: raw.accent_color ?? null,
    backgroundColor: raw.background_color ?? null,
    surfaceColor: raw.surface_color ?? null,
    foregroundColor: raw.foreground_color ?? null,
    fontFamily: raw.font_family ?? null,
    metadata: raw.metadata ?? null,
    createdAt: new Date(raw.created_at ?? Date.now()).toISOString(),
    updatedAt: new Date(raw.updated_at ?? Date.now()).toISOString()
  };
}

