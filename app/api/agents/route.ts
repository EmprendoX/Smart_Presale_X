import { NextResponse } from "next/server";
import { db } from "@/lib/config";
import { IntelligentAgent } from "@/lib/types";

export async function GET() {
  const agents = await db.getAgents();
  return NextResponse.json({ ok: true, data: agents });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    name,
    persona,
    playbook,
    languages,
    handoffEmail,
    status,
    projectIds
  } = body || {};

  if (!name || !persona || !playbook) {
    return NextResponse.json({ ok: false, error: "Nombre, rol y playbook son obligatorios" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const agent: IntelligentAgent = {
    id: crypto.randomUUID(),
    name,
    persona,
    status: status === "ready" || status === "paused" ? status : "training",
    playbook,
    handoffEmail: handoffEmail || undefined,
    languages: Array.isArray(languages) && languages.length ? languages : ["es"],
    projectIds: Array.isArray(projectIds) ? projectIds : undefined,
    createdAt: now,
    updatedAt: now
  };

  const created = await db.createAgent(agent);
  return NextResponse.json({ ok: true, data: created });
}
