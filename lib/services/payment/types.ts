import { Currency, PaymentWebhook, Reservation, Round, Transaction, TransactionProvider, User, Project } from '@/lib/types';

export type PaymentIntentRequest = {
  reservation: Reservation;
  round: Round | null;
  project: Project | null;
  buyer: User | null;
};

export type PaymentIntentResult = {
  providerId: string;
  status: 'requires_action' | 'processing' | 'succeeded';
  clientSecret?: string;
  raw: Record<string, any>;
};

export type PaymentRefundRequest = {
  transaction: Transaction;
  reservation: Reservation;
  amount: number;
  currency: Currency;
};

export type PaymentRefundResult = {
  providerId: string;
  status: 'pending' | 'refunded';
  raw: Record<string, any>;
};

export type PaymentWebhookEvent = {
  id: string;
  type: string;
  provider: TransactionProvider;
  reservationId?: string;
  transactionId?: string;
  externalReference?: string;
  status?: 'pending' | 'succeeded' | 'refunded';
  amount?: number;
  currency?: Currency;
  raw: Record<string, any>;
};

export interface PaymentDriver {
  readonly name: TransactionProvider;
  createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult>;
  refundPayment(request: PaymentRefundRequest): Promise<PaymentRefundResult>;
  verifyWebhook?(payload: string, headers: Record<string, string | string[] | undefined>): Promise<PaymentWebhookEvent | null>;
}

export type PersistedWebhook = PaymentWebhook;
