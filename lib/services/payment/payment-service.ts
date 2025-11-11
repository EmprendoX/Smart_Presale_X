import { randomUUID } from 'crypto';
import { DatabaseService } from '../db';
import { PaymentDriver, PaymentIntentResult, PaymentWebhookEvent } from './types';
import { Reservation, Transaction, PaymentWebhook } from '@/lib/types';
import { computeProgress } from '@/lib/rules';

const isSuccessfulStatus = (status: PaymentIntentResult['status']) => status === 'succeeded';

export type InitiatePaymentResult = {
  transaction: Transaction;
  reservation: Reservation;
  clientSecret?: string;
  nextAction?: string;
};

export type ReconciliationResult = {
  processedRounds: number;
  assignments: number;
  refunds: number;
  skipped: number;
};

export class PaymentService {
  constructor(private readonly db: DatabaseService, private readonly driver: PaymentDriver) {}

  get provider() {
    return this.driver.name;
  }

  async initiateReservationPayment(reservationId: string): Promise<InitiatePaymentResult> {
    const reservation = await this.db.getReservationById(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status === 'refunded' || reservation.status === 'assigned') {
      throw new Error(`Reservation in status "${reservation.status}" cannot be charged.`);
    }

    const round = await this.db.getRoundById(reservation.roundId);
    const project = round ? await this.db.getProjectById(round.projectId) : null;
    const buyer = await this.db.getUserById(reservation.userId);
    const currency = project?.currency ?? 'USD';

    let paymentIntent: PaymentIntentResult | null = null;
    if (reservation.status !== 'waitlisted') {
      paymentIntent = await this.driver.createPaymentIntent({
        reservation,
        round,
        project,
        buyer: buyer ?? null
      });
    }

    const transaction: Transaction = {
      id: randomUUID(),
      reservationId: reservation.id,
      provider: this.driver.name,
      amount: reservation.amount,
      currency,
      status: reservation.status === 'waitlisted'
        ? 'pending'
        : paymentIntent && isSuccessfulStatus(paymentIntent.status)
          ? 'succeeded'
          : 'pending',
      payoutAt: null,
      externalId: paymentIntent?.providerId ?? null,
      metadata: {
        reservationId: reservation.id,
        roundId: round?.id,
        projectId: project?.id
      },
      rawResponse: paymentIntent?.raw ?? null,
      clientSecret: paymentIntent?.clientSecret,
      createdAt: new Date().toISOString()
    };

    await this.db.createTransaction(transaction);

    const nextReservationStatus = reservation.status === 'waitlisted'
      ? 'waitlisted'
      : paymentIntent && isSuccessfulStatus(paymentIntent.status)
        ? 'confirmed'
        : 'pending';

    const updatedReservation = await this.db.updateReservation(reservation.id, {
      status: nextReservationStatus,
      txId: transaction.id
    });

    return {
      transaction,
      reservation: updatedReservation ?? reservation,
      clientSecret: paymentIntent?.clientSecret,
      nextAction: paymentIntent && paymentIntent.status !== 'succeeded' ? paymentIntent.status : undefined
    };
  }

  async handleWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>): Promise<PaymentWebhook> {
    const event = this.driver.verifyWebhook
      ? await this.driver.verifyWebhook(rawBody, headers)
      : await this.defaultWebhookParser(rawBody);

    if (!event) {
      throw new Error('Unable to parse webhook payload');
    }

    const stored = await this.persistWebhook(event);
    await this.applyWebhookSideEffects(event, stored);
    return stored;
  }

  async runNightlyReconciliation(referenceDate = new Date()): Promise<ReconciliationResult> {
    const rounds = await this.db.getRounds();
    const transactions = await this.db.getTransactions();
    let processedRounds = 0;
    let assignments = 0;
    let refunds = 0;
    let skipped = 0;

    for (const round of rounds) {
      if (new Date(round.deadlineAt) > referenceDate) {
        continue;
      }

      const reservations = await this.db.getReservationsByRoundId(round.id);
      if (!reservations.length) {
        skipped += 1;
        continue;
      }

      const summary = computeProgress(round, reservations);
      const meetsGoal = round.goalType === 'reservations'
        ? summary.confirmedSlots >= round.goalValue
        : summary.confirmedAmount >= round.goalValue;
      const meetsPartial = summary.percent >= Math.round(round.partialThreshold * 100);

      const shouldAssign = round.rule === 'all_or_nothing' ? meetsGoal : meetsGoal || meetsPartial;
      processedRounds += 1;

      if (shouldAssign) {
        for (const reservation of reservations) {
          if (reservation.status !== 'assigned') {
            await this.db.updateReservation(reservation.id, { status: 'assigned' });
            assignments += 1;
          }
          const transaction = transactions.find(tx => tx.reservationId === reservation.id);
          if (transaction && transaction.status !== 'succeeded') {
            await this.db.updateTransaction(transaction.id, {
              status: 'succeeded',
              metadata: {
                ...(transaction.metadata ?? {}),
                reconciledAt: new Date().toISOString(),
                reconciliationRule: 'assignment'
              }
            });
          }
        }
        await this.db.updateRound(round.id, { status: meetsGoal ? 'fulfilled' : 'closed' });
      } else {
        for (const reservation of reservations) {
          if (reservation.status !== 'refunded') {
            const transaction = transactions.find(tx => tx.reservationId === reservation.id);
            if (transaction && transaction.status !== 'refunded') {
              const refund = await this.driver.refundPayment({
                transaction,
                reservation,
                amount: transaction.amount,
                currency: transaction.currency
              });
              await this.db.updateTransaction(transaction.id, {
                status: refund.status === 'refunded' ? 'refunded' : 'pending',
                rawResponse: refund.raw,
                metadata: {
                  ...(transaction.metadata ?? {}),
                  refundId: refund.providerId,
                  reconciledAt: new Date().toISOString(),
                  reconciliationRule: 'refund'
                }
              });
            }
            await this.db.updateReservation(reservation.id, { status: 'refunded' });
            refunds += 1;
          }
        }
        await this.db.updateRound(round.id, { status: 'not_met' });
      }
    }

    return { processedRounds, assignments, refunds, skipped };
  }

  private async defaultWebhookParser(rawBody: string): Promise<PaymentWebhookEvent | null> {
    try {
      const parsed = JSON.parse(rawBody);
      return {
        id: parsed.id ?? randomUUID(),
        type: parsed.type ?? 'simulated.event',
        provider: this.driver.name,
        reservationId: parsed.data?.object?.metadata?.reservationId,
        transactionId: parsed.data?.object?.metadata?.transactionId,
        raw: parsed
      };
    } catch {
      return null;
    }
  }

  private async persistWebhook(event: PaymentWebhookEvent): Promise<PaymentWebhook> {
    const record: PaymentWebhook = {
      id: event.id,
      provider: event.provider,
      eventType: event.type,
      payload: event.raw,
      reservationId: event.reservationId,
      transactionId: event.transactionId,
      receivedAt: new Date().toISOString(),
      status: 'pending'
    };
    const existing = await this.db.getPaymentWebhookById(event.id);
    if (existing) {
      return (
        await this.db.updatePaymentWebhook(event.id, {
          ...existing,
          ...record,
          payload: event.raw
        })
      ) ?? existing;
    }
    return this.db.createPaymentWebhook(record);
  }

  private async applyWebhookSideEffects(event: PaymentWebhookEvent, stored: PaymentWebhook): Promise<void> {
    let transaction: Transaction | null = null;

    if (event.transactionId) {
      transaction = await this.db.getTransactionById(event.transactionId);
    }

    if (!transaction && event.reservationId) {
      transaction = await this.db.getTransactionByReservationId(event.reservationId);
    }

    if (transaction) {
      const updates: Partial<Transaction> = {
        rawResponse: event.raw,
        externalId: event.externalReference ?? transaction.externalId ?? null
      };

      if (event.status === 'succeeded') {
        updates.status = 'succeeded';
        await this.db.updateReservation(transaction.reservationId, { status: 'confirmed' });
      }

      if (event.status === 'refunded') {
        updates.status = 'refunded';
        await this.db.updateReservation(transaction.reservationId, { status: 'refunded' });
      }

      await this.db.updateTransaction(transaction.id, updates);
    }

    await this.db.updatePaymentWebhook(stored.id, {
      status: 'processed',
      processedAt: new Date().toISOString()
    });
  }
}
