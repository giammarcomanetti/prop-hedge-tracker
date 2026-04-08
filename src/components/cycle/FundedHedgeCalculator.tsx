import { useState } from "react";
import { formatCurrencyUnsigned } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  remainingCosts: number;
}

export default function FundedHedgeCalculator({ remainingCosts }: Props) {
  const [brokerDeposit, setBrokerDeposit] = useState("");
  const [recoveryRate, setRecoveryRate] = useState("80");
  const [profitSplit, setProfitSplit] = useState("80");

  const deposit = parseFloat(brokerDeposit) || 0;
  const recovery = parseFloat(recoveryRate) || 80;
  const split = parseFloat(profitSplit) || 80;

  const maxBrokerGain = deposit * (recovery / 100);
  const coveragePct = remainingCosts > 0 ? (maxBrokerGain / remainingCosts) * 100 : 0;
  const grossPayoutNeeded = remainingCosts > 0 ? remainingCosts / (split / 100) : 0;
  const shortfall = remainingCosts - maxBrokerGain;
  const fullyCovered = coveragePct >= 100;

  return (
    <div className="mt-4 border border-border rounded-lg p-4 bg-secondary/30">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-muted-foreground">SESSION CALCULATOR</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <Label className="text-xs">Costs to Recover ($)</Label>
          <Input value={formatCurrencyUnsigned(remainingCosts)} disabled className="text-xs" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <Label className="text-xs">Broker Deposit ($)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[220px] text-xs">
                  This determines your hedge capacity. A 10% prop drawdown will generate ~Recovery% gain on broker.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input type="number" min="0" value={brokerDeposit} onChange={e => setBrokerDeposit(e.target.value)} placeholder="e.g. 2000" className="text-xs" />
        </div>
        <div>
          <Label className="text-xs">Recovery Rate %</Label>
          <Input type="number" min="0" max="100" value={recoveryRate} onChange={e => setRecoveryRate(e.target.value)} className="text-xs" />
        </div>
        <div>
          <Label className="text-xs">Profit Split %</Label>
          <Input type="number" min="0" max="100" value={profitSplit} onChange={e => setProfitSplit(e.target.value)} className="text-xs" />
        </div>
      </div>

      {deposit > 0 && remainingCosts > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-card rounded-lg p-3 border border-border">
              <p className="text-muted-foreground mb-1">Max Broker Gain (10% DD)</p>
              <p className="font-bold text-foreground">{formatCurrencyUnsigned(maxBrokerGain)}</p>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border">
              <p className="text-muted-foreground mb-1">Coverage</p>
              <p className={`font-bold ${fullyCovered ? "text-positive" : "text-negative"}`}>{coveragePct.toFixed(1)}%</p>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border">
              <p className="text-muted-foreground mb-1">Gross Payout Needed</p>
              <p className="font-bold text-foreground">{formatCurrencyUnsigned(grossPayoutNeeded)}</p>
            </div>
          </div>

          <div className={`rounded-lg p-3 border text-xs ${fullyCovered ? "bg-positive/10 border-positive/30" : "bg-destructive/10 border-destructive/30"}`}>
            {fullyCovered ? (
              <p className="font-bold text-positive">✅ FULLY COVERED. If prop blows, you recover all costs.</p>
            ) : (
              <p className="font-bold text-destructive">
                ❌ PARTIAL COVERAGE. You still need {formatCurrencyUnsigned(shortfall)} more. Requires additional hedge session(s).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
