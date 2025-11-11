import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/config";
import type { Client } from "@/lib/types";

type Params = { params: { tenantId: string } };

export async function GET(_req: Request, { params }: Params) {
  const { tenantId } = params;
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "tenantId requerido" }, { status: 400 });
  }
  const clients = await db.getClientsByTenantId(tenantId);
  return NextResponse.json({ ok: true, data: clients });
}

export async function POST(req: Request, { params }: Params) {
  const { tenantId } = params;
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "tenantId requerido" }, { status: 400 });
  }

  const body = await req.json();
  const { name, contactName, contactEmail, contactPhone, status, metadata } = body || {};

  if (!name) {
    return NextResponse.json({ ok: false, error: "name es obligatorio" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const client: Client = {
    id: randomUUID(),
    tenantId,
    name,
    contactName: contactName || null,
    contactEmail: contactEmail || null,
    contactPhone: contactPhone || null,
    status: status && ["active", "inactive", "invited"].includes(status) ? status : "active",
    metadata: metadata ?? null,
    createdAt: now,
    updatedAt: now
  };

  const created = await db.createClient(client);
  return NextResponse.json({ ok: true, data: created });
}
