import { db } from "@/lib/config";

const csvEscape = (value: string) => {
  if (value.includes(",") || value.includes("\n") || value.includes("\"")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") ?? "en";

  const [transactions, reservations, rounds, projects] = await Promise.all([
    db.getTransactions(),
    db.getReservations(),
    db.getRounds(),
    db.getProjects()
  ]);

  const roundMap = new Map(rounds.map(round => [round.id, round] as const));
  const projectMap = new Map(projects.map(project => [project.id, project] as const));
  const reservationMap = new Map(reservations.map(reservation => [reservation.id, reservation] as const));

  const headers = [
    "transaction_id",
    "reservation_id",
    "project_name",
    "round_id",
    "amount",
    "currency",
    "status",
    "provider",
    "payout_at"
  ];

  const rows = transactions.map(tx => {
    const reservation = reservationMap.get(tx.reservationId);
    const round = reservation ? roundMap.get(reservation.roundId) ?? null : null;
    const project = round ? projectMap.get(round.projectId) ?? null : null;
    const amount = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: tx.currency,
      currencyDisplay: "code"
    }).format(tx.amount);
    return [
      tx.id,
      tx.reservationId,
      project?.name ?? "N/A",
      round?.id ?? "N/A",
      amount,
      tx.currency,
      tx.status,
      tx.provider,
      tx.payoutAt ?? ""
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(value => csvEscape(String(value))).join(","))
    .join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=payouts-${Date.now()}.csv`
    }
  });
}
