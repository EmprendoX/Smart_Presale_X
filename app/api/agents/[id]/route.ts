import { NextResponse } from "next/server";
import { db } from "@/lib/config";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  try {
    const updates: any = { ...body };
    if (updates.status && !["training", "ready", "paused"].includes(updates.status)) {
      return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
    }

    if (updates.languages && !Array.isArray(updates.languages)) {
      return NextResponse.json({ ok: false, error: "Languages debe ser un arreglo" }, { status: 400 });
    }

    updates.updatedAt = new Date().toISOString();

    const updated = await db.updateAgent(id, updates);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Agente no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || "Error al actualizar" }, { status: 500 });
  }
}
