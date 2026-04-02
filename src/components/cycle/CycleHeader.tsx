import { CycleWithCalculations } from "@/types";
import { formatCurrencyUnsigned } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  cycle: CycleWithCalculations;
  onDelete: () => void;
}

export default function CycleHeader({ cycle, onDelete }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-muted-foreground">#{cycle.cycle_id}</span>
            <h1 className="text-xl font-bold">{cycle.prop_firm} — {cycle.client_name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${cycle.cycle_status === "Active" ? "bg-positive/20 text-positive" : "bg-primary/20 text-primary"}`}>{cycle.cycle_status}</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>Account: <span className="text-foreground">{formatCurrencyUnsigned(cycle.account_size)}</span></span>
            <span>Fee: <span className="text-foreground">{formatCurrencyUnsigned(cycle.challenge_fee)}</span></span>
            <span>Started: <span className="text-foreground">{cycle.start_date}</span></span>
            {cycle.end_date && <span>Ended: <span className="text-foreground">{cycle.end_date}</span></span>}
          </div>
        </div>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="w-3 h-3 mr-1" /> Delete
        </Button>
      </div>
    </div>
  );
}
