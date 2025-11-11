import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/config";
import type { User } from "@/lib/types";

export async function GET() {
  const users = await db.getUsers();
  return NextResponse.json({ ok: true, data: users });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, name, role, kycStatus, tenantId, email, metadata } = body || {};
  const fallbackTenantId = extractTenantId();

  if (!id || !name || !role || !kycStatus) {
    return NextResponse.json({ ok: false, error: "id, name, role y kycStatus son obligatorios" }, { status: 400 });
  }

  const user: User = {
    id,
    name,
    role,
    kycStatus,
    tenantId: tenantId || fallbackTenantId || "tenant_default",
    email: email || undefined,
    metadata: metadata ?? null
  };

  const saved = await db.upsertUser(user);
  return NextResponse.json({ ok: true, data: saved });
}

function extractTenantId(): string | null {
  const cookieStore = cookies();
  const encoded = cookieStore.get("tenant_settings")?.value;

  if (!encoded) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(encoded);
    const payload = JSON.parse(decoded);
    return (payload?.tenant?.id as string) ?? null;
  } catch (error) {
    console.error("[users] Failed to read tenant cookie", error);
    return null;
  }
}
