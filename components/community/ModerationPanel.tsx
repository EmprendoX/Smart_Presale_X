"use client";

import { useMemo, useState } from "react";
import { CommunityThread, CommunityThreadStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ModerationPanelProps {
  threads: CommunityThread[];
}

const statusColors: Record<CommunityThreadStatus, "neutral" | "yellow" | "green"> = {
  pending: "yellow",
  approved: "green",
  flagged: "neutral"
};

export function ModerationPanel({ threads }: ModerationPanelProps) {
  const [items, setItems] = useState(threads);
  const [filter, setFilter] = useState<CommunityThreadStatus | "all">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter(item => item.status === filter);
  }, [filter, items]);

  const updateStatus = (id: string, status: CommunityThreadStatus) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, status } : item)));
  };

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { pending: 0, approved: 0, flagged: 0 } as Record<CommunityThreadStatus, number>
    );
  }, [items]);

  const filters: (CommunityThreadStatus | "all")[] = ["all", "pending", "approved", "flagged"];

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-center gap-2">
        {filters.map(option => (
          <Button
            key={option}
            size="sm"
            variant={option === filter ? "primary" : "ghost"}
            onClick={() => setFilter(option as typeof filter)}
          >
            {option === "all" ? "Todos" : option === "pending" ? "Pendientes" : option === "approved" ? "Aprobados" : "Marcados"}
            {option !== "all" && <span className="ml-2 text-xs">({counts[option as CommunityThreadStatus]})</span>}
          </Button>
        ))}
      </header>

      <div className="space-y-2">
        {filtered.map(thread => (
          <div key={thread.id} className="rounded-md border p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold">{thread.title}</div>
                <div className="text-xs text-neutral-500">
                  {thread.author} · {thread.replies} respuestas · Última actividad {new Date(thread.lastActivityAt).toLocaleString()}
                </div>
                {thread.tags?.length ? (
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-neutral-400">
                    {thread.tags.map(tag => (
                      <span key={tag} className="rounded-full border px-2 py-0.5">#{tag}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge color={statusColors[thread.status]}>
                  {thread.status === "pending" ? "Pendiente" : thread.status === "approved" ? "Aprobado" : "Revisión"}
                </Badge>
                {thread.status !== "approved" && (
                  <Button size="sm" onClick={() => updateStatus(thread.id, "approved")}>Aprobar</Button>
                )}
                {thread.status !== "flagged" && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatus(thread.id, "flagged")}>
                    Marcar
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-md border border-dashed p-4 text-center text-sm text-neutral-500">
            No hay hilos en esta vista.
          </div>
        )}
      </div>
    </div>
  );
}
