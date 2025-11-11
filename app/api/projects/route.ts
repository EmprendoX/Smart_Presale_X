import { NextResponse } from "next/server";
import { db } from "@/lib/config";
import { Project } from "@/lib/types";

export async function GET() {
  const projects = await db.getProjects();
  const rounds = await db.getRounds();
  const data = projects.map(p => ({ ...p, round: rounds.find(r => r.projectId === p.id) || null }));
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    name,
    city,
    country,
    currency,
    description,
    developerId,
    images,
    videoUrl,
    ticker,
    totalUnits,
    attributes,
    specs,
    zone,
    propertyType,
    propertyPrice,
    developmentStage,
    propertyDetails,
    listingType,
    stage,
    availabilityStatus,
    askingPrice,
    tags,
    featured,
    automationReady,
    agentIds,
    seo
  } = body || {};

  if (!name || !developerId) return NextResponse.json({ ok: false, error: "Faltan campos" }, { status: 400 });

  const slug = name.toLowerCase().replace(/[^\w]+/g, "-");
  const generatedTicker = ticker || `SPS:${slug.substring(0, 5).toUpperCase()}`;

  const validListingType = listingType === "sale" ? "sale" : "presale";

  const p: Project = {
    id: crypto.randomUUID(),
    slug,
    name, city, country, currency,
    status: "review",
    tenantId: body?.tenantId || "tenant_default",
    images: images || [],
    videoUrl: videoUrl || undefined,
    description: description ?? "",
    developerId,
    createdAt: new Date().toISOString(),
    ticker: generatedTicker,
    totalUnits: totalUnits ? Number(totalUnits) : undefined,
    attributes: attributes || undefined,
    specs: specs || undefined,
    zone: zone || undefined,
    propertyType: propertyType || undefined,
    propertyPrice: propertyPrice ? Number(propertyPrice) : undefined,
    developmentStage: developmentStage || undefined,
    propertyDetails: propertyDetails || undefined,
    listingType: validListingType,
    stage: stage || developmentStage || undefined,
    availabilityStatus: availabilityStatus || (validListingType === "sale" ? "available" : "coming_soon"),
    askingPrice: askingPrice ? Number(askingPrice) : undefined,
    tags: Array.isArray(tags) ? tags : undefined,
    featured: Boolean(featured),
    automationReady: automationReady !== undefined ? Boolean(automationReady) : true,
    agentIds: Array.isArray(agentIds) ? agentIds : undefined,
    seo: seo || undefined
  };

  await db.createProject(p);
  return NextResponse.json({ ok: true, data: p });
}

