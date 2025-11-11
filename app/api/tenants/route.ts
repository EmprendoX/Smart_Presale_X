import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/config";
import type { Tenant } from "@/lib/types";

export async function GET() {
  const tenants = await db.getTenants();
  return NextResponse.json({ ok: true, data: tenants });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, slug, name, status, region, metadata } = body || {};

  if (!slug || !name) {
    return NextResponse.json({ ok: false, error: "slug y name son obligatorios" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const tenant: Tenant = {
    id: id || randomUUID(),
    slug,
    name,
    status: status && ["active", "inactive", "suspended"].includes(status) ? status : "active",
    region: region || null,
    metadata: metadata ?? null,
    createdAt: now,
    updatedAt: now
  };

  const created = await db.createTenant(tenant);
  return NextResponse.json({ ok: true, data: created });
}
