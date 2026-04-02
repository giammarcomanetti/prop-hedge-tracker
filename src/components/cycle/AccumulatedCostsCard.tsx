import { CycleWithCalculations } from "@/types";
import { formatCurrency, formatCurrencyUnsigned, plColor } from "@/lib/format";

interface Props {
  cycle: CycleWithCalculations;
}

export default function AccumulatedCostsCard({ cycle }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Accumulated Costs</p>
          <p className="text-3xl font-bold text-negative mt-1">{formatCurrencyUnsigned(cycle.accumulated_costs)}</p>
        </div>
        <div className="text-right space-y-1">
          <div className="text-xs text-muted-foreground">
            Challenge Fee: <span className="text-foreground">{formatCurrencyUnsigned(cycle.challenge_fee)}</span>
          </div>
          {cycle.phases.filter(p => p.broker_loss > 0 && p.status === "Pass").map(p => (
            <div key={p.id} className="text-xs text-muted-foreground">
              {p.phase_type}{p.session_number ? ` #${p.session_number}` : ""} broker loss: <span className="text-negative">{formatCurrencyUnsigned(p.broker_loss)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payouts & Recovery info */}
      {cycle.total_net_payouts > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Net Payouts:</span>
            <span className="text-positive font-medium">{formatCurrencyUnsigned(cycle.total_net_payouts)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining to recover:</span>
            <span className={`font-medium ${cycle.remaining_costs <= 0 ? "text-positive" : "text-negative"}`}>
              {cycle.remaining_costs <= 0 ? "🎯 RISK FREE" : formatCurrencyUnsigned(cycle.remaining_costs)}
            </span>
          </div>
        </div>
      )}

      {cycle.cycle_status === "Completed" && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Cycle P&L</p>
            <p className={`text-2xl font-bold ${plColor(cycle.cycle_pl)}`}>{formatCurrency(cycle.cycle_pl)}</p>
          </div>
          {cycle.broker_gain > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Broker gain from blown prop: {formatCurrencyUnsigned(cycle.broker_gain)}</p>
          )}
        </div>
      )}
    </div>
  );
}
