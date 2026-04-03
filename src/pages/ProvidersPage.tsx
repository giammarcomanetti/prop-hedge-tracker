import { useData } from "@/context/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export default function ProvidersPage() {
  const { providers, getAllCyclesWithCalcs, phases } = useData();
  const allCycles = getAllCyclesWithCalcs();

  const providerStats = providers.map(provider => {
    const provCycles = allCycles.filter(c => c.prop_firm === provider.name);
    const totalCycles = provCycles.length;
    const completedCycles = provCycles.filter(c => c.cycle_status === "Completed");
    const totalPL = completedCycles.reduce((sum, c) => sum + c.cycle_pl, 0);
    const avgPL = completedCycles.length > 0 ? totalPL / completedCycles.length : 0;

    // Pass rate: cycles that reached at least Phase 2 Pass / total cycles
    const passedPhase1 = provCycles.filter(c => c.phases.some(p => p.phase_type === "Phase 1" && p.status === "Pass")).length;
    const passRate = totalCycles > 0 ? Math.round((passedPhase1 / totalCycles) * 100) : 0;

    return { ...provider, totalCycles, passRate, avgPL, totalPL };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Providers</h1>
      </div>

      {providerStats.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-4 opacity-40" />
            <p>No providers configured. Add providers in Settings.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Cycles</TableHead>
                  <TableHead className="text-right">Phase 1 Pass Rate</TableHead>
                  <TableHead className="text-right">Avg P&L</TableHead>
                  <TableHead className="text-right">Total P&L</TableHead>
                  <TableHead>Fee Refund Policy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providerStats.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.totalCycles}</TableCell>
                    <TableCell className="text-right">{p.totalCycles > 0 ? `${p.passRate}%` : "—"}</TableCell>
                    <TableCell className={`text-right font-semibold ${p.avgPL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {p.totalCycles > 0 ? formatCurrency(p.avgPL) : "—"}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${p.totalPL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {p.totalCycles > 0 ? formatCurrency(p.totalPL) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.fee_refund_policy}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
