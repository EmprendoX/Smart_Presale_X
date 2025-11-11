"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { PricePoint } from "@/lib/types";

export default function LineChart({ data, height = 160 }: { data: PricePoint[]; height?: number }) {
  const t = useTranslations("project.market");
  const { path, minY, maxY, minX, maxX } = useMemo(() => {
    if (!data?.length) return { path: "", minY: 0, maxY: 0, minX: 0, maxX: 1 };

    const xs = data.map((d) => new Date(d.ts).getTime());
    const ys = data.map((d) => d.price);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = 600;
    const pad = 8;

    const scaleX = (t: number) => pad + ((t - minX) / (maxX - minX || 1)) * (width - pad * 2);
    const scaleY = (v: number) => height - pad - ((v - minY) / (maxY - minY || 1)) * (height - pad * 2);

    const p = data.map((d, i) => 
      `${i ? "L" : "M"} ${scaleX(new Date(d.ts).getTime())} ${scaleY(d.price)}`
    ).join(" ");

    return { path: p, minY, maxY, minX, maxX };
  }, [data, height]);

  if (!data?.length) return <div className="text-sm text-neutral-500">{t("noData")}</div>;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={600} height={height} className="rounded-md border bg-white">
        <path d={path} fill="none" stroke="currentColor" strokeWidth={2} className="text-brand" />
      </svg>
      <div className="mt-2 text-xs text-neutral-600">
        {t("range")}: {minY.toFixed(2)} – {maxY.toFixed(2)} ({t("lastPrice")}: {data[data.length - 1].price.toFixed(2)})
      </div>
    </div>
  );
}

