import { useData } from "@/context/DataContext";
import { formatCurrency, formatCurrencyUnsigned, plColor, formatPercent } from "@/lib/format";
import { Users } from "lucide-react";

export default function ClientsPage() {
  const { clients, getAllCyclesWithCalcs } = useData();
  const allCycles = getAllCyclesWithCalcs();

  const clientStats = clients.map(client => {
    const cc = allCycles.filter(c => c.client_id === client.id);
    const completed = cc.filter(c => c.cycle_status === "Completed");
    const pl = completed.reduce((s, c) => s + c.cycle_pl, 0);
    const invested = cc.reduce((s, c) => s + c.phases.reduce((ps, p) => ps + p.real_deposit, 0), 0);
    return {
      ...client, totalCycles: cc.length, activeCycles: cc.filter(c => c.cycle_status === "Active").length,
      pl, roi: invested > 0 ? (pl / invested) * 100 : 0,
      fees: cc.reduce((s, c) => s + c.challenge_fee, 0),
      bonus: cc.reduce((s, c) => s + c.total_bonus_used, 0),
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-sm text-muted-foreground mt-1">{clients.length} registered clients</p>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No clients yet. Add clients in Settings.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {clientStats.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.totalCycles} cycles ({c.activeCycles} active) · {c.notes || "No notes"}</p>
                </div>
                <div className="flex gap-8 text-right">
                  <div><p className="text-xs text-muted-foreground">P&L</p><p className={`text-lg font-bold ${plColor(c.pl)}`}>{formatCurrency(c.pl)}</p></div>
                  <div><p className="text-xs text-muted-foreground">ROI</p><p className={`text-lg font-bold ${plColor(c.roi)}`}>{formatPercent(c.roi)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Fees</p><p className="text-lg font-bold">{formatCurrencyUnsigned(c.fees)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Bonus</p><p className="text-lg font-bold">{formatCurrencyUnsigned(c.bonus)}</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
