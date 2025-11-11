import createIntlMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { createSupabaseServerClient, mapSupabaseUser } from '@/lib/auth/supabase';

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
    const { locale, relativePath } = extractLocaleAndPath(request.nextUrl.pathname);
    const supabase = createSupabaseServerClient(request, response);
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

export const config = {
  matcher: ['/', '/(es|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};

