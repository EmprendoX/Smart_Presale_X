import { getTranslations } from "next-intl/server";
import { AutomationManager } from "@/components/automations/AutomationManager";
import { Badge } from "@/components/ui/Badge";

export const revalidate = 0;

type Params = { locale: string };

export default async function AdminAutomationsPage({ params }: { params: Params }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "adminAutomations" });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Badge color="green">{t("badge")}</Badge>
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-neutral-600">{t("subtitle")}</p>
      </header>
      <AutomationManager />
    </div>
  );
}
