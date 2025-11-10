"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { daysLeft } from "@/lib/format";
import { Progress } from "./ui/Progress";
import { Badge } from "./ui/Badge";
import { ListingType, RoundStatus } from "@/lib/types";

type Props = {
  name: string;
  ticker?: string;
  listingType: ListingType;
  stage?: string;
  availability?: string;
  deadlineAt?: string;
  percent?: number;
  showProgress?: boolean;
  kpis: { label: string; value: string }[];
  status?: RoundStatus;
};

export default function FinancialHeader({
  name,
  ticker,
  listingType,
  stage,
  availability,
  deadlineAt,
  percent = 0,
  showProgress = true,
  kpis,
  status
}: Props) {
  const t = useTranslations("project");
  const tCommon = useTranslations("common");
  const left = useMemo(() => (deadlineAt ? daysLeft(deadlineAt) : undefined), [deadlineAt]);
  const statusColor = status
    ? status === "fulfilled"
      ? "green"
      : status === "nearly_full"
      ? "yellow"
      : status === "open"
      ? "neutral"
      : status === "closed"
      ? "neutral"
      : "red"
    : "neutral";

  return (
    <div className="rounded-xl border p-4 bg-gradient-to-b from-white to-neutral-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs text-neutral-500">{ticker || "SPS:UNLISTED"}</div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{name}</h1>
            <Badge color={listingType === "presale" ? "green" : "neutral"}>
              {listingType === "presale" ? t("labels.presale") : t("labels.sale")}
            </Badge>
            {stage && <Badge color="neutral">{stage}</Badge>}
          </div>
          {availability && (
            <div className="text-xs text-neutral-500">{availability}</div>
          )}
        </div>
        {status && (
          <Badge color={statusColor}>{tCommon("status")}: {t(`status.${status}`)}</Badge>
        )}
      </div>
      {showProgress && (
        <div className="mt-3">
          <Progress value={percent} />
          <div className="mt-1 text-sm text-neutral-700">{t("progress")}: {percent}%</div>
        </div>
      )}
      <div className="mt-4 grid sm:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border bg-white p-3">
            <div className="text-xs text-neutral-500">{k.label}</div>
            <div className="text-base font-medium">{k.value}</div>
          </div>
        ))}
        {typeof left !== "undefined" && showProgress && (
          <div className="rounded-lg border bg-white p-3">
            <div className="text-xs text-neutral-500">{t("kpis.deadline")}</div>
            <div className="text-base font-medium">{left} {tCommon("days")}</div>
          </div>
        )}
      </div>
    </div>
  );
}

