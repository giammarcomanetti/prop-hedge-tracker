import { useState } from "react";
import { formatCurrencyUnsigned } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

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

  const estimatedGrossPayout = deposit > 0 && recovery > 0 ? (deposit / recovery) * 100 : 0;
  const estimatedNetPayout = estimatedGrossPayout * (split / 100);
  const estimatedBrokerGainIfBlown = deposit * (recovery / 100);
  const coversRemaining = estimatedNetPayout >= remainingCosts && remainingCosts > 0;

  return (
    <div className="mt-4 border border-border rounded-lg p-4 bg-secondary/30">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-muted-foreground">SESSION CALCULATOR</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <Label className="text-xs">Costs to Recover ($)</Label>
          <Input value={formatCurrencyUnsigned(remainingCosts)} disabled className="text-xs" />
        </div>
        <div>
          <Label className="text-xs">Broker Deposit ($)</Label>
          <Input type="number" min="0" value={brokerDeposit} onChange={e => setBrokerDeposit(e.target.value)} placeholder="e.g. 2000" className="text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Recovery %</Label>
            <Input type="number" min="0" max="100" value={recoveryRate} onChange={e => setRecoveryRate(e.target.value)} className="text-xs" />
          </div>
          <div>
            <Label className="text-xs">Split %</Label>
            <Input type="number" min="0" max="100" value={profitSplit} onChange={e => setProfitSplit(e.target.value)} className="text-xs" />
          </div>
        </div>
      </div>

      {deposit > 0 && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-muted-foreground mb-1">Est. Gross Payout</p>
            <p className="font-bold text-foreground">{formatCurrencyUnsigned(estimatedGrossPayout)}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-muted-foreground mb-1">Est. Net Payout</p>
            <p className="font-bold text-foreground">{formatCurrencyUnsigned(estimatedNetPayout)}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-muted-foreground mb-1">If Prop Blown — Broker Gain</p>
            <p className="font-bold text-positive">{formatCurrencyUnsigned(estimatedBrokerGainIfBlown)}</p>
          </div>
          <div className={`rounded-lg p-3 border ${coversRemaining ? "bg-positive/10 border-positive/30" : "bg-card border-border"}`}>
            <p className="text-muted-foreground mb-1">Covers Remaining?</p>
            <p className={`font-bold ${coversRemaining ? "text-positive" : "text-negative"}`}>
              {remainingCosts <= 0 ? "Already Risk Free ✅" : coversRemaining ? "Yes ✅" : "No ❌"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
