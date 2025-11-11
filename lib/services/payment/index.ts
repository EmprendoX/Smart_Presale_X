import { DatabaseService } from '../db';
import { PaymentService } from './payment-service';
import { MockPaymentDriver } from './drivers/mock-driver';
import { StripePaymentDriver } from './drivers/stripe-driver';
import { PaymentDriver } from './types';

const resolveDriver = (): PaymentDriver => {
  const driver = (process.env.PAYMENTS_DRIVER ?? process.env.NEXT_PUBLIC_PAYMENTS_DRIVER ?? 'mock').toLowerCase();

  if (driver === 'stripe') {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      console.warn('[payments] STRIPE_SECRET_KEY missing, falling back to mock driver');
      return new MockPaymentDriver();
    }
    return new StripePaymentDriver({
      apiKey,
      accountId: process.env.STRIPE_CONNECT_ACCOUNT_ID,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
    });
  }

  return new MockPaymentDriver();
};

export const createPaymentService = (db: DatabaseService) => new PaymentService(db, resolveDriver());
export type { PaymentService } from './payment-service';
export type { InitiatePaymentResult, ReconciliationResult } from './payment-service';
