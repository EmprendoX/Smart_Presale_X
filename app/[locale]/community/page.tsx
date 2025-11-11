import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/routing";
import { listCommunities } from "@/lib/mockdb";
import { getTranslations } from "next-intl/server";

export const revalidate = 0;

export default async function CommunitiesPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "communityPage" });
  const communities = await listCommunities();
  const globalCommunities = communities.filter(c => c.scope === "global");
  const campaignCommunities = communities.filter(c => c.scope === "campaign");

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-neutral-600">{t("subtitle")}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("globalTitle")}</h2>
        {globalCommunities.length === 0 ? (
          <Card><CardContent className="py-6 text-neutral-600">{t("emptyGlobal")}</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {globalCommunities.map(community => (
              <Card key={community.id} className="h-full">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{community.name}</h3>
                    <Badge color="green">{t("scope.global")}</Badge>
                  </div>
                  <p className="text-sm text-neutral-600">{community.description}</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-neutral-700">
                  <div className="text-xs text-neutral-500">{t("members", { count: community.memberCount })}</div>
                  {community.threads?.length ? (
                    <div className="text-xs text-neutral-500">{t("threads", { count: community.threads.length })}</div>
                  ) : null}
                  {community.badges?.length ? (
                    <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500">
                      {community.badges.slice(0, 3).map(badge => (
                        <span key={badge.id} className="rounded-full bg-neutral-100 px-2 py-1">🏅 {badge.label}</span>
                      ))}
                    </div>
                  ) : null}
                  {community.tags?.length ? (
                    <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                      {community.tags.map(tag => (
                        <span key={tag} className="rounded-full bg-neutral-100 px-2 py-1">#{tag}</span>
                      ))}
                    </div>
                  ) : null}
                  <Link href={`/community/${community.slug}`} className="text-brand hover:underline text-sm">
                    {t("open")}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("campaignTitle")}</h2>
        {campaignCommunities.length === 0 ? (
          <Card><CardContent className="py-6 text-neutral-600">{t("emptyCampaign")}</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {campaignCommunities.map(community => (
              <Card key={community.id} className="h-full">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{community.name}</h3>
                    <Badge color="neutral">{t("scope.campaign")}</Badge>
                  </div>
                  <p className="text-sm text-neutral-600">{community.description}</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-neutral-700">
                  <div className="text-xs text-neutral-500">{t("members", { count: community.memberCount })}</div>
                  {community.threads?.length ? (
                    <div className="text-xs text-neutral-500">{t("threads", { count: community.threads.length })}</div>
                  ) : null}
                  {community.badges?.length ? (
                    <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500">
                      {community.badges.slice(0, 2).map(badge => (
                        <span key={badge.id} className="rounded-full bg-neutral-100 px-2 py-1">🏅 {badge.label}</span>
                      ))}
                    </div>
                  ) : null}
                  {community.tags?.length ? (
                    <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                      {community.tags.map(tag => (
                        <span key={tag} className="rounded-full bg-neutral-100 px-2 py-1">#{tag}</span>
                      ))}
                    </div>
                  ) : null}
                  <Link href={`/community/${community.slug}`} className="text-brand hover:underline text-sm">
                    {t("open")}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
