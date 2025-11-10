import { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import {
  findProjectBySlug,
  findRoundByProject,
  byRoundReservations,
  listCommunities,
  listCommunitiesByProject,
  listAutomations,
  listAgents
} from "@/lib/mockdb";
import FinancialHeader from "@/components/FinancialHeader";
import Gallery from "@/components/Gallery";
import FeatureGrid from "@/components/FeatureGrid";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { fmtCurrency, shortDate } from "@/lib/format";
import { computeProgress } from "@/lib/rules";
import { Tabs } from "@/components/ui/Tabs";
import LineChart from "@/components/charts/LineChart";
import StudyList from "@/components/StudyList";
import SecondaryMarketPanel from "@/components/SecondaryMarketPanel";
import ReserveDialog from "@/components/ReserveDialog";
import { DocumentList } from "@/components/DocumentList";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/config";

export const revalidate = 0;

type Params = { locale: string; slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const project = await findProjectBySlug(params.slug);
  if (!project) return {};
  const title = project.seo?.title || `${project.name} · Smart Presale X`;
  const description = project.seo?.description || project.description;
  const image = project.seo?.image || project.images?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
      type: "website"
    },
    alternates: {
      canonical: `/${params.locale}/p/${project.slug}`
    }
  };
}

const availabilityLabel = (status: string | undefined, t: (key: string) => string) => {
  if (!status) return undefined;
  return t(`project.availability.${status}` as const);
};

export default async function ProjectPage({ params }: { params: Params }) {
  const { locale, slug } = params;
  const t = await getTranslations({ locale });
  const project = await findProjectBySlug(slug);
  if (!project) return notFound();

  const round = project.listingType === "presale" ? await findRoundByProject(project.id) : null;
  const reservations = round ? await byRoundReservations(round.id) : [];
  const summary = round ? computeProgress(round, reservations) : null;

  const [priceHistory, research, documents, communities, projectCommunities, automations, agents] = await Promise.all([
    db.getPriceHistoryByProjectId(project.id),
    db.getResearchByProjectId(project.id),
    db.getDocumentsByProjectId(project.id),
    listCommunities(),
    listCommunitiesByProject(project.id),
    listAutomations(),
    listAgents()
  ]);

  const assignedAgents = project.agentIds?.length
    ? agents.filter(agent => project.agentIds?.includes(agent.id))
    : [];
  const projectAutomations = automations.filter(auto => !auto.projectId || auto.projectId === project.id);
  const globalCommunity = communities.find(c => c.scope === "global");
  const availability = availabilityLabel(project.availabilityStatus, t);

  const kpis = (() => {
    const list: { label: string; value: string }[] = [];
    if (project.totalUnits) {
      const confirmed = summary?.confirmedSlots ?? 0;
      const availableUnits = project.totalUnits - confirmed;
      list.push({ label: t("project.kpis.totalUnits"), value: String(project.totalUnits) });
      list.push({ label: t("project.kpis.available"), value: String(Math.max(availableUnits, 0)) });
    }
    if (project.listingType === "sale" && project.askingPrice) {
      list.push({ label: t("project.propertyCost"), value: fmtCurrency(project.askingPrice, project.currency, locale) });
    }
    if (round?.groupSlots) {
      list.push({ label: t("project.kpis.presaleGroup"), value: String(round.groupSlots) });
    }
    if (round) {
      list.push({ label: t("project.kpis.depositPerSlot"), value: fmtCurrency(round.depositAmount, project.currency, locale) });
      list.push({ label: t("project.kpis.deadline"), value: shortDate(round.deadlineAt, locale) });
    }
    if (project.developmentStage) {
      list.push({ label: t("project.developmentStage"), value: project.developmentStage });
    }
    return list;
  })();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': project.listingType === 'presale' ? 'PreSale' : 'Offer',
    name: project.name,
    description: project.description,
    image: project.images,
    url: `https://smart-presale.example/${locale}/p/${project.slug}`,
    seller: {
      '@type': 'Organization',
      name: 'Smart Presale X'
    },
    offers: project.listingType === 'sale' && project.askingPrice ? {
      '@type': 'Offer',
      price: project.askingPrice,
      priceCurrency: project.currency
    } : undefined
  };

  const tabOverview = (
    <div className="space-y-6">
      {(project.propertyType || project.askingPrice || project.developmentStage || project.propertyDetails) && (
        <Card>
          <CardHeader><h3 className="text-lg">{t("project.propertyInfo")}</h3></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.propertyType && (
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-neutral-500">{t("project.propertyType")}</div>
                  <div className="font-medium text-base mt-1">{project.propertyType}</div>
                </div>
              )}
              {project.askingPrice && (
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-neutral-500">{t("project.propertyCost")}</div>
                  <div className="font-medium text-base mt-1">{fmtCurrency(project.askingPrice, project.currency, locale)}</div>
                </div>
              )}
              {project.developmentStage && (
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-neutral-500">{t("project.developmentStage")}</div>
                  <div className="font-medium text-base mt-1">{project.developmentStage}</div>
                </div>
              )}
              {project.propertyDetails?.bedrooms !== undefined && (
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-neutral-500">{t("project.bedrooms")}</div>
                  <div className="font-medium text-base mt-1">{project.propertyDetails.bedrooms}</div>
                </div>
              )}
              {project.propertyDetails?.bathrooms !== undefined && (
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-neutral-500">{t("project.bathrooms")}</div>
                  <div className="font-medium text-base mt-1">{project.propertyDetails.bathrooms}</div>
                </div>
              )}
              {project.propertyDetails?.surfaceArea !== undefined && (
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-neutral-500">{t("project.surfaceArea")}</div>
                  <div className="font-medium text-base mt-1">{project.propertyDetails.surfaceArea} m²</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {project.videoUrl && (
        <Card>
          <CardHeader><h3 className="text-lg">{t("project.promotionalVideo")}</h3></CardHeader>
          <CardContent>
            <VideoPlayer url={project.videoUrl} />
          </CardContent>
        </Card>
      )}
      <Gallery images={project.images} />
      <FeatureGrid attributes={project.attributes} specs={project.specs} />
      <Card>
        <CardHeader><h3 className="text-lg">{t("project.zoneAndEnvironment")}</h3></CardHeader>
        <CardContent className="text-sm text-neutral-800 space-y-2">
          <p>{project.zone?.summary}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <div className="text-xs text-neutral-500">{t("project.golf")}</div>
              <ul className="list-disc pl-5">
                {project.zone?.golf?.map(g => <li key={g}>{g}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-xs text-neutral-500">{t("project.schools")}</div>
              <ul className="list-disc pl-5">
                {project.zone?.schools?.map(g => <li key={g}>{g}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-xs text-neutral-500">{t("project.transport")}</div>
              <ul className="list-disc pl-5">
                {project.zone?.transport?.map(g => <li key={g}>{g}</li>)}
              </ul>
            </div>
            <div>
              <div className="text-xs text-neutral-500">{t("project.retail")}</div>
              <ul className="list-disc pl-5">
                {project.zone?.retail?.map(g => <li key={g}>{g}</li>)}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h3 className="text-lg">{t("project.automation.title")}</h3>
          <p className="text-sm text-neutral-600">{t("project.automation.subtitle")}</p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-neutral-500">{t("project.automation.workflowCount")}</div>
            <div className="text-lg font-semibold">{projectAutomations.length}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-neutral-500">{t("project.automation.agentCount")}</div>
            <div className="text-lg font-semibold">{assignedAgents.length}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-neutral-500">{t("project.automation.contact")}</div>
            <div className="text-sm text-neutral-700">{assignedAgents[0]?.handoffEmail || "automations@smartpresale.ai"}</div>
          </div>
        </CardContent>
      </Card>
      {(projectCommunities.length > 0 || globalCommunity) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg">{t("project.community.title")}</h3>
            <p className="text-sm text-neutral-600">{t("project.community.subtitle")}</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {globalCommunity && (
              <Link href={`/community/${globalCommunity.slug}`} className="text-brand hover:underline">
                {t("project.community.global")}
              </Link>
            )}
            {projectCommunities.map(community => (
              <div key={community.id} className="rounded-md border p-3">
                <div className="font-medium">{community.name}</div>
                <div className="text-xs text-neutral-500">{t("project.community.members", { count: community.memberCount })}</div>
                <Link href={`/community/${community.slug}`} className="text-brand hover:underline text-xs">
                  {t("project.community.join")}
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const tabDocuments = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg">{t("project.documents.title")}</h3>
          <p className="text-sm text-neutral-600 mt-1">{t("project.documents.description")}</p>
        </CardHeader>
        <CardContent>
          <DocumentList documents={documents} />
        </CardContent>
      </Card>
    </div>
  );

  const tabResearch = (
    <div className="space-y-6">
      <Card>
        <CardHeader><h3 className="text-lg">{t("project.research.title")}</h3></CardHeader>
        <CardContent><StudyList items={research} /></CardContent>
      </Card>
    </div>
  );

  const tabMarket = (
    <div className="space-y-6">
      <Card>
        <CardHeader><h3 className="text-lg">{t("project.market.title")}</h3></CardHeader>
        <CardContent>
          <LineChart data={priceHistory} />
          {priceHistory.length > 1 && (
            <div className="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border p-2">
                <div className="text-xs text-neutral-500">{t("project.market.last")}</div>
                <div className="font-medium">{priceHistory[priceHistory.length - 1].price} {project.currency}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-xs text-neutral-500">{t("project.market.first")}</div>
                <div className="font-medium">{priceHistory[0].price} {project.currency}</div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-xs text-neutral-500">{t("project.market.variation")}</div>
                <div className="font-medium">
                  {((priceHistory[priceHistory.length - 1].price - priceHistory[0].price) / priceHistory[0].price * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
          <p className="mt-2 text-xs text-neutral-500">{t("project.market.note")}</p>
        </CardContent>
      </Card>
    </div>
  );

  const tabSecondary = project.listingType === "presale" && round ? (
    <SecondaryMarketPanel projectId={project.id} roundId={round.id} currency={project.currency} />
  ) : (
    <Card>
      <CardContent className="py-8 text-center text-neutral-600">
        {project.listingType === "sale" ? t("project.secondary.saleMessage") : t("project.secondary.noRound")}
      </CardContent>
    </Card>
  );

  const tabTimeline = (
    <div className="space-y-6">
      <Card>
        <CardHeader><h3 className="text-lg">{t("project.timeline.title")}</h3></CardHeader>
        <CardContent className="text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("project.timeline.presaleStart")}: {shortDate(project.createdAt, locale)}</li>
            {round && (
              <li>
                {t("project.timeline.currentDeadline")}: {shortDate(round.deadlineAt, locale)} (
                <a className="text-brand hover:underline" href={`/api/ics-round?roundId=${round.id}`}>
                  {t("project.timeline.addToCalendar")}
                </a>)
              </li>
            )}
            <li>{t("project.timeline.estimatedDelivery")}: {project.specs?.["Entrega"] ?? "—"}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <Script id="project-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <FinancialHeader
        name={project.name}
        ticker={project.ticker}
        listingType={project.listingType}
        stage={project.stage || project.developmentStage}
        availability={availability}
        deadlineAt={round?.deadlineAt}
        percent={summary?.percent}
        showProgress={project.listingType === "presale" && !!round}
        kpis={kpis}
        status={round?.status}
      />

      <Tabs
        tabs={[
          { key: "overview", label: t("project.tabs.overview"), content: tabOverview },
          { key: "documents", label: t("project.tabs.documents"), content: tabDocuments },
          { key: "research", label: t("project.tabs.research"), content: tabResearch },
          { key: "market", label: t("project.tabs.market"), content: tabMarket },
          { key: "secondary", label: t("project.tabs.secondary"), content: tabSecondary },
          { key: "timeline", label: t("project.tabs.timeline"), content: tabTimeline }
        ]}
      />

      <Card>
        <CardHeader><h3 className="text-lg">{t("project.actions.title")}</h3></CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neutral-700">
            {project.listingType === "presale" && round
              ? `${round.groupSlots ? `${t("project.actions.group")}: ${round.groupSlots} slots. ` : ""}${t("project.actions.depositPerSlot")}: ${fmtCurrency(round.depositAmount, project.currency, locale)}.`
              : t("project.actions.saleDescription")}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {project.listingType === "presale" && round ? (
              <ReserveDialog project={project} round={round} />
            ) : (
              <Link href={globalCommunity ? `/community/${globalCommunity.slug}` : "/community"} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                {t("project.actions.contactSales")}
              </Link>
            )}
            <Link href={`/dashboard`} className="text-brand hover:underline text-sm">{t("project.actions.viewMyReservations")}</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
