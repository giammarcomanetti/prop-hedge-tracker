import { useData } from "@/context/DataContext";
import StatCard from "@/components/StatCard";
import { formatCurrency, formatPercent, formatCurrencyUnsigned, plColor } from "@/lib/format";
import { DollarSign, TrendingUp, Activity, ShieldCheck, Users, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

export default function Dashboard() {
  const { getAllCyclesWithCalcs, clients, providers } = useData();
  const allCycles = getAllCyclesWithCalcs();
  const completedCycles = allCycles.filter(c => c.cycle_status === "Completed");
  const activeCycles = allCycles.filter(c => c.cycle_status === "Active");

  const totalPL = completedCycles.reduce((s, c) => s + c.cycle_pl, 0);
  const totalFees = allCycles.reduce((s, c) => s + c.challenge_fee, 0);
  const totalBonusUsed = allCycles.reduce((s, c) => s + c.total_bonus_used, 0);
  const exposedCapital = activeCycles.reduce((s, c) => s + c.phases.filter(p => p.status === "Active").reduce((ps, p) => ps + p.real_deposit, 0), 0);
  const totalRealInvested = allCycles.reduce((s, c) => s + c.phases.reduce((ps, p) => ps + p.real_deposit, 0), 0);
  const globalROI = totalRealInvested > 0 ? (totalPL / totalRealInvested) * 100 : 0;

  // Per client stats
  const clientStats = clients.map(client => {
    const cc = allCycles.filter(c => c.client_id === client.id);
    const pl = cc.filter(c => c.cycle_status === "Completed").reduce((s, c) => s + c.cycle_pl, 0);
    const invested = cc.reduce((s, c) => s + c.phases.reduce((ps, p) => ps + p.real_deposit, 0), 0);
    return { name: client.name, cycles: cc.length, pl, roi: invested > 0 ? (pl / invested) * 100 : 0, fees: cc.reduce((s, c) => s + c.challenge_fee, 0), bonus: cc.reduce((s, c) => s + c.total_bonus_used, 0) };
  });

  // Per provider stats
  const providerStats = providers.map(prov => {
    const pc = allCycles.filter(c => c.provider_id === prov.id);
    const completed = pc.filter(c => c.cycle_status === "Completed");
    const passed = completed.filter(c => c.cycle_pl > 0).length;
    return {
      name: prov.name, cycles: pc.length, passRate: completed.length > 0 ? (passed / completed.length) * 100 : 0,
      avgPL: completed.length > 0 ? completed.reduce((s, c) => s + c.cycle_pl, 0) / completed.length : 0,
      avgFee: pc.length > 0 ? pc.reduce((s, c) => s + c.challenge_fee, 0) / pc.length : 0,
      policy: prov.fee_refund_policy,
    };
  });

  // Phase stats
  const allPhases = allCycles.flatMap(c => c.phases);
  const phaseTypes = ["1st Step", "2nd Step", "Funded Hedge"] as const;
  const phaseStats = phaseTypes.map(type => {
    const pp = allPhases.filter(p => p.phase_type === type);
    const completed = pp.filter(p => p.status === "Pass" || p.status === "Fail");
    const passed = completed.filter(p => p.status === "Pass").length;
    return {
      type, total: pp.length,
      passRate: completed.length > 0 ? (passed / completed.length) * 100 : 0,
      avgPL: completed.length > 0 ? completed.reduce((s, p) => s + p.broker_pl_phase, 0) / completed.length : 0,
      avgRecoverySet: pp.length > 0 ? pp.reduce((s, p) => s + p.recovery_rate_set, 0) / pp.length : 0,
      avgRecoveryReal: pp.length > 0 ? pp.reduce((s, p) => s + p.recovery_rate_real, 0) / pp.length : 0,
    };
  });

  // P&L over time chart data
  const plOverTime = completedCycles
    .filter(c => c.end_date)
    .sort((a, b) => a.end_date.localeCompare(b.end_date))
    .reduce<{ date: string; pl: number; cumPL: number }[]>((acc, c) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].cumPL : 0;
      acc.push({ date: c.end_date, pl: c.cycle_pl, cumPL: prev + c.cycle_pl });
      return acc;
    }, []);

  // Forecast
  const avgRecoveryRate = allPhases.length > 0
    ? allPhases.reduce((s, p) => s + (p.recovery_rate_set > 0 ? p.recovery_rate_real / p.recovery_rate_set : 0), 0) / allPhases.filter(p => p.recovery_rate_set > 0).length || 0
    : 0;
  const monthlyPL = completedCycles.length > 0 ? totalPL / Math.max(1, completedCycles.length) * 2 : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Global overview of your prop trading operations</p>
      </div>

      {/* Section 1: Global Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total P&L" value={formatCurrency(totalPL)} valueClassName={plColor(totalPL)} icon={<DollarSign className="w-5 h-5 text-primary" />} />
        <StatCard title="Exposed Capital" value={formatCurrencyUnsigned(exposedCapital)} icon={<ShieldCheck className="w-5 h-5 text-primary" />} />
        <StatCard title="Total Fees" value={formatCurrencyUnsigned(totalFees)} icon={<Activity className="w-5 h-5 text-primary" />} />
        <StatCard title="Bonus Used" value={formatCurrencyUnsigned(totalBonusUsed)} subtitle="Operational savings" />
        <StatCard title="Cycles" value={`${allCycles.length}`} subtitle={`${activeCycles.length} active · ${completedCycles.length} completed`} />
        <StatCard title="Global ROI" value={formatPercent(globalROI)} valueClassName={plColor(globalROI)} icon={<TrendingUp className="w-5 h-5 text-primary" />} />
      </div>

      {/* P&L Chart */}
      {plOverTime.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4">Cumulative P&L Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={plOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(0 0% 55%)" }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 9%)", border: "1px solid hsl(0 0% 16%)", borderRadius: 8, color: "hsl(0 0% 95%)" }} />
              <Line type="monotone" dataKey="cumPL" stroke="hsl(155 100% 50%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Section 2 & 3: Client & Provider Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Performance by Client</h2>
          {clientStats.length === 0 ? <p className="text-sm text-muted-foreground">No clients yet</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left py-2">Client</th><th className="text-right py-2">Cycles</th><th className="text-right py-2">P&L</th><th className="text-right py-2">ROI%</th>
                </tr></thead>
                <tbody>{clientStats.map(c => (
                  <tr key={c.name} className="border-b border-border/50">
                    <td className="py-2 font-medium">{c.name}</td>
                    <td className="text-right py-2 text-muted-foreground">{c.cycles}</td>
                    <td className={`text-right py-2 font-semibold ${plColor(c.pl)}`}>{formatCurrency(c.pl)}</td>
                    <td className={`text-right py-2 ${plColor(c.roi)}`}>{formatPercent(c.roi)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Performance by Provider</h2>
          {providerStats.length === 0 ? <p className="text-sm text-muted-foreground">No providers yet</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left py-2">Provider</th><th className="text-right py-2">Cycles</th><th className="text-right py-2">Pass%</th><th className="text-right py-2">Avg P&L</th><th className="text-right py-2">Refund</th>
                </tr></thead>
                <tbody>{providerStats.map(p => (
                  <tr key={p.name} className="border-b border-border/50">
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="text-right py-2 text-muted-foreground">{p.cycles}</td>
                    <td className="text-right py-2">{p.passRate.toFixed(0)}%</td>
                    <td className={`text-right py-2 font-semibold ${plColor(p.avgPL)}`}>{formatCurrency(p.avgPL)}</td>
                    <td className="text-right py-2 text-xs text-muted-foreground">{p.policy}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Phase Stats */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold mb-4">Statistics by Phase</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phaseStats.map(ps => (
            <div key={ps.type} className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-primary">{ps.type}</p>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Pass Rate</span><span className="font-medium">{ps.passRate.toFixed(0)}%</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Avg P&L</span><span className={`font-medium ${plColor(ps.avgPL)}`}>{formatCurrency(ps.avgPL)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Avg Recovery</span><span>{ps.avgRecoverySet > 0 ? `${((ps.avgRecoveryReal / ps.avgRecoverySet) * 100).toFixed(0)}%` : "—"}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Active Cycles */}
      {activeCycles.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4">Active Cycles</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground text-xs">
                <th className="text-left py-2">Cycle</th><th className="text-left py-2">Client</th><th className="text-left py-2">Provider</th>
                <th className="text-right py-2">Broker Losses</th><th className="text-right py-2">Payouts</th><th className="text-right py-2">To Break-Even</th>
              </tr></thead>
              <tbody>{activeCycles.map(c => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2 font-medium">{c.cycle_name}</td>
                  <td className="py-2 text-muted-foreground">{c.client?.name ?? "—"}</td>
                  <td className="py-2 text-muted-foreground">{c.provider?.name ?? "—"}</td>
                  <td className="text-right py-2 text-negative">{formatCurrencyUnsigned(c.total_real_broker_losses)}</td>
                  <td className="text-right py-2 text-positive">{formatCurrencyUnsigned(c.total_payouts_received)}</td>
                  <td className="text-right py-2 text-neutral-warn">{formatCurrencyUnsigned(c.distance_to_break_even)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 6: Forecast */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold mb-4">Forecast</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-secondary/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Capital Exposed</p>
            <p className="text-lg font-bold mt-1">{formatCurrencyUnsigned(exposedCapital)}</p>
          </div>
          {[30, 60, 90].map(days => (
            <div key={days} className="bg-secondary/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Est. P&L {days}d</p>
              <div className="space-y-1 mt-1">
                <p className="text-xs"><span className="text-positive">Opt:</span> {formatCurrency(monthlyPL * (days / 30) * 1.2)}</p>
                <p className="text-xs"><span className="text-muted-foreground">Real:</span> {formatCurrency(monthlyPL * (days / 30))}</p>
                <p className="text-xs"><span className="text-negative">Pess:</span> {formatCurrency(monthlyPL * (days / 30) * 0.8)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {allCycles.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No data yet</p>
          <p className="text-sm">Start by adding clients and providers in Settings, then create your first cycle.</p>
        </div>
      )}
    </div>
  );
}
