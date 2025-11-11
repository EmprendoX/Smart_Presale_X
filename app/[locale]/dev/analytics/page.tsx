import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BarChart } from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import { db } from "@/lib/config";
import { fmtCurrency } from "@/lib/format";

export const revalidate = 0;

type Params = { locale: string };

type TimelinePoint = {
  ts: string;
  price: number;
};

export default async function AnalyticsPage({ params }: { params: Params }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "devAnalytics" });

  const [reservations, transactions, projects, rounds, automations] = await Promise.all([
    db.getReservations(),
    db.getTransactions(),
    db.getProjects(),
    db.getRounds(),
    db.getAutomations()
  ]);

  const totalLeads = reservations.length;
  const confirmed = reservations.filter(reservation => reservation.status === "confirmed").length;
  const conversionRate = totalLeads > 0 ? confirmed / totalLeads : 0;
  const succeededTransactions = transactions.filter(tx => tx.status === "succeeded");
  const totalRevenue = succeededTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const leadSources = reservations.reduce<Record<string, number>>((acc, reservation) => {
    const source = reservation.leadSource ?? "Direct";
    acc[source] = (acc[source] ?? 0) + 1;
    return acc;
  }, {});

  const campaigns = new Set(
    reservations
      .map(reservation => reservation.campaign)
      .filter((campaign): campaign is string => Boolean(campaign))
  );

  const engagementDurations = reservations
    .filter(reservation => reservation.lastEngagementAt)
    .map(reservation => {
      const created = new Date(reservation.createdAt).getTime();
      const last = new Date(reservation.lastEngagementAt as string).getTime();
      return Math.max(0, (last - created) / (1000 * 60 * 60));
    });

  const avgEngagementHours =
    engagementDurations.length > 0
      ? engagementDurations.reduce((sum, hours) => sum + hours, 0) / engagementDurations.length
      : 0;

  const timelineMap = reservations.reduce<Record<string, { leads: number; wins: number }>>((acc, reservation) => {
    const day = reservation.createdAt.slice(0, 10);
    if (!acc[day]) acc[day] = { leads: 0, wins: 0 };
    acc[day].leads += 1;
    if (reservation.status === "confirmed") acc[day].wins += 1;
    return acc;
  }, {});

  const timeline: TimelinePoint[] = Object.entries(timelineMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ts, values]) => ({
      ts,
      price: values.leads === 0 ? 0 : (values.wins / values.leads) * 100
    }));

  const leadOriginData = Object.entries(leadSources).map(([label, value], index) => ({
    label,
    value,
    color: ["#0ea5e9", "#10b981", "#6366f1", "#f97316", "#ef4444"][index % 5]
  }));

  const activeRounds = rounds.filter(round => round.status === "open").length;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge color="green">Supabase realtime</Badge>
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-neutral-600">{t("subtitle")}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-wide text-neutral-500">{t("metrics.totalLeads")}</p>
            <div className="text-2xl font-semibold">{totalLeads}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-wide text-neutral-500">{t("metrics.conversion")}</p>
            <div className="text-2xl font-semibold">{(conversionRate * 100).toFixed(1)}%</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-wide text-neutral-500">{t("metrics.revenue")}</p>
            <div className="text-2xl font-semibold">{fmtCurrency(totalRevenue, "USD", locale)}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-wide text-neutral-500">{t("metrics.automations")}</p>
            <div className="text-2xl font-semibold">{automations.filter(auto => auto.status === "active").length}</div>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{t("leadOrigins.title")}</h2>
            <p className="text-sm text-neutral-600">{t("leadOrigins.subtitle")}</p>
          </CardHeader>
          <CardContent>
            <BarChart data={leadOriginData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{t("conversionTimeline.title")}</h2>
            <p className="text-sm text-neutral-600">{t("conversionTimeline.subtitle")}</p>
          </CardHeader>
          <CardContent>
            <LineChart data={timeline} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold">{t("insights.engagement")}</h3>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-600">
            <p>{t("insights.engagementCopy", { hours: avgEngagementHours.toFixed(1) })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold">{t("insights.campaigns")}</h3>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-600">
            <p>{t("insights.campaignCopy", { count: campaigns.size })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold">{t("insights.rounds")}</h3>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-600">
            <p>{t("insights.roundCopy", { count: activeRounds, projects: projects.length })}</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
