import { createHmac, timingSafeEqual } from 'crypto';
import { PaymentDriver, PaymentIntentRequest, PaymentIntentResult, PaymentRefundRequest, PaymentRefundResult, PaymentWebhookEvent } from '../types';

const STRIPE_API_URL = 'https://api.stripe.com/v1';

type StripeDriverOptions = {
  apiKey: string;
  accountId?: string;
  webhookSecret?: string;
};

const STATUS_MAP: Record<string, PaymentIntentResult['status']> = {
  succeeded: 'succeeded',
  processing: 'processing',
  requires_action: 'requires_action',
  requires_payment_method: 'requires_action'
};

export class StripePaymentDriver implements PaymentDriver {
  readonly name = 'stripe' as const;
  private readonly apiKey: string;
  private readonly accountId?: string;
  private readonly webhookSecret?: string;

  constructor(options: StripeDriverOptions) {
    this.apiKey = options.apiKey;
    this.accountId = options.accountId;
    this.webhookSecret = options.webhookSecret;
  }

  private buildHeaders(extra?: Record<string, string>) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`
    };
    if (this.accountId) {
      headers['Stripe-Account'] = this.accountId;
    }
    if (extra) {
      Object.assign(headers, extra);
    }
    return headers;
  }

  private async request<T = any>(path: string, body: URLSearchParams): Promise<T> {
    const response = await fetch(`${STRIPE_API_URL}${path}`, {
      method: 'POST',
      headers: this.buildHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }),
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stripe request failed: ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult> {
    const currency = (request.project?.currency ?? 'USD').toLowerCase();
    const amountInMinorUnits = Math.round(request.reservation.amount * 100);
    const params = new URLSearchParams();
    params.append('amount', String(amountInMinorUnits));
    params.append('currency', currency);
    params.append('automatic_payment_methods[enabled]', 'true');
    params.append('description', `Smart Presale · Reservation ${request.reservation.id}`);
    params.append('metadata[reservationId]', request.reservation.id);
    if (request.round) params.append('metadata[roundId]', request.round.id);
    if (request.project) params.append('metadata[projectId]', request.project.id);
    if (request.buyer?.email) params.append('receipt_email', request.buyer.email);

    const intent = await this.request<any>('/payment_intents', params);
    const status = STATUS_MAP[intent.status] ?? 'requires_action';
    return {
      providerId: intent.id,
      status,
      clientSecret: intent.client_secret ?? undefined,
      raw: intent
    };
  }

  async refundPayment(request: PaymentRefundRequest): Promise<PaymentRefundResult> {
    const amountInMinorUnits = Math.round(request.amount * 100);
    const params = new URLSearchParams();
    const paymentIntentId = request.transaction.externalId ?? request.transaction.id;
    params.append('payment_intent', paymentIntentId);
    params.append('amount', String(amountInMinorUnits));
    params.append('metadata[reservationId]', request.reservation.id);
    params.append('metadata[transactionId]', request.transaction.id);

    const refund = await this.request<any>('/refunds', params);
    return {
      providerId: refund.id,
      status: refund.status === 'succeeded' ? 'refunded' : 'pending',
      raw: refund
    };
  }

  async verifyWebhook(payload: string, headers: Record<string, string | string[] | undefined>): Promise<PaymentWebhookEvent | null> {
    let event: any;

    if (this.webhookSecret) {
      const signatureHeader = this.extractSignature(headers['stripe-signature']);
      this.assertSignature(signatureHeader, payload);
    }

    try {
      event = JSON.parse(payload);
    } catch (error) {
      throw new Error('Invalid Stripe webhook payload');
    }

    return this.mapEvent(event);
  }

  private extractSignature(header: string | undefined): { timestamp: string; signatures: string[] } {
    if (!header) {
      throw new Error('Missing Stripe signature header');
    }
    const parts = header.split(',').map(part => part.split('='));
    const timestamp = parts.find(([key]) => key === 't')?.[1];
    const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
    if (!timestamp || signatures.length === 0) {
      throw new Error('Invalid Stripe signature header');
    }
    return { timestamp, signatures };
  }

  private assertSignature(signature: { timestamp: string; signatures: string[] }, payload: string) {
    if (!this.webhookSecret) return;
    const signedPayload = `${signature.timestamp}.${payload}`;
    const expected = createHmac('sha256', this.webhookSecret).update(signedPayload).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    const match = signature.signatures.some(sig => {
      try {
        return timingSafeEqual(Buffer.from(sig, 'hex'), expectedBuffer);
      } catch {
        return false;
      }
    });

    if (!match) {
      throw new Error('Invalid Stripe webhook signature');
    }
  }

  private mapEvent(event: any): PaymentWebhookEvent {
    const object = event?.data?.object ?? {};
    const amount = typeof object.amount_received === 'number'
      ? object.amount_received
      : typeof object.amount === 'number'
        ? object.amount
        : undefined;
    const currency = typeof object.currency === 'string' ? object.currency.toUpperCase() : undefined;
    const status = typeof object.status === 'string' ? object.status : undefined;
    const metadata = object.metadata ?? {};

    return {
      id: event.id,
      type: event.type,
      provider: this.name,
      reservationId: metadata.reservationId ?? metadata.reservation_id,
      transactionId: metadata.transactionId ?? metadata.transaction_id,
      externalReference: object.id ?? object.payment_intent ?? object.charge,
      status: status === 'succeeded' ? 'succeeded' : status === 'refunded' ? 'refunded' : status === 'processing' ? 'pending' : undefined,
      amount: typeof amount === 'number' ? Math.round(amount) / 100 : undefined,
      currency,
      raw: event
    };
  }
}
