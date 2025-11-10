import { NextResponse } from "next/server";
import { db } from "@/lib/config";
import { AutomationWorkflow } from "@/lib/types";

export async function GET() {
  const automations = await db.getAutomations();
  return NextResponse.json({ ok: true, data: automations });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    name,
    description,
    trigger,
    channel,
    projectId,
    agentId,
    status,
    metadata
  } = body || {};

  if (!name || !trigger || !channel) {
    return NextResponse.json({ ok: false, error: "Nombre, trigger y canal son obligatorios" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const workflow: AutomationWorkflow = {
    id: crypto.randomUUID(),
    name,
    description: description || "",
    trigger,
    channel,
    status: status === "active" || status === "paused" ? status : "draft",
    projectId: projectId || undefined,
    agentId: agentId || undefined,
    createdAt: now,
    updatedAt: now,
    metadata: metadata && typeof metadata === "object" ? metadata : undefined
  };

  const created = await db.createAutomation(workflow);
  return NextResponse.json({ ok: true, data: created });
}
