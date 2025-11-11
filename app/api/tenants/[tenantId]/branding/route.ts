import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/config";
import type { TenantBranding } from "@/lib/types";

type Params = { params: { tenantId: string } };

export async function GET(_req: Request, { params }: Params) {
  const { tenantId } = params;
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "tenantId requerido" }, { status: 400 });
  }

  const branding = await db.getTenantBrandingByTenantId(tenantId);
  if (!branding) {
    return NextResponse.json({ ok: false, error: "Branding no configurado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: branding });
}

export async function PUT(req: Request, { params }: Params) {
  const { tenantId } = params;
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "tenantId requerido" }, { status: 400 });
  }

  const existing = await db.getTenantBrandingByTenantId(tenantId);
  const body = await req.json();
  const now = new Date().toISOString();

  const branding: TenantBranding = {
    id: existing?.id ?? randomUUID(),
    tenantId,
    logoUrl: body.logoUrl ?? existing?.logoUrl ?? null,
    darkLogoUrl: body.darkLogoUrl ?? existing?.darkLogoUrl ?? null,
    primaryColor: body.primaryColor ?? existing?.primaryColor ?? null,
    secondaryColor: body.secondaryColor ?? existing?.secondaryColor ?? null,
    accentColor: body.accentColor ?? existing?.accentColor ?? null,
    backgroundColor: body.backgroundColor ?? existing?.backgroundColor ?? null,
    typography: body.typography ?? existing?.typography ?? null,
    buttons: body.buttons ?? existing?.buttons ?? null,
    metadata: body.metadata ?? existing?.metadata ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  const saved = await db.upsertTenantBranding(branding);
  return NextResponse.json({ ok: true, data: saved });
}
