import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { db } from "@/lib/config";
import { fmtCurrency, shortDate } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "adminPayouts" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription")
  };
}

const buildDownloadUrl = (locale: string) => `/api/admin/payouts/report?locale=${locale}&format=csv`;

export default async function AdminPayoutsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "adminPayouts" });

  const [transactions, reservations, rounds, projects] = await Promise.all([
    db.getTransactions(),
    db.getReservations(),
    db.getRounds(),
    db.getProjects()
  ]);

  const roundMap = new Map(rounds.map(round => [round.id, round] as const));
  const projectMap = new Map(projects.map(project => [project.id, project] as const));
  const reservationMap = new Map(reservations.map(reservation => [reservation.id, reservation] as const));

  const rows = transactions.map(tx => {
    const reservation = reservationMap.get(tx.reservationId);
    const round = reservation ? roundMap.get(reservation.roundId) ?? null : null;
    const project = round ? projectMap.get(round.projectId) ?? null : null;

    return {
      transactionId: tx.id,
      reservationId: tx.reservationId,
      projectName: project?.name ?? t("unknownProject"),
      roundId: round?.id ?? "-",
      amount: fmtCurrency(tx.amount, tx.currency, locale),
      rawAmount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      provider: tx.provider,
      payoutAt: tx.payoutAt ? shortDate(tx.payoutAt, locale) : "—"
    };
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.total += row.rawAmount;
      if (row.status === "succeeded") acc.succeeded += row.rawAmount;
      if (row.status === "refunded") acc.refunded += row.rawAmount;
      return acc;
    },
    { total: 0, succeeded: 0, refunded: 0 }
  );

  const formatTotal = (amount: number) => fmtCurrency(amount, rows[0]?.currency ?? "USD", locale);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-neutral-600">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href={buildDownloadUrl(locale)} download>
            {t("downloadCsv")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t("summaryTitle")}</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-neutral-500">{t("summary.totalVolume")}</dt>
              <dd className="text-lg font-semibold">{formatTotal(totals.total)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">{t("summary.succeeded")}</dt>
              <dd className="text-lg font-semibold">{formatTotal(totals.succeeded)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-neutral-500">{t("summary.refunded")}</dt>
              <dd className="text-lg font-semibold">{formatTotal(totals.refunded)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
              <th className="px-4 py-3">{t("table.transaction")}</th>
              <th className="px-4 py-3">{t("table.project")}</th>
              <th className="px-4 py-3">{t("table.round")}</th>
              <th className="px-4 py-3">{t("table.amount")}</th>
              <th className="px-4 py-3">{t("table.status")}</th>
              <th className="px-4 py-3">{t("table.provider")}</th>
              <th className="px-4 py-3">{t("table.payoutAt")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white text-sm">
            {rows.map(row => (
              <tr key={row.transactionId}>
                <td className="px-4 py-3 font-mono text-xs text-neutral-700">{row.transactionId}</td>
                <td className="px-4 py-3">{row.projectName}</td>
                <td className="px-4 py-3 text-xs text-neutral-500">{row.roundId}</td>
                <td className="px-4 py-3 font-semibold">{row.amount}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-1 text-xs capitalize text-neutral-600">
                    {t(`statuses.${row.status}` as const)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs uppercase text-neutral-500">{row.provider}</td>
                <td className="px-4 py-3 text-xs text-neutral-500">{row.payoutAt}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-neutral-500" colSpan={7}>
                  {t("empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
