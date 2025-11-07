import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { fmtCurrency } from "@/lib/format";
import { DB, findRoundByProject, listPublishedProjects, byRoundReservations } from "@/lib/mockdb";
import { computeProgress } from "@/lib/rules";

export const revalidate = 0;

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations();
  const projects = await listPublishedProjects();
  
  const projectsWithData = await Promise.all(
    projects.map(async p => {
      const round = await findRoundByProject(p.id);
      const reservations = round ? await byRoundReservations(round.id) : [];
      const progress = round ? computeProgress(round, reservations) : null;
      return { project: p, round, progress, percent: progress ? progress.percent : 0 };
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">{t("home.title")}</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projectsWithData.map(({ project: p, round, percent }) => (
          <Card key={p.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-neutral-600">{p.city}, {p.country}</div>
                  </div>
                  <Badge color="green">{t("home.published")}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full rounded-md bg-neutral-100 mb-3" style={{ backgroundImage: `url(${p.images[0]})`, backgroundSize: "cover" }} />
                {round && (
                  <div className="space-y-2">
                    <Progress value={percent} />
                    <div className="flex items-center justify-between text-sm text-neutral-700">
                      <span>{t("home.progress")}: {percent}%</span>
                      <span>{t("home.deposit")}: {fmtCurrency(round.depositAmount, p.currency, locale)}</span>
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <Link className="text-brand hover:underline font-medium" href={`/p/${p.slug}`}>{t("home.viewDetail")}</Link>
                </div>
              </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}

