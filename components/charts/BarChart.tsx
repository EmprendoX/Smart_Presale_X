"use client";

import clsx from "clsx";

export type BarDatum = {
  label: string;
  value: number;
  color?: string;
};

interface BarChartProps {
  data: BarDatum[];
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function BarChart({ data, orientation = "horizontal", className }: BarChartProps) {
  const max = Math.max(...data.map(item => item.value), 0);
  if (!data.length || max === 0) {
    return <div className={clsx("text-sm text-neutral-500", className)}>Sin datos</div>;
  }

  if (orientation === "vertical") {
    return (
      <div className={clsx("flex items-end justify-start gap-4", className)}>
        {data.map(item => (
          <div key={item.label} className="flex flex-col items-center gap-2 text-xs">
            <div
              className="w-8 rounded-t bg-brand/80 text-[10px] text-white"
              style={{ height: `${(item.value / max) * 160 || 2}px`, backgroundColor: item.color }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="font-medium">{item.value}</span>
            <span className="text-neutral-500">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={clsx("space-y-3", className)}>
      {data.map(item => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{item.label}</span>
            <span className="font-semibold text-neutral-800">{item.value}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-100">
            <div
              className="h-2 rounded-full bg-brand"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
