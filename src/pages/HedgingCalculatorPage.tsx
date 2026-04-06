import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrencyUnsigned } from "@/lib/format";
import { Calculator, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

function fmt(n: number) {
  return formatCurrencyUnsigned(Math.abs(n));
}

export default function HedgingCalculatorPage() {
  const [L, setL] = useState(2550);
  const [cBal, setCBal] = useState(100000);
  const [rEa, setREa] = useState(80);
  const [rSplit, setRSplit] = useState(80);
  const [d, setD] = useState(10);
  const [S, setS] = useState(110);
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    const C = cBal * 0.01;
    const r_ea = rEa / 100;
    const r_split = rSplit / 100;
    const dd = d / 100;
    const ss = S / 100;

    const denom = (C * r_ea * r_split) - (L * dd);
    if (denom <= 0) {
      return {
        error: true,
        errorMsg: `System insolvent! Denominator is ${denom.toFixed(2)} ≤ 0. (C × r_ea × r_split) = ${(C * r_ea * r_split).toFixed(2)} must be greater than (L × d) = ${(L * dd).toFixed(2)}. Reduce L, reduce d, or increase recovery/split rates.`,
      } as const;
    }

    const num = L * L * dd;
    const H_base = num / denom;
    const H_final = H_base * ss;

    const T = L / r_ea;
    const P = T * dd;
    const U = H_final / P;
    const G_lordo = U * C;
    const G_netto = G_lordo * r_split;
    const totale = L + H_final;
    const surplus = G_netto - totale;
    const pct_prop = (G_lordo / cBal) * 100;
    const pct_fill = Math.min(100, (G_netto / totale) * 100);

    return {
      error: false,
      H_base, H_final, T, P, U, G_lordo, G_netto, totale, surplus, pct_prop, pct_fill, ss,
    } as const;
  }, [L, cBal, rEa, rSplit, d, S]);

  const handleCalculate = () => setShowResults(true);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hedging Break-Even Calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">Certified formula · Prop Firm · EA Recovery</p>
      </div>

      {/* Formula */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 px-4 font-mono text-sm text-primary">
          H = (L² × d) / (C × r_ea × r_split − L × d) × S
          <br />
          <span className="text-xs text-muted-foreground">where C = Balance_Prop × 0.01 (fixed at 1000 for 100k account)</span>
        </CardContent>
      </Card>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground"><span className="text-primary font-bold mr-1">L</span>Loss to Recover ($)</Label>
            <Input type="number" value={L} onChange={e => setL(Number(e.target.value))} step={10} />
            <p className="text-xs text-muted-foreground">Net loss on the Prop account</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground"><span className="text-primary font-bold mr-1">C</span>Prop Balance ($)</Label>
            <Input type="number" value={cBal} onChange={e => setCBal(Number(e.target.value))} step={1000} />
            <p className="text-xs text-muted-foreground">C = Balance × 0.01 (auto-calculated)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground"><span className="text-primary font-bold mr-1">r_ea</span>EA Recovery Rate (%)</Label>
            <Input type="number" value={rEa} onChange={e => setREa(Number(e.target.value))} min={1} max={100} />
            <p className="text-xs text-muted-foreground">Historical EA rate (e.g. 80)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground"><span className="text-primary font-bold mr-1">r_split</span>Profit Split (%)</Label>
            <Input type="number" value={rSplit} onChange={e => setRSplit(Number(e.target.value))} min={1} max={100} />
            <p className="text-xs text-muted-foreground">Your share (e.g. 80)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground"><span className="text-primary font-bold mr-1">d</span>Max Hedging Drawdown (%)</Label>
            <Input type="number" value={d} onChange={e => setD(Number(e.target.value))} min={0.1} max={100} step={0.5} />
            <p className="text-xs text-muted-foreground">Max drawdown on hedging account</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground"><span className="text-primary font-bold mr-1">S</span>Safety Margin (%)</Label>
            <Input type="number" value={S} onChange={e => setS(Number(e.target.value))} min={100} />
            <p className="text-xs text-muted-foreground">110 = +10% extra, 115 = +15%</p>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleCalculate} className="w-full text-base font-bold py-5">
        <Calculator className="w-4 h-4 mr-2" /> Calculate Break-Even
      </Button>

      {/* Error */}
      {showResults && results.error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{results.errorMsg}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && !results.error && (
        <div className="space-y-4">
          {/* Big result */}
          <Card className="border-primary bg-primary/5">
            <CardContent className="py-6 text-center">
              <p className="text-xs uppercase text-muted-foreground tracking-wider mb-2">💰 Recommended Hedging Deposit</p>
              <p className="text-4xl font-extrabold text-primary">{fmt(results.H_final)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                H base {fmt(results.H_base)} × safety {(results.ss * 100).toFixed(0)}% = {fmt(results.H_final)}
              </p>
            </CardContent>
          </Card>

          {/* Mini cards row 1 */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground mb-1">H base (pre-safety)</p>
                <p className="text-lg font-bold text-blue-400">{fmt(results.H_base)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground mb-1">🎯 EA Target to Set</p>
                <p className="text-lg font-bold text-yellow-400">{fmt(results.T)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground mb-1">📉 Hedging Loss per 1%</p>
                <p className="text-lg font-bold text-destructive">{fmt(results.P)} / 1%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground mb-1">🔁 Sustainable 1% Cycles</p>
                <p className="text-lg font-bold text-blue-400">{results.U.toFixed(2)} cycles</p>
              </CardContent>
            </Card>
          </div>

          {/* Verification */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">✅ Verification Protocol (reverse check)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["T = L / r_ea", fmt(results.T)],
                    ["P = T × d", fmt(results.P)],
                    ["U = H / P", results.U.toFixed(3)],
                    ["G_gross = U × C", fmt(results.G_lordo)],
                    ["G_net = G_gross × r_split", fmt(results.G_netto)],
                    ["To cover (L + H)", fmt(results.totale)],
                  ].map(([label, val]) => (
                    <tr key={label} className="border-b border-border">
                      <td className="py-2 text-muted-foreground font-mono text-xs">{label}</td>
                      <td className="py-2 text-right font-semibold">{val}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-3 font-semibold">Surplus</td>
                    <td className={`pt-3 text-right font-bold ${results.surplus >= 0 ? "text-positive" : "text-destructive"}`}>
                      {results.surplus >= 0 ? <CheckCircle2 className="w-4 h-4 inline mr-1" /> : null}
                      {results.surplus >= 0 ? "+" : ""}{fmt(results.surplus)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Loss + Hedging</span>
                  <span>{fmt(results.G_netto)} / {fmt(results.totale)} ({results.pct_fill.toFixed(1)}%)</span>
                </div>
                <Progress value={results.pct_fill} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Bottom stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground mb-1">📊 Target % on Prop</p>
                <p className="text-lg font-bold text-primary">{results.pct_prop.toFixed(2)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground mb-1">💚 Safety Surplus</p>
                <p className={`text-lg font-bold ${results.surplus >= 0 ? "text-positive" : "text-destructive"}`}>
                  {results.surplus >= 0 ? "+" : ""}{fmt(results.surplus)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
