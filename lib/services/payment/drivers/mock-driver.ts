import { randomUUID } from 'crypto';
import { PaymentDriver, PaymentIntentRequest, PaymentIntentResult, PaymentRefundRequest, PaymentRefundResult, PaymentWebhookEvent } from '../types';

export class MockPaymentDriver implements PaymentDriver {
  readonly name = 'simulated' as const;

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult> {
    const providerId = `pi_${randomUUID()}`;
    return {
      providerId,
      status: request.reservation.status === 'waitlisted' ? 'processing' : 'succeeded',
      clientSecret: `cs_${randomUUID()}`,
      raw: {
        id: providerId,
        object: 'payment_intent',
        reservationId: request.reservation.id,
        amount: request.reservation.amount,
        currency: request.project?.currency ?? 'USD',
        status: request.reservation.status === 'waitlisted' ? 'processing' : 'succeeded'
      }
    };
  }

  async refundPayment(_request: PaymentRefundRequest): Promise<PaymentRefundResult> {
    const providerId = `re_${randomUUID()}`;
    return {
      providerId,
      status: 'refunded',
      raw: {
        id: providerId,
        object: 'refund'
      }
    };
  }

  async verifyWebhook(payload: string): Promise<PaymentWebhookEvent | null> {
    try {
      const event = JSON.parse(payload);
      return {
        id: event.id ?? randomUUID(),
        type: event.type ?? 'simulated.event',
        provider: this.name,
        reservationId: event.data?.object?.metadata?.reservationId,
        transactionId: event.data?.object?.metadata?.transactionId,
        status: event.data?.object?.status,
        amount: event.data?.object?.amount,
        currency: event.data?.object?.currency,
        raw: event
      };
    } catch {
      return null;
    }
  }
}
