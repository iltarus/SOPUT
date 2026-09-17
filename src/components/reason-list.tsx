import { Badge } from "@/components/ui/badge";
import type { Reason } from "@/lib/types";

const TONE: Record<Reason["type"], string> = {
  pin: "bg-primary/10 text-primary",
  compat: "bg-amber-100 text-amber-900",
  rule: "bg-sky-100 text-sky-900",
  affinity: "bg-emerald-100 text-emerald-900",
  brand: "bg-violet-100 text-violet-900",
  attr: "bg-orange-100 text-orange-950",
  stock: "bg-muted text-muted-foreground",
};

export function ReasonList({ reasons, limit = 3 }: { reasons: Reason[]; limit?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {reasons.slice(0, limit).map((reason) => (
        <Badge key={`${reason.type}-${reason.label}`} variant="secondary" className={TONE[reason.type]}>
          {reason.label}
        </Badge>
      ))}
    </div>
  );
}
