"use client";

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/AuthProvider';

const OAUTH_PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'github', label: 'GitHub' }
] as const;

export default function SignUpPage() {
  const t = useTranslations('auth.signUp');
  const router = useRouter();
  const { signInWithOtp, signInWithOAuth, user } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    try {
      setStatus('loading');
      setMessage('');
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
      await signInWithOtp(email, { redirectTo });
      setStatus('sent');
      setMessage(t('otpSent'));
    } catch (error: any) {
      console.error('[SignUp] OTP error', error);
      setStatus('error');
      setMessage(error?.message ?? t('genericError'));
    }
  };

  const handleOAuth = async (provider: (typeof OAUTH_PROVIDERS)[number]['id']) => {
    try {
      setStatus('loading');
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;
      await signInWithOAuth(provider, { redirectTo });
    } catch (error: any) {
      console.error('[SignUp] OAuth error', error);
      setStatus('error');
      setMessage(error?.message ?? t('genericError'));
    }
  };

  if (user) {
    router.replace('/kyc');
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold mb-2">{t('title')}</h1>
      <p className="text-neutral-600 mb-6">{t('subtitle')}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-4 rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-medium">{t('emailTitle')}</h2>
          <p className="text-sm text-neutral-600">{t('emailDescription')}</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2 block">
              <span className="text-sm font-medium text-neutral-700">{t('emailLabel')}</span>
              <Input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="ana@example.com"
                required
              />
            </label>
            <Button type="submit" disabled={status === 'loading'} className="w-full">
              {status === 'loading' ? t('sending') : t('sendOtp')}
            </Button>
          </form>
          {message && (
            <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
          )}
        </section>

        <section className="space-y-4 rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-medium">{t('oauthTitle')}</h2>
          <p className="text-sm text-neutral-600">{t('oauthDescription')}</p>
          <div className="space-y-3">
            {OAUTH_PROVIDERS.map(provider => (
              <Button
                key={provider.id}
                type="button"
                variant="secondary"
                className="w-full"
                disabled={status === 'loading'}
                onClick={() => handleOAuth(provider.id)}
              >
                {t('continueWith', { provider: provider.label })}
              </Button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
