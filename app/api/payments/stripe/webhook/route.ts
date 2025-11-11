import { NextResponse } from "next/server";
import { payments } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const headers: Record<string, string | string[] | undefined> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  try {
    const event = await payments.handleWebhook(rawBody, headers);
    return NextResponse.json({ ok: true, data: { id: event.id, status: event.status } });
  } catch (error: any) {
    const message = typeof error?.message === "string" ? error.message : "Stripe webhook error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
