import { NextResponse } from "next/server";
import { db } from "@/lib/config";
import type { User } from "@/lib/types";

export async function GET() {
  const users = await db.getUsers();
  return NextResponse.json({ ok: true, data: users });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, name, role, kycStatus, tenantId, email, metadata } = body || {};

  if (!id || !name || !role || !kycStatus) {
    return NextResponse.json({ ok: false, error: "id, name, role y kycStatus son obligatorios" }, { status: 400 });
  }

  const user: User = {
    id,
    name,
    role,
    kycStatus,
    tenantId: tenantId || undefined,
    email: email || undefined,
    metadata: metadata ?? null
  };

  const saved = await db.upsertUser(user);
  return NextResponse.json({ ok: true, data: saved });
}
