import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { listPublishedProjects } from "@/lib/mockdb";
import { fmtCurrency } from "@/lib/format";
import { Project } from "@/lib/types";

export const revalidate = 0;

type Params = { locale: string };

type ListingCardProps = {
  project: Project;
  locale: string;
  t: (key: string, values?: Record<string, any>) => string;
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "home" });
  const title = t("seo.title");
  const description = t("seo.description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://smart-presale.example/${params.locale}`,
      siteName: "Smart Presale X",
      type: "website"
    },
    alternates: {
      canonical: `/${params.locale}`
    }
  };
}

const ListingCard = ({ project, locale, t }: ListingCardProps) => {
  const price = project.askingPrice
    ? fmtCurrency(project.askingPrice, project.currency, locale)
    : null;
  const propertyType = project.propertyType;

  return (
    <Card className="overflow-hidden border-neutral-200 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-neutral-900">{project.name}</h3>
          <p className="text-sm text-neutral-600">
            {project.city}, {project.country}
          </p>
        </div>
        {propertyType ? (
          <p className="text-sm text-neutral-500">{propertyType}</p>
        ) : null}
        {price ? (
          <p className="text-sm font-medium text-neutral-900">
            {t("listing.price", { price })}
          </p>
        ) : null}
        <Link
          href={`/p/${project.slug}`}
          className="inline-flex text-sm font-medium text-brand hover:underline"
        >
          {t("listing.viewDetail")}
        </Link>
      </CardContent>
    </Card>
  );
};

export default async function HomePage({ params }: { params: Params }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "home" });
  const projects = await listPublishedProjects();

  const immediateListings = projects.filter(project => project.listingType === "sale");
  const presaleListings = projects.filter(project => project.listingType === "presale");

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-3xl bg-neutral-900 px-10 py-12 text-white shadow-sm">
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold md:text-4xl">{t("hero.title")}</h1>
            <p className="text-lg text-neutral-200">{t("hero.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/projects#sale"
              className="inline-flex items-center rounded-md bg-white px-5 py-2 text-sm font-medium text-neutral-900 shadow hover:bg-neutral-100"
            >
              {t("hero.ctaImmediate")}
            </Link>
            <Link
              href="/projects#presale"
              className="inline-flex items-center rounded-md border border-white/30 px-5 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              {t("hero.ctaPresale")}
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-neutral-900">{t("shortcuts.title")}</h2>
          <p className="text-sm text-neutral-600">{t("shortcuts.subtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-neutral-200">
            <CardContent className="space-y-3 p-6">
              <h3 className="text-lg font-semibold text-neutral-900">{t("shortcuts.immediate.title")}</h3>
              <p className="text-sm text-neutral-600">{t("shortcuts.immediate.description")}</p>
              <Link href="/projects#sale" className="inline-flex text-sm font-medium text-brand hover:underline">
                {t("shortcuts.immediate.cta")}
              </Link>
            </CardContent>
          </Card>
          <Card className="border-neutral-200">
            <CardContent className="space-y-3 p-6">
              <h3 className="text-lg font-semibold text-neutral-900">{t("shortcuts.presale.title")}</h3>
              <p className="text-sm text-neutral-600">{t("shortcuts.presale.description")}</p>
              <Link href="/projects#presale" className="inline-flex text-sm font-medium text-brand hover:underline">
                {t("shortcuts.presale.cta")}
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-neutral-900">{t("search.title")}</h2>
          <p className="text-sm text-neutral-600">{t("search.subtitle")}</p>
        </div>
        <form className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:flex-row">
          <div className="flex-1">
            <Input placeholder={t("search.placeholder") as string} />
          </div>
          <Button type="button" variant="secondary" className="sm:w-auto">
            {t("search.cta")}
          </Button>
        </form>
      </section>

      <section id="sale" className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-neutral-900">{t("sections.immediateHeading")}</h2>
          <p className="text-sm text-neutral-600">{t("sections.immediateDescription")}</p>
        </div>
        {immediateListings.length === 0 ? (
          <Card className="border-neutral-200">
            <CardContent className="py-8 text-center text-sm text-neutral-600">
              {t("sections.immediateEmpty")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {immediateListings.map(project => (
              <ListingCard key={project.id} project={project} locale={locale} t={t} />
            ))}
          </div>
        )}
      </section>

      <section id="presale" className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-neutral-900">{t("sections.presaleHeading")}</h2>
          <p className="text-sm text-neutral-600">{t("sections.presaleDescription")}</p>
        </div>
        {presaleListings.length === 0 ? (
          <Card className="border-neutral-200">
            <CardContent className="py-8 text-center text-sm text-neutral-600">
              {t("sections.presaleEmpty")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {presaleListings.map(project => (
              <ListingCard key={project.id} project={project} locale={locale} t={t} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-neutral-900">{t("quickLinks.title")}</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/projects#sale"
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50"
          >
            {t("quickLinks.immediate")}
          </Link>
          <Link
            href="/projects#presale"
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50"
          >
            {t("quickLinks.presale")}
          </Link>
        </div>
      </section>
    </div>
  );
}
