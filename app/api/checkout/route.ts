import { NextResponse } from "next/server";
import { payments } from "@/lib/config";

export async function POST(req: Request) {
  const body = await req.json();
  const { reservationId } = body || {};

  if (!reservationId) {
    return NextResponse.json({ ok: false, error: "reservationId requerido" }, { status: 400 });
  }

  try {
    const result = await payments.initiateReservationPayment(reservationId);
    return NextResponse.json({
      ok: true,
      data: {
        transactionId: result.transaction.id,
        reservationStatus: result.reservation.status,
        clientSecret: result.clientSecret,
        provider: payments.provider,
        nextAction: result.nextAction ?? null
      }
    });
  } catch (error: any) {
    const message = typeof error?.message === "string" ? error.message : "Error al iniciar el pago";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

