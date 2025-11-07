import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { notFound } from 'next/navigation';

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const candidate = locale ?? (await requestLocale);
  const resolvedLocale = candidate && routing.locales.includes(candidate as any) ? candidate : routing.defaultLocale;

  if (!resolvedLocale) {
    notFound();
  }

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default
  };
});

