import { NextResponse } from "next/server";
import { db } from "@/lib/config";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const community = await db.getCommunityBySlug(slug);
  if (!community) {
    return NextResponse.json({ ok: false, error: "Comunidad no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: community });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json();
  try {
    const community = await db.getCommunityBySlug(slug);
    if (!community) {
      return NextResponse.json({ ok: false, error: "Comunidad no encontrada" }, { status: 404 });
    }

    const updates: any = { ...body };
    if (updates.memberCount !== undefined) {
      updates.memberCount = Number(updates.memberCount);
    }

    const updated = await db.updateCommunity(community.id, updates);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "No se pudo actualizar" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || "Error interno" }, { status: 500 });
  }
}
