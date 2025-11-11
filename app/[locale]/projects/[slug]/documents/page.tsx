import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DocumentList } from "@/components/DocumentList";
import { SignatureWorkflow } from "@/components/investment-room/SignatureWorkflow";
import { findProjectBySlug } from "@/lib/mockdb";
import { db } from "@/lib/config";
import { fmtCurrency } from "@/lib/format";

export const revalidate = 0;

type Params = { locale: string; slug: string };

type SearchParams = { user?: string };

export default async function InvestmentRoomPage({
  params,
  searchParams
}: {
  params: Params;
  searchParams?: SearchParams;
}) {
  const { locale, slug } = params;
  const t = await getTranslations({ locale, namespace: "investmentRoom" });
  const project = await findProjectBySlug(slug);
  if (!project) return notFound();

  const [documents, round] = await Promise.all([
    db.getDocumentsByProjectId(project.id),
    db.getRoundByProjectId(project.id)
  ]);
  const users = await db.getUsers();
  const selectedUserId = searchParams?.user;
  const user = selectedUserId ? await db.getUserById(selectedUserId) : users[0] ?? null;

  const hasKyc = user?.kycStatus === "verified" || user?.kycStatus === "basic";
  const allowedRole = user?.role === "buyer" || user?.role === "admin" || user?.role === "developer";
  const canAccess = Boolean(user && hasKyc && allowedRole);

  const escrowAmount = round?.depositAmount ?? (project.askingPrice ? project.askingPrice * 0.1 : 25000);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge color="green">{t("securedArea")}</Badge>
        <h1 className="text-3xl font-semibold">{project.name} · {t("title")}</h1>
        <p className="text-sm text-neutral-600">{t("subtitle", { project: project.name })}</p>
      </header>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t("access.title")}</h2>
          <p className="text-sm text-neutral-600">{t("access.subtitle")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <div>
              <span className="font-medium">{t("access.viewer")}: </span>
              <span>{user ? user.name : t("access.anonymous")}</span>
            </div>
            <Badge color={hasKyc ? "green" : "neutral"}>{t(hasKyc ? "access.kycReady" : "access.kycMissing")}</Badge>
            <Badge color={allowedRole ? "green" : "neutral"}>{user?.role ?? "guest"}</Badge>
          </div>
          {!canAccess ? (
            <div className="rounded-md border border-dashed bg-neutral-50 p-4 text-sm text-neutral-600">
              <p className="font-medium">{t("access.restricted.title")}</p>
              <p className="mt-1">{t("access.restricted.message")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="primary">{t("access.actions.startKyc")}</Button>
                <Button size="sm" variant="secondary">{t("access.actions.inviteTeam")}</Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border bg-neutral-50 p-4 text-sm text-neutral-700 space-y-2">
              <p className="font-medium">{t("access.granted.title")}</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>{t("access.granted.point1")}</li>
                <li>{t("access.granted.point2")}</li>
                <li>{t("access.granted.point3")}</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {canAccess ? (
        <>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{t("documents.title")}</h2>
              <p className="text-sm text-neutral-600">{t("documents.subtitle")}</p>
            </CardHeader>
            <CardContent>
              <DocumentList documents={documents} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{t("signature.title")}</h2>
            </CardHeader>
            <CardContent>
              <SignatureWorkflow documents={documents} projectName={project.name} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{t("funding.title")}</h2>
              <p className="text-sm text-neutral-600">{t("funding.subtitle")}</p>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border p-4">
                <h3 className="text-sm font-semibold text-neutral-700">{t("funding.escrow")}</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  {t("funding.escrowDetail", {
                    amount: escrowAmount ? fmtCurrency(escrowAmount, project.currency, locale) : t("funding.dynamic")
                  })}
                </p>
              </div>
              <div className="rounded-md border p-4">
                <h3 className="text-sm font-semibold text-neutral-700">{t("funding.auditTrail")}</h3>
                <p className="mt-2 text-sm text-neutral-600">{t("funding.auditDetail")}</p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
