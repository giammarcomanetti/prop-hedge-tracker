import { CycleWithCalculations } from "@/types";
import { formatCurrency, formatCurrencyUnsigned, plColor } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

interface Props {
  cycle: CycleWithCalculations;
}

export default function AccumulatedCostsCard({ cycle }: Props) {
  const refundPolicyLabel = cycle.fee_refund_policy !== "Never" ? cycle.fee_refund_policy : null;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total Accumulated Costs</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-3xl font-bold text-negative">{formatCurrencyUnsigned(cycle.accumulated_costs)}</p>
            {cycle.fee_refunded && (
              <Badge variant="secondary" className="bg-positive/15 text-positive border-positive/30 text-[10px]">
                Fee refunded at {refundPolicyLabel}
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-xs text-muted-foreground">
            Challenge Fee: <span className={cycle.fee_refunded ? "text-muted-foreground line-through" : "text-foreground"}>{formatCurrencyUnsigned(cycle.challenge_fee)}</span>
            {cycle.fee_refunded && <span className="text-positive ml-1">(refunded)</span>}
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
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Net Payouts:</span>
            <span className="text-positive font-medium">{formatCurrencyUnsigned(cycle.total_net_payouts)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining to recover:</span>
            <span className={`font-medium ${cycle.remaining_costs <= 0 ? "text-positive" : "text-negative"}`}>
              {cycle.remaining_costs <= 0 ? `🎯 RISK FREE — Surplus: ${formatCurrencyUnsigned(Math.abs(cycle.remaining_costs))}` : formatCurrencyUnsigned(cycle.remaining_costs)}
            </span>
          </div>

          {/* Break-even progress bar */}
          {cycle.accumulated_costs > 0 && (
            (() => {
              const recoveryPct = Math.min((cycle.total_net_payouts / cycle.accumulated_costs) * 100, 100);
              const almostThere = cycle.remaining_costs > 0 && cycle.remaining_costs < cycle.accumulated_costs * 0.1;
              return (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Cost Recovery</span>
                    <span>{recoveryPct.toFixed(1)}%</span>
                  </div>
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${recoveryPct >= 100 ? "bg-positive" : almostThere ? "bg-warning" : "bg-primary"}`}
                      style={{ width: `${recoveryPct}%` }}
                    />
                  </div>
                  {almostThere && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-warning">
                      <span>⚠️ Almost there! {formatCurrencyUnsigned(cycle.remaining_costs)} remaining to break-even</span>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Refund policy note when not yet refunded */}
      {!cycle.fee_refunded && refundPolicyLabel && (
        <div className="mt-3 text-xs text-muted-foreground">
          💡 Fee will be refunded at <span className="text-foreground font-medium">{refundPolicyLabel}</span>
        </div>
      )}

      {cycle.cycle_status === "Completed" && (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Cycle P&L</p>
            <p className={`text-2xl font-bold ${plColor(cycle.cycle_pl)}`}>{formatCurrency(cycle.cycle_pl)}</p>
          </div>
          {cycle.broker_gain > 0 ? (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Broker gain from blown prop: <span className="text-positive font-medium">{formatCurrencyUnsigned(cycle.broker_gain)}</span></p>
              <p>P&L = Broker Gain − Accumulated Costs = {formatCurrencyUnsigned(cycle.broker_gain)} − {formatCurrencyUnsigned(cycle.accumulated_costs)}</p>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>P&L = Total Net Payouts − Accumulated Costs = {formatCurrencyUnsigned(cycle.total_net_payouts)} − {formatCurrencyUnsigned(cycle.accumulated_costs)}</p>
            </div>
          )}
          <p className={`text-center font-semibold text-sm mt-2 ${cycle.cycle_pl >= 0 ? "text-positive" : "text-negative"}`}>
            {cycle.cycle_pl >= 0 ? `✅ Profit — ${cycle.is_risk_free ? "🎯 RISK FREE" : ""}` : "❌ Loss"}
          </p>
        </div>
      )}
    </div>
  );
}
