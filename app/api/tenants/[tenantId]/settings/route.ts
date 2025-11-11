import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/config";
import type { TenantSettings } from "@/lib/types";

type Params = { params: { tenantId: string } };

export async function GET(_req: Request, { params }: Params) {
  const { tenantId } = params;
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "tenantId requerido" }, { status: 400 });
  }

  const settings = await db.getTenantSettingsByTenantId(tenantId);
  if (!settings) {
    return NextResponse.json({ ok: false, error: "Configuración no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: settings });
}

export async function PUT(req: Request, { params }: Params) {
  const { tenantId } = params;
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "tenantId requerido" }, { status: 400 });
  }

  const existing = await db.getTenantSettingsByTenantId(tenantId);
  const body = await req.json();
  const now = new Date().toISOString();

  const settings: TenantSettings = {
    id: existing?.id ?? randomUUID(),
    tenantId,
    logoUrl: body.logoUrl ?? existing?.logoUrl ?? null,
    darkLogoUrl: body.darkLogoUrl ?? existing?.darkLogoUrl ?? null,
    squareLogoUrl: body.squareLogoUrl ?? existing?.squareLogoUrl ?? null,
    faviconUrl: body.faviconUrl ?? existing?.faviconUrl ?? null,
    primaryColor: body.primaryColor ?? existing?.primaryColor ?? null,
    primaryColorForeground:
      body.primaryColorForeground ?? existing?.primaryColorForeground ?? null,
    secondaryColor: body.secondaryColor ?? existing?.secondaryColor ?? null,
    accentColor: body.accentColor ?? existing?.accentColor ?? null,
    backgroundColor: body.backgroundColor ?? existing?.backgroundColor ?? null,
    surfaceColor: body.surfaceColor ?? existing?.surfaceColor ?? null,
    foregroundColor: body.foregroundColor ?? existing?.foregroundColor ?? null,
    fontFamily: body.fontFamily ?? existing?.fontFamily ?? null,
    metadata: body.metadata ?? existing?.metadata ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  const saved = await db.upsertTenantSettings(settings);
  return NextResponse.json({ ok: true, data: saved });
}
