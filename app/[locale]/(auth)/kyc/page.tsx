"use client";

import { FormEvent, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/providers/AuthProvider';
import { KycDocument, KycPersonalData, saveKycPersonalData, uploadKycDocument } from '@/lib/auth/supabase';

export default function KycPage() {
  const t = useTranslations('auth.kyc');
  const { user, refreshSession } = useAuth();
  const searchParams = useSearchParams();
  const initialStep = useMemo(() => {
    const stepParam = searchParams?.get('step');
    if (stepParam === 'documents') return 2;
    return 1;
  }, [searchParams]);

  const [step, setStep] = useState<number>(initialStep);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [personalData, setPersonalData] = useState<KycPersonalData>({
    firstName: '',
    lastName: '',
    birthdate: '',
    country: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: ''
  });

  const [documents, setDocuments] = useState<{ [key in KycDocument['type']]?: File | null }>({
    id_front: null,
    id_back: null,
    proof_of_address: null
  });

  const handlePersonalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await saveKycPersonalData(personalData);
      await refreshSession();
      setSuccessMessage(t('personalSuccess'));
      setStep(2);
    } catch (error: any) {
      console.error('[KYC] personal data error', error);
      setErrorMessage(error?.message ?? t('genericError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const uploads = Object.entries(documents)
        .filter(([, file]) => file)
        .map(([type, file]) => uploadKycDocument({ type: type as KycDocument['type'], file: file as File }));

      if (uploads.length === 0) {
        setErrorMessage(t('missingDocuments'));
        setSaving(false);
        return;
      }

      await Promise.all(uploads);
      await refreshSession();
      setSuccessMessage(t('documentsSuccess'));
    } catch (error: any) {
      console.error('[KYC] document upload error', error);
      setErrorMessage(error?.message ?? t('genericError'));
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-semibold mb-2">{t('noUserTitle')}</h1>
        <p className="text-neutral-600">{t('noUserDescription')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold mb-2">{t('title')}</h1>
        <p className="text-neutral-600">{t('subtitle', { name: user.fullName || user.email })}</p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="md:w-64 space-y-4">
          <div className="rounded-lg border p-4">
            <p className={`text-sm font-medium ${step >= 1 ? 'text-brand' : 'text-neutral-500'}`}>{t('steps.personal')}</p>
            <p className="text-xs text-neutral-500">{t('steps.personalHint')}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className={`text-sm font-medium ${step >= 2 ? 'text-brand' : 'text-neutral-500'}`}>{t('steps.documents')}</p>
            <p className="text-xs text-neutral-500">{t('steps.documentsHint')}</p>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          {step === 1 && (
            <form onSubmit={handlePersonalSubmit} className="space-y-6 rounded-lg border p-6 shadow-sm">
              <h2 className="text-xl font-medium">{t('personalTitle')}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-700">{t('fields.firstName')}</span>
                  <Input
                    required
                    value={personalData.firstName}
                    onChange={event => setPersonalData(prev => ({ ...prev, firstName: event.target.value }))}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-700">{t('fields.lastName')}</span>
                  <Input
                    required
                    value={personalData.lastName}
                    onChange={event => setPersonalData(prev => ({ ...prev, lastName: event.target.value }))}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-700">{t('fields.birthdate')}</span>
                  <Input
                    type="date"
                    required
                    value={personalData.birthdate}
                    onChange={event => setPersonalData(prev => ({ ...prev, birthdate: event.target.value }))}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-700">{t('fields.country')}</span>
                  <Input
                    required
                    value={personalData.country}
                    onChange={event => setPersonalData(prev => ({ ...prev, country: event.target.value }))}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-700">{t('fields.phone')}</span>
                  <Input
                    required
                    value={personalData.phone}
                    onChange={event => setPersonalData(prev => ({ ...prev, phone: event.target.value }))}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-700">{t('fields.city')}</span>
                  <Input
                    required
                    value={personalData.city}
                    onChange={event => setPersonalData(prev => ({ ...prev, city: event.target.value }))}
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-neutral-700">{t('fields.addressLine1')}</span>
                  <Input
                    required
                    value={personalData.addressLine1}
                    onChange={event => setPersonalData(prev => ({ ...prev, addressLine1: event.target.value }))}
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-neutral-700">{t('fields.addressLine2')}</span>
                  <Input
                    value={personalData.addressLine2 ?? ''}
                    onChange={event => setPersonalData(prev => ({ ...prev, addressLine2: event.target.value }))}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-700">{t('fields.state')}</span>
                  <Input
                    value={personalData.state ?? ''}
                    onChange={event => setPersonalData(prev => ({ ...prev, state: event.target.value }))}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-neutral-700">{t('fields.postalCode')}</span>
                  <Input
                    value={personalData.postalCode ?? ''}
                    onChange={event => setPersonalData(prev => ({ ...prev, postalCode: event.target.value }))}
                  />
                </label>
              </div>
              <Button type="submit" disabled={saving} className="w-full md:w-auto">
                {saving ? t('saving') : t('continue')}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleDocumentsSubmit} className="space-y-6 rounded-lg border p-6 shadow-sm">
              <h2 className="text-xl font-medium">{t('documentsTitle')}</h2>
              <div className="space-y-4">
                {(['id_front', 'id_back', 'proof_of_address'] as KycDocument['type'][]).map(type => (
                  <label key={type} className="block space-y-2">
                    <span className="text-sm font-medium text-neutral-700">{t(`documents.${type}` as const)}</span>
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      required={type !== 'proof_of_address'}
                      onChange={event => {
                        const file = event.target.files?.[0];
                        setDocuments(prev => ({ ...prev, [type]: file ?? null }));
                      }}
                    />
                  </label>
                ))}
              </div>
              <Button type="submit" disabled={saving} className="w-full md:w-auto">
                {saving ? t('saving') : t('submitDocuments')}
              </Button>
            </form>
          )}

          {(successMessage || errorMessage) && (
            <div className={`rounded-lg border p-4 ${successMessage ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className={`text-sm ${successMessage ? 'text-green-700' : 'text-red-700'}`}>
                {successMessage || errorMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
