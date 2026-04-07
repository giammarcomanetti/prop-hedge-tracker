import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrencyUnsigned } from "@/lib/format";
import { Calculator, AlertTriangle, CheckCircle2, TrendingUp, Shield, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

function fmt(n: number) {
  return formatCurrencyUnsigned(Math.abs(n));
}

interface InputFieldProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
}

function InputField({ label, description, icon, value, onChange, suffix, step = 1, min, max }: InputFieldProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1.5">
        <div className="flex items-center gap-2">
          {icon}
          <Label className="text-xs uppercase text-muted-foreground font-semibold">{label}</Label>
        </div>
        <div className="relative">
          <Input
            type="number"
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            step={step}
            min={min}
            max={max}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
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
      return { error: true } as const;
    }

    const num = L * L * dd;
    const H_base = num / denom;
    const H_final = H_base * ss;

    const T_base = L / r_ea;
    const P_base = T_base * dd;
    const U_base = H_base / P_base;
    const G_lordo_base = U_base * C;
    const G_netto_base = G_lordo_base * r_split;
    const totale_base = L + H_base;
    const surplus_base = G_netto_base - totale_base;
    const pct_fill_base = Math.min(100, (G_netto_base / totale_base) * 100);

    const P_rec = T_base * dd;
    const U_rec = H_final / P_rec;
    const G_lordo_rec = U_rec * C;
    const G_netto_rec = G_lordo_rec * r_split;
    const totale_rec = L + H_final;
    const surplus_rec = G_netto_rec - totale_rec;
    const pct_fill_rec = Math.min(100, (G_netto_rec / totale_rec) * 100);

    return {
      error: false,
      H_base, H_final, T: T_base,
      G_netto_base, totale_base, surplus_base, pct_fill_base,
      G_netto_rec, totale_rec, surplus_rec, pct_fill_rec,
    } as const;
  }, [L, cBal, rEa, rSplit, d, S]);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hedging Break-Even Calculator</h1>
        <p className="text-sm text-muted-foreground mt-1">Calculate the optimal hedging deposit to recover your losses</p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Loss to Recover"
          description="Net loss on the Prop account"
          icon={<AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
          value={L} onChange={setL} suffix="$" step={10}
        />
        <InputField
          label="Prop Balance"
          description="Your funded account balance"
          icon={<TrendingUp className="w-3.5 h-3.5 text-primary" />}
          value={cBal} onChange={setCBal} suffix="$" step={1000}
        />
        <InputField
          label="EA Recovery Rate"
          description="Historical win rate of the EA"
          icon={<Target className="w-3.5 h-3.5 text-primary" />}
          value={rEa} onChange={setREa} suffix="%" min={1} max={100}
        />
        <InputField
          label="Profit Split"
          description="Your share of the profits"
          icon={<TrendingUp className="w-3.5 h-3.5 text-primary" />}
          value={rSplit} onChange={setRSplit} suffix="%" min={1} max={100}
        />
        <InputField
          label="Max Hedging Drawdown"
          description="Maximum acceptable drawdown"
          icon={<AlertTriangle className="w-3.5 h-3.5 text-warning" />}
          value={d} onChange={setD} suffix="%" min={0.1} max={100} step={0.5}
        />
        <InputField
          label="Safety Margin"
          description="Extra buffer (110 = +10% safety)"
          icon={<Shield className="w-3.5 h-3.5 text-primary" />}
          value={S} onChange={setS} suffix="%" min={100}
        />
      </div>

      <Button onClick={() => setShowResults(true)} className="w-full text-base font-bold py-5">
        <Calculator className="w-4 h-4 mr-2" /> Calculate
      </Button>

      {/* Error */}
      {showResults && results.error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              The current parameters make recovery impossible. Try reducing the loss amount, lowering drawdown, or increasing recovery/split rates.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && !results.error && (
        <div className="space-y-4">
          <Card className="border-primary bg-primary/5">
            <CardContent className="py-6 text-center">
              <p className="text-xs uppercase text-muted-foreground tracking-wider mb-2">💰 Recommended Hedging Deposit</p>
              <p className="text-4xl font-extrabold text-primary">{fmt(results.H_final)}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground mb-1">🎯 EA Profit Target</p>
                <p className="text-lg font-bold text-primary">{fmt(results.T)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground mb-1">💵 Expected Net Payout</p>
                <p className="text-lg font-bold text-foreground">{fmt(results.G_netto)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase text-muted-foreground mb-1">
                  {results.surplus >= 0 ? "💚" : "🔴"} Surplus
                </p>
                <p className={`text-lg font-bold ${results.surplus >= 0 ? "text-positive" : "text-destructive"}`}>
                  {results.surplus >= 0 && <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                  {results.surplus >= 0 ? "+" : "-"}{fmt(results.surplus)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Coverage Progress</span>
              <span>{results.pct_fill.toFixed(1)}%</span>
            </div>
            <Progress value={results.pct_fill} className="h-2" />
          </div>
        </div>
      )}
    </div>
  );
}
