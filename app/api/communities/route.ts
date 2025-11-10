import { NextResponse } from "next/server";
import { db } from "@/lib/config";
import { Community } from "@/lib/types";

export async function GET() {
  const communities = await db.getCommunities();
  return NextResponse.json({ ok: true, data: communities });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    name,
    description,
    scope,
    projectId,
    roundId,
    tags,
    coverImage
  } = body || {};

  if (!name || !description) {
    return NextResponse.json({ ok: false, error: "Nombre y descripción son requeridos" }, { status: 400 });
  }

  const slugBase = name.toLowerCase().replace(/[^\w]+/g, "-");

  const community: Community = {
    id: crypto.randomUUID(),
    slug: slugBase,
    name,
    description,
    scope: scope === "campaign" ? "campaign" : "global",
    projectId: projectId || undefined,
    roundId: roundId || undefined,
    tags: Array.isArray(tags) ? tags : undefined,
    coverImage: coverImage || undefined,
    memberCount: 0,
    featuredPosts: []
  };

  const created = await db.createCommunity(community);
  return NextResponse.json({ ok: true, data: created });
}
