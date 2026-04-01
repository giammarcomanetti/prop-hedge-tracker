import { useData } from "@/context/DataContext";
import { formatCurrency, plColor, formatCurrencyUnsigned } from "@/lib/format";
import { Building2 } from "lucide-react";

export default function ProvidersPage() {
  const { providers, getAllCyclesWithCalcs } = useData();
  const allCycles = getAllCyclesWithCalcs();

  const providerStats = providers.map(prov => {
    const pc = allCycles.filter(c => c.provider_id === prov.id);
    const completed = pc.filter(c => c.cycle_status === "Completed");
    const passed = completed.filter(c => c.cycle_pl > 0).length;
    return {
      ...prov, totalCycles: pc.length,
      passRate: completed.length > 0 ? (passed / completed.length) * 100 : 0,
      avgPL: completed.length > 0 ? completed.reduce((s, c) => s + c.cycle_pl, 0) / completed.length : 0,
      avgFee: pc.length > 0 ? pc.reduce((s, c) => s + c.challenge_fee, 0) / pc.length : 0,
      totalPL: completed.reduce((s, c) => s + c.cycle_pl, 0),
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Providers</h1>
        <p className="text-sm text-muted-foreground mt-1">{providers.length} registered providers</p>
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No providers yet. Add providers in Settings.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {providerStats.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span>Fee Refund: <span className="text-foreground">{p.fee_refund_policy}</span></span>
                    <span>{p.totalCycles} cycles</span>
                  </div>
                  {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                </div>
                <div className="flex gap-8 text-right">
                  <div><p className="text-xs text-muted-foreground">Total P&L</p><p className={`text-lg font-bold ${plColor(p.totalPL)}`}>{formatCurrency(p.totalPL)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Pass Rate</p><p className="text-lg font-bold">{p.passRate.toFixed(0)}%</p></div>
                  <div><p className="text-xs text-muted-foreground">Avg P&L</p><p className={`text-lg font-bold ${plColor(p.avgPL)}`}>{formatCurrency(p.avgPL)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Avg Fee</p><p className="text-lg font-bold">{formatCurrencyUnsigned(p.avgFee)}</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
