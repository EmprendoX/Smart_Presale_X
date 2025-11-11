import { NextResponse } from "next/server";
import { payments } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await payments.runNightlyReconciliation();
    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    const message = typeof error?.message === "string" ? error.message : "Error during reconciliation";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
