"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { daysLeft } from "@/lib/format";
import { Progress } from "./ui/Progress";
import { Badge } from "./ui/Badge";
import { RoundStatus } from "@/lib/types";

type Props = {
  name: string;
  ticker?: string;
  deadlineAt?: string;
  percent: number;
  kpis: { label: string; value: string }[];
  status: RoundStatus;
};

export default function FinancialHeader({ name, ticker, deadlineAt, percent, kpis, status }: Props) {
  const t = useTranslations("project");
  const tCommon = useTranslations("common");
  const left = useMemo(() => (deadlineAt ? daysLeft(deadlineAt) : undefined), [deadlineAt]);
  const statusColor =
    status === "fulfilled" ? "green" : 
    status === "nearly_full" ? "yellow" : 
    status === "open" ? "neutral" : 
    status === "closed" ? "neutral" : "red";

  return (
    <div className="rounded-xl border p-4 bg-gradient-to-b from-white to-neutral-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-neutral-500">{ticker || "SPS:UNLISTED"}</div>
          <h1 className="text-2xl font-semibold">{name}</h1>
        </div>
        <Badge color={statusColor}>{tCommon("status")}: {t(`status.${status}`)}</Badge>
      </div>
      <div className="mt-3">
        <Progress value={percent} />
        <div className="mt-1 text-sm text-neutral-700">{t("progress")}: {percent}%</div>
      </div>
      <div className="mt-4 grid sm:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border bg-white p-3">
            <div className="text-xs text-neutral-500">{k.label}</div>
            <div className="text-base font-medium">{k.value}</div>
          </div>
        ))}
        {typeof left !== "undefined" && (
          <div className="rounded-lg border bg-white p-3">
            <div className="text-xs text-neutral-500">{t("kpis.deadline")}</div>
            <div className="text-base font-medium">{left} {tCommon("days")}</div>
          </div>
        )}
      </div>
    </div>
  );
}

