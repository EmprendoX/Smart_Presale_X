import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { createSupabaseServerClient, mapSupabaseUser } from '@/lib/auth/supabase';

type SupabaseTenant = {
  id: string;
  slug: string;
  name: string;
  status: string;
  region: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

type SupabaseTenantSettings = {
  id: string;
  tenant_id: string;
  logo_url: string | null;
  dark_logo_url: string | null;
  square_logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  primary_color_foreground: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  surface_color: string | null;
  foreground_color: string | null;
  font_family: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

const DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG ?? 'smart-presale';
const TENANT_BASE_DOMAIN = process.env.TENANT_BASE_DOMAIN ?? '';
const TENANT_HEADER = 'x-tenant-slug';
const TENANT_COOKIE = 'tenant_settings';
const TENANT_SLUG_COOKIE = 'tenant_slug';

const intlMiddleware = createIntlMiddleware(routing);

const ROLE_HOME: Record<string, string> = {
  buyer: '/dashboard',
  developer: '/dev',
  admin: '/admin'
};

const PROTECTED_ROUTES = ['/dashboard', '/dev', '/admin'];
const AUTH_ROUTES = ['/sign-up', '/kyc'];

const { locales, defaultLocale } = routing;

function extractLocaleAndPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0];
  const locale = locales.includes(maybeLocale as any) ? (maybeLocale as string) : defaultLocale;
  const pathSegments = locales.includes(maybeLocale as any) ? segments.slice(1) : segments;
  const relativePath = `/${pathSegments.join('/')}`.replace(/\/$/, '') || '/';
  return { locale, relativePath };
}

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  try {
    const supabase = createSupabaseServerClient(request, response);

    const tenantSlug = await resolveTenantSlug(request);
    const tenantData = await resolveTenantContext(supabase, tenantSlug);

    if (tenantData) {
      persistTenantContext(response, tenantData);
    }

    const { locale, relativePath } = extractLocaleAndPath(request.nextUrl.pathname);
    const {
      data: { session }
    } = await supabase.auth.getSession();

    const user = mapSupabaseUser(session?.user ?? null);

    if (!user) {
      if (PROTECTED_ROUTES.some(route => relativePath.startsWith(route)) && !AUTH_ROUTES.includes(relativePath)) {
        return NextResponse.redirect(new URL(`/${locale}/sign-up`, request.url));
      }
      return response;
    }

    const needsPersonalData = user.kycStatus === 'none';
    const needsDocuments = user.kycStatus === 'basic';
    const requiresKyc = needsPersonalData || needsDocuments;

    if (requiresKyc && !relativePath.startsWith('/kyc')) {
      const target = needsDocuments ? `/${locale}/kyc?step=documents` : `/${locale}/kyc`;
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (AUTH_ROUTES.includes(relativePath) && !requiresKyc) {
      const destination = ROLE_HOME[user.role] ?? '/dashboard';
      return NextResponse.redirect(new URL(`/${locale}${destination}`, request.url));
    }

    if (relativePath === '/' && !requiresKyc) {
      const destination = ROLE_HOME[user.role] ?? '/dashboard';
      return NextResponse.redirect(new URL(`/${locale}${destination}`, request.url));
    }
  } catch (error) {
    console.error('[middleware] Error handling auth redirect:', error);
  }

  return response;
}

async function resolveTenantSlug(request: NextRequest): Promise<string> {
  const headerSlug = request.headers.get(TENANT_HEADER) ?? request.headers.get('x-tenant');
  if (headerSlug) {
    return headerSlug.toLowerCase();
  }

  const hostHeader = request.headers.get('host') ?? '';
  const hostname = hostHeader.split(':')[0]?.toLowerCase() ?? '';

  if (hostname && TENANT_BASE_DOMAIN && hostname.endsWith(TENANT_BASE_DOMAIN.toLowerCase())) {
    const maybeSubdomain = hostname.slice(0, -TENANT_BASE_DOMAIN.length).replace(/\.$/, '');
    if (maybeSubdomain && maybeSubdomain !== 'www') {
      return maybeSubdomain;
    }
  }

  if (hostname && !TENANT_BASE_DOMAIN) {
    const [subdomain] = hostname.split('.');
    if (subdomain && subdomain !== 'www') {
      return subdomain;
    }
  }

  return DEFAULT_TENANT_SLUG;
}

async function resolveTenantContext(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  slug: string
): Promise<{ tenant: SupabaseTenant; settings: SupabaseTenantSettings | null } | null> {
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, slug, name, status, region, metadata, created_at, updated_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[middleware] Error fetching tenant', error);
  }

  let resolvedTenant = tenant as SupabaseTenant | null;

  if (!resolvedTenant && slug !== DEFAULT_TENANT_SLUG) {
    const { data: fallbackTenant, error: fallbackError } = await supabase
      .from('tenants')
      .select('id, slug, name, status, region, metadata, created_at, updated_at')
      .eq('slug', DEFAULT_TENANT_SLUG)
      .maybeSingle();

    if (fallbackError) {
      console.error('[middleware] Error fetching default tenant', fallbackError);
    }

    resolvedTenant = fallbackTenant as SupabaseTenant | null;
  }

  if (!resolvedTenant) {
    return null;
  }

  const { data: settings, error: settingsError } = await supabase
    .from('tenant_settings')
    .select(
      [
        'id',
        'tenant_id',
        'logo_url',
        'dark_logo_url',
        'square_logo_url',
        'favicon_url',
        'primary_color',
        'primary_color_foreground',
        'secondary_color',
        'accent_color',
        'background_color',
        'surface_color',
        'foreground_color',
        'font_family',
        'metadata',
        'created_at',
        'updated_at'
      ].join(',')
    )
    .eq('tenant_id', resolvedTenant.id)
    .maybeSingle();

  if (settingsError) {
    console.error('[middleware] Error fetching tenant settings', settingsError);
  }

  return {
    tenant: resolvedTenant,
    settings: (settings as SupabaseTenantSettings | null) ?? null
  };
}

function persistTenantContext(
  response: NextResponse,
  context: { tenant: SupabaseTenant; settings: SupabaseTenantSettings | null }
) {
  const payload = {
    tenant: context.tenant,
    settings: context.settings
  };

  const serialized = encodeURIComponent(JSON.stringify(payload));

  response.cookies.set({
    name: TENANT_COOKIE,
    value: serialized,
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/'
  });

  response.cookies.set({
    name: TENANT_SLUG_COOKIE,
    value: context.tenant.slug,
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/'
  });

  response.headers.set(TENANT_HEADER, context.tenant.slug);
}

export const config = {
  matcher: ['/', '/(es|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};

