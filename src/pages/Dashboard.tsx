import { useData } from "@/context/DataContext";
import StatCard from "@/components/StatCard";
import { formatCurrency, formatCurrencyUnsigned, plColor } from "@/lib/format";
import { DollarSign, TrendingUp, Activity, Hash } from "lucide-react";

export default function Dashboard() {
  const { getAllCyclesWithCalcs } = useData();
  const allCycles = getAllCyclesWithCalcs();
  const completedCycles = allCycles.filter(c => c.cycle_status === "Completed");
  const activeCycles = allCycles.filter(c => c.cycle_status === "Active");

  const totalPL = completedCycles.reduce((s, c) => s + c.cycle_pl, 0);
  const totalFees = allCycles.reduce((s, c) => s + c.challenge_fee, 0);
  const totalAccumulatedCosts = activeCycles.reduce((s, c) => s + c.accumulated_costs, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your prop trading operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total P&L" value={formatCurrency(totalPL)} valueClassName={plColor(totalPL)} icon={<DollarSign className="w-5 h-5 text-primary" />} />
        <StatCard title="Active Costs" value={formatCurrencyUnsigned(totalAccumulatedCosts)} subtitle="Accumulated across active cycles" icon={<Activity className="w-5 h-5 text-primary" />} />
        <StatCard title="Total Fees Paid" value={formatCurrencyUnsigned(totalFees)} icon={<TrendingUp className="w-5 h-5 text-primary" />} />
        <StatCard title="Cycles" value={`${allCycles.length}`} subtitle={`${activeCycles.length} active · ${completedCycles.length} completed`} icon={<Hash className="w-5 h-5 text-primary" />} />
      </div>

      {/* Active Cycles */}
      {activeCycles.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4">Active Cycles</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground text-xs">
                <th className="text-left py-2">#</th><th className="text-left py-2">Cycle</th>
                <th className="text-right py-2">Account</th><th className="text-right py-2">Current Phase</th>
                <th className="text-right py-2">Accumulated Costs</th>
              </tr></thead>
              <tbody>{activeCycles.map(c => {
                const active = c.phases.find(p => p.status === "Active");
                return (
                  <tr key={c.id} className="border-b border-border/50">
                    <td className="py-2 text-muted-foreground">{c.cycle_id}</td>
                    <td className="py-2 font-medium">{c.prop_firm} — {c.client_name}</td>
                    <td className="text-right py-2">{formatCurrencyUnsigned(c.account_size)}</td>
                    <td className="text-right py-2">{active?.phase_type ?? "—"}</td>
                    <td className="text-right py-2 text-negative font-semibold">{formatCurrencyUnsigned(c.accumulated_costs)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Completed Cycles */}
      {completedCycles.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4">Completed Cycles</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground text-xs">
                <th className="text-left py-2">#</th><th className="text-left py-2">Cycle</th>
                <th className="text-right py-2">Account</th><th className="text-right py-2">P&L</th>
              </tr></thead>
              <tbody>{completedCycles.map(c => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2 text-muted-foreground">{c.cycle_id}</td>
                  <td className="py-2 font-medium">{c.prop_firm} — {c.client_name}</td>
                  <td className="text-right py-2">{formatCurrencyUnsigned(c.account_size)}</td>
                  <td className={`text-right py-2 font-semibold ${plColor(c.cycle_pl)}`}>{formatCurrency(c.cycle_pl)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {allCycles.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No data yet</p>
          <p className="text-sm">Create your first cycle to get started.</p>
        </div>
      )}
    </div>
  );
}
