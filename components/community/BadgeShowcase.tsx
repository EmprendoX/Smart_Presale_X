import { CommunityBadge } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

interface BadgeShowcaseProps {
  badges?: CommunityBadge[];
}

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  if (!badges?.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-neutral-700">Reconocimientos activos</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {badges.map(badge => (
          <div key={badge.id} className="rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Badge color="green">{badge.label}</Badge>
              <span className="text-xs uppercase tracking-wide text-neutral-400">{badge.criteria}</span>
            </div>
            {badge.description && <p className="mt-2 text-xs text-neutral-600">{badge.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
