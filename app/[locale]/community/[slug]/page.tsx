import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Link } from "@/i18n/routing";
import { listCommunities, findCommunityBySlug } from "@/lib/mockdb";
import { NotificationPreferences } from "@/components/community/NotificationPreferences";
import { ModerationPanel } from "@/components/community/ModerationPanel";
import { BadgeShowcase } from "@/components/community/BadgeShowcase";

export const revalidate = 0;

type Params = { locale: string; slug: string };

export default async function CommunityDetailPage({ params }: { params: Params }) {
  const { locale, slug } = params;
  const t = await getTranslations({ locale, namespace: "communityPage" });
  const community = await findCommunityBySlug(slug);
  if (!community) return notFound();
  const related = (await listCommunities()).filter(c => c.scope === community.scope && c.id !== community.id).slice(0, 3);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Badge color={community.scope === "global" ? "green" : "neutral"}>
          {community.scope === "global" ? t("scope.global") : t("scope.campaign")}
        </Badge>
        <h1 className="text-3xl font-semibold">{community.name}</h1>
        <p className="text-sm text-neutral-600">{community.description}</p>
      </header>

      {community.notificationChannels?.length ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{t("notifications.title")}</h2>
            <p className="text-sm text-neutral-600">{t("notifications.subtitle")}</p>
          </CardHeader>
          <CardContent>
            <NotificationPreferences channels={community.notificationChannels} communityName={community.name} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t("members", { count: community.memberCount })}</h2>
          <p className="text-sm text-neutral-600">{t("detailSubtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-neutral-700">
          {community.tags?.length ? (
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-500">{t("tags")}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {community.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-neutral-100 px-2 py-1 text-xs">#{tag}</span>
                ))}
              </div>
            </div>
          ) : null}
          {community.featuredPosts?.length ? (
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-wide text-neutral-500">{t("featured")}</div>
              {community.featuredPosts.map(post => (
                <div key={post.id} className="rounded-md border p-3">
                  <div className="font-medium">{post.title}</div>
                  {post.excerpt && <p className="text-xs text-neutral-500 mt-1">{post.excerpt}</p>}
                  {post.author && <div className="text-xs text-neutral-400 mt-2">{post.author}</div>}
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {community.threads?.length ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{t("forum.title")}</h2>
            <p className="text-sm text-neutral-600">{t("forum.subtitle")}</p>
          </CardHeader>
          <CardContent>
            <ModerationPanel threads={community.threads} />
          </CardContent>
        </Card>
      ) : null}

      {community.badges?.length ? (
        <Card>
          <CardContent>
            <BadgeShowcase badges={community.badges} />
          </CardContent>
        </Card>
      ) : null}

      {related.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t("related")}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {related.map(item => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{item.name}</h3>
                    <Badge color={item.scope === "global" ? "green" : "neutral"}>{item.scope === "global" ? t("scope.global") : t("scope.campaign")}</Badge>
                  </div>
                </CardHeader>
            <CardContent className="space-y-2 text-sm text-neutral-700">
              <p>{item.description}</p>
              <Link href={`/community/${item.slug}`} className="text-brand hover:underline text-xs">{t("open")}</Link>
            </CardContent>
          </Card>
        ))}
          </div>
        </section>
      )}
    </div>
  );
}
