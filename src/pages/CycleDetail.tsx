import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { formatCurrency, formatCurrencyUnsigned, plColor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, XCircle, CheckCircle, AlertTriangle, Plus, DollarSign } from "lucide-react";

import CycleHeader from "@/components/cycle/CycleHeader";
import AccumulatedCostsCard from "@/components/cycle/AccumulatedCostsCard";
import FundedHedgeCalculator from "@/components/cycle/FundedHedgeCalculator";

export default function CycleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCycleWithCalcs, updateCycle, updatePhase, addPhase, addPayout, deleteCycle } = useData();
  const cycle = getCycleWithCalcs(id!);

  const [blownOpen, setBlownOpen] = useState(false);
  const [passedOpen, setPassedOpen] = useState(false);
  const [fundedBlownOpen, setFundedBlownOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [brokerGain, setBrokerGain] = useState("");
  const [brokerLoss, setBrokerLoss] = useState("");
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);

  // Funded hedge payout fields
  const [payoutInputMode, setPayoutInputMode] = useState<"gross" | "net">("gross");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [profitSplit, setProfitSplit] = useState("80");
  const [sessionBrokerLoss, setSessionBrokerLoss] = useState("");
  const [fundedBrokerGain, setFundedBrokerGain] = useState("");

  if (!cycle) return <div className="text-center py-16 text-muted-foreground">Cycle not found</div>;

  const activePhase = cycle.phases.find(p => p.status === "Active");
  const phase2Passed = cycle.phases.some(p => p.phase_type === "Phase 2" && p.status === "Pass");
  const hasActiveFundedHedge = cycle.phases.some(p => p.phase_type === "Funded Hedge" && p.status === "Active");
  const canAddFundedHedge = phase2Passed && !hasActiveFundedHedge && cycle.cycle_status === "Active";

  const fundedHedgeSessions = cycle.phases.filter(p => p.phase_type === "Funded Hedge");
  const nextSessionNumber = fundedHedgeSessions.length + 1;

  // Phase 1/2 prop blown
  const handlePropBlown = () => {
    if (!activePhase) return;
    const gain = parseFloat(brokerGain) || 0;
    updatePhase({ ...activePhase, status: "Fail" });
    updateCycle({
      ...cycle,
      cycle_status: "Completed",
      end_date: new Date().toISOString().split("T")[0],
      broker_gain: gain,
    });
    setBrokerGain("");
    setBlownOpen(false);
  };

  // Phase 1/2 passed
  const handlePhasePassed = () => {
    if (!activePhase) return;
    const loss = parseFloat(brokerLoss) || 0;
    updatePhase({ ...activePhase, status: "Pass", broker_loss: loss });

    if (activePhase.phase_type === "Phase 1") {
      addPhase({
        cycle_id: cycle.id,
        phase_type: "Phase 2",
        order: 2,
        status: "Active",
        broker_loss: 0,
      });
    }

    setBrokerLoss("");
    setPassedOpen(false);
  };

  // Funded hedge prop blown
  const handleFundedHedgeBlown = () => {
    const phase = cycle.phases.find(p => p.id === activePhaseId);
    if (!phase) return;
    const gain = parseFloat(fundedBrokerGain) || 0;
    updatePhase({ ...phase, status: "Fail" });
    updateCycle({
      ...cycle,
      cycle_status: "Completed",
      end_date: new Date().toISOString().split("T")[0],
      broker_gain: gain,
    });
    setFundedBrokerGain("");
    setFundedBlownOpen(false);
  };

  // Funded hedge payout received
  const handlePayoutReceived = () => {
    const phase = cycle.phases.find(p => p.id === activePhaseId);
    if (!phase) return;
    const amount = parseFloat(payoutAmount) || 0;
    const split = parseFloat(profitSplit) || 80;
    const loss = parseFloat(sessionBrokerLoss) || 0;

    // Calculate net based on input mode
    const netAmount = payoutInputMode === "gross" ? amount * (split / 100) : amount;
    const grossAmount = payoutInputMode === "gross" ? amount : amount / (split / 100);

    console.log(`[Payout] Mode: ${payoutInputMode}, Amount: ${amount}, Net: ${netAmount}, Gross: ${grossAmount}, Loss: ${loss}`);

    // Record broker loss on this session
    updatePhase({ ...phase, status: "Pass", broker_loss: loss });

    // Record payout
    const payoutNumber = cycle.phases.filter(p => p.phase_type === "Funded Hedge" && p.status === "Pass").length + 1;
    addPayout({
      cycle_id: cycle.id,
      phase_id: phase.id,
      payout_number: payoutNumber,
      gross_amount: grossAmount,
      profit_split_pct: split,
      net_amount: netAmount,
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });

    setPayoutAmount("");
    setProfitSplit("80");
    setSessionBrokerLoss("");
    setPayoutInputMode("gross");
    setPayoutOpen(false);
  };

  const handleAddFundedHedge = () => {
    const maxOrder = Math.max(...cycle.phases.map(p => p.order), 0);
    addPhase({
      cycle_id: cycle.id,
      phase_type: "Funded Hedge",
      order: maxOrder + 1,
      status: "Active",
      broker_loss: 0,
      session_number: nextSessionNumber,
    });
  };

  const handleCloseCycleCompleted = () => {
    updateCycle({
      ...cycle,
      cycle_status: "Completed",
      end_date: new Date().toISOString().split("T")[0],
    });
  };

  const openBlownDialog = (phaseId: string) => {
    setActivePhaseId(phaseId);
    setBrokerGain("");
    setBlownOpen(true);
  };

  const openPassedDialog = (phaseId: string) => {
    setActivePhaseId(phaseId);
    setBrokerLoss("");
    setPassedOpen(true);
  };

  const openFundedBlownDialog = (phaseId: string) => {
    setActivePhaseId(phaseId);
    setFundedBrokerGain("");
    setFundedBlownOpen(true);
  };

  const openPayoutDialog = (phaseId: string) => {
    setActivePhaseId(phaseId);
    setPayoutAmount("");
    setProfitSplit("80");
    setSessionBrokerLoss("");
    setPayoutInputMode("gross");
    setPayoutOpen(true);
  };

  // Realtime payout preview calculations
  const previewAmount = parseFloat(payoutAmount) || 0;
  const previewSplit = parseFloat(profitSplit) || 80;
  const previewSessionLoss = parseFloat(sessionBrokerLoss) || 0;
  const previewNet = payoutInputMode === "gross" ? previewAmount * (previewSplit / 100) : previewAmount;

  // Fee refund logic: check if THIS payout triggers a refund
  const existingPayoutCount = cycle.phases.filter(p => p.phase_type === "Funded Hedge" && p.status === "Pass").length;
  const newPayoutCount = existingPayoutCount + 1;
  const policy = cycle.fee_refund_policy || "Never";
  const refundThreshold: Record<string, number> = {
    "First payout": 1,
    "Second payout": 2,
    "Third payout": 3,
    "Fourth payout": 4,
    "Never": Infinity,
  };
  const alreadyRefunded = cycle.fee_refunded;
  const willRefundNow = !alreadyRefunded && newPayoutCount >= (refundThreshold[policy] ?? Infinity);
  const feeRefundAmount = willRefundNow ? cycle.challenge_fee : 0;

  const previewNewAccumulated = cycle.accumulated_costs + previewSessionLoss - feeRefundAmount;
  const previewRemaining = previewNewAccumulated - cycle.total_net_payouts - previewNet;

  // Funded blown preview
  const previewFundedGain = parseFloat(fundedBrokerGain) || 0;
  const previewFundedPL = previewFundedGain - cycle.accumulated_costs;

  const statusBadge = (status: string) => {
    switch (status) {
      case "Active": return <span className="text-xs px-2 py-0.5 rounded-full bg-positive/20 text-positive font-medium">ACTIVE</span>;
      case "Pass": return <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">PASS</span>;
      case "Fail": return <span className="text-xs px-2 py-0.5 rounded-full bg-negative/20 text-negative font-medium">FAIL</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate("/cycles")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Cycles
      </button>

      {/* Header */}
      <CycleHeader cycle={cycle} onDelete={() => { deleteCycle(cycle.id); navigate("/cycles"); }} />

      {/* Accumulated Costs */}
      <AccumulatedCostsCard cycle={cycle} />

      {/* Phases */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">PHASES</h2>
        {cycle.phases.filter(p => p.phase_type !== "Funded Hedge").map(phase => (
          <div key={phase.id} className={`bg-card border rounded-xl p-5 ${phase.status === "Active" ? "border-positive/30" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {phase.status === "Pass" && <CheckCircle className="w-5 h-5 text-primary" />}
                {phase.status === "Fail" && <XCircle className="w-5 h-5 text-negative" />}
                {phase.status === "Active" && <AlertTriangle className="w-5 h-5 text-positive" />}
                <span className="font-semibold">{phase.phase_type}</span>
                {statusBadge(phase.status)}
              </div>

              {phase.status === "Active" && cycle.cycle_status === "Active" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => openBlownDialog(phase.id)}>
                    <XCircle className="w-3 h-3 mr-1" /> Prop Blown
                  </Button>
                  <Button size="sm" onClick={() => openPassedDialog(phase.id)}>
                    <CheckCircle className="w-3 h-3 mr-1" /> Phase Passed
                  </Button>
                </div>
              )}
            </div>

            {phase.status === "Pass" && phase.broker_loss > 0 && (
              <div className="mt-3 text-sm text-muted-foreground">
                Broker loss: <span className="text-negative font-medium">{formatCurrencyUnsigned(phase.broker_loss)}</span>
              </div>
            )}

            {phase.status === "Fail" && (
              <div className="mt-3 text-sm text-muted-foreground">
                Prop was blown — broker gained: <span className="text-positive font-medium">{formatCurrencyUnsigned(cycle.broker_gain)}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Funded Hedge Sessions */}
      {(fundedHedgeSessions.length > 0 || canAddFundedHedge) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">FUNDED HEDGE SESSIONS</h2>
            {canAddFundedHedge && (
              <Button size="sm" variant="outline" onClick={handleAddFundedHedge}>
                <Plus className="w-3 h-3 mr-1" /> Add Funded Hedge Session
              </Button>
            )}
          </div>

          {fundedHedgeSessions.map(session => (
            <div key={session.id} className={`bg-card border rounded-xl p-5 ${session.status === "Active" ? "border-positive/30" : "border-border"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {session.status === "Pass" && <CheckCircle className="w-5 h-5 text-primary" />}
                  {session.status === "Fail" && <XCircle className="w-5 h-5 text-negative" />}
                  {session.status === "Active" && <DollarSign className="w-5 h-5 text-positive" />}
                  <span className="font-semibold">Session {session.session_number || 1}</span>
                  {statusBadge(session.status)}
                </div>

                {session.status === "Active" && cycle.cycle_status === "Active" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => openFundedBlownDialog(session.id)}>
                      <XCircle className="w-3 h-3 mr-1" /> Prop Blown
                    </Button>
                    <Button size="sm" onClick={() => openPayoutDialog(session.id)}>
                      <DollarSign className="w-3 h-3 mr-1" /> Payout Received
                    </Button>
                  </div>
                )}
              </div>

              {session.status === "Pass" && session.broker_loss > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Session broker loss: <span className="text-negative font-medium">{formatCurrencyUnsigned(session.broker_loss)}</span>
                </div>
              )}

              {session.status === "Fail" && (
                <div className="mt-3 text-sm text-muted-foreground">
                  Prop was blown — broker gained: <span className="text-positive font-medium">{formatCurrencyUnsigned(cycle.broker_gain)}</span>
                </div>
              )}

              {/* Calculator for active sessions */}
              {session.status === "Active" && cycle.cycle_status === "Active" && (
                <FundedHedgeCalculator
                  remainingCosts={cycle.remaining_costs > 0 ? cycle.remaining_costs : 0}
                />
              )}
            </div>
          ))}

          {/* Risk free banner + close cycle button */}
          {cycle.is_risk_free && cycle.cycle_status === "Active" && (
            <div className="bg-positive/10 border border-positive/30 rounded-xl p-5 text-center space-y-3">
              <p className="text-lg font-bold text-positive">🎯 RISK FREE — Surplus: {formatCurrencyUnsigned(Math.abs(cycle.remaining_costs))}</p>
              <p className="text-sm text-muted-foreground">You can continue adding sessions or close the cycle.</p>
              <Button onClick={handleCloseCycleCompleted}>
                <CheckCircle className="w-4 h-4 mr-1" /> Close Cycle as Completed
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Phase 1/2 Prop Blown Dialog */}
      <Dialog open={blownOpen} onOpenChange={setBlownOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><XCircle className="w-5 h-5 text-negative" /> Prop Blown</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">The prop account was blown. How much did you gain on the broker?</p>
            <div>
              <Label>Broker Gain ($)</Label>
              <Input type="number" min="0" value={brokerGain} onChange={e => setBrokerGain(e.target.value)} placeholder="e.g. 1500" autoFocus />
            </div>
            {brokerGain && (
              <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">Estimated P&L:</p>
                <p className={`font-bold ${plColor((parseFloat(brokerGain) || 0) - cycle.accumulated_costs)}`}>
                  {formatCurrency((parseFloat(brokerGain) || 0) - cycle.accumulated_costs)}
                </p>
              </div>
            )}
            <Button onClick={handlePropBlown} variant="destructive" className="w-full">Confirm — Close Cycle</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phase 1/2 Passed Dialog */}
      <Dialog open={passedOpen} onOpenChange={setPassedOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-positive" /> Phase Passed</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">How much did you lose on the broker in this phase?</p>
            <div>
              <Label>Broker Loss ($)</Label>
              <Input type="number" min="0" value={brokerLoss} onChange={e => setBrokerLoss(e.target.value)} placeholder="e.g. 300" autoFocus />
            </div>
            {brokerLoss && (
              <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">New accumulated costs will be:</p>
                <p className="font-bold text-negative">
                  {formatCurrencyUnsigned(cycle.accumulated_costs + (parseFloat(brokerLoss) || 0))}
                </p>
              </div>
            )}
            <Button onClick={handlePhasePassed} className="w-full">Confirm — Unlock Next Phase</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Funded Hedge Prop Blown Dialog */}
      <Dialog open={fundedBlownOpen} onOpenChange={setFundedBlownOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><XCircle className="w-5 h-5 text-negative" /> Prop Blown — Funded Hedge</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">How much did you gain on the broker?</p>
            <div>
              <Label>Broker Gain ($)</Label>
              <Input type="number" min="0" value={fundedBrokerGain} onChange={e => setFundedBrokerGain(e.target.value)} placeholder="e.g. 5000" autoFocus />
            </div>
            {fundedBrokerGain && (
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Broker gain:</span>
                  <span className="text-positive font-medium">{formatCurrencyUnsigned(previewFundedGain)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total accumulated costs:</span>
                  <span className="text-negative font-medium">{formatCurrencyUnsigned(cycle.accumulated_costs)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold">Cycle P&L:</span>
                  <span className={`font-bold ${plColor(previewFundedPL)}`}>{formatCurrency(previewFundedPL)}</span>
                </div>
                <p className={`text-center font-semibold mt-2 ${previewFundedPL >= 0 ? "text-positive" : "text-negative"}`}>
                  {previewFundedPL >= 0 ? "Cycle closed in PROFIT ✅" : "Cycle closed in LOSS ❌"}
                </p>
              </div>
            )}
            <Button onClick={handleFundedHedgeBlown} variant="destructive" className="w-full">Confirm — Close Cycle</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payout Received Dialog */}
      <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
        <DialogContent className="bg-card border-border">
           <DialogHeader><DialogTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-positive" /> Payout Received</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Gross/Net Toggle */}
            <div className="flex items-center gap-3">
              <span className={`text-sm ${payoutInputMode === "gross" ? "text-foreground font-medium" : "text-muted-foreground"}`}>Gross Payout</span>
              <Switch
                checked={payoutInputMode === "net"}
                onCheckedChange={(checked) => {
                  setPayoutInputMode(checked ? "net" : "gross");
                  setPayoutAmount("");
                }}
              />
              <span className={`text-sm ${payoutInputMode === "net" ? "text-foreground font-medium" : "text-muted-foreground"}`}>Net Payout</span>
            </div>

            <div>
              <Label>{payoutInputMode === "gross" ? "Gross Payout ($)" : "Net Payout ($)"}</Label>
              <Input type="number" min="0" value={payoutAmount} onChange={e => setPayoutAmount(e.target.value)} placeholder="e.g. 5000" autoFocus />
            </div>

            {payoutInputMode === "gross" && (
              <div>
                <Label>Profit Split (%)</Label>
                <Input type="number" min="0" max="100" value={profitSplit} onChange={e => setProfitSplit(e.target.value)} placeholder="80" />
              </div>
            )}

            <div>
              <Label>Broker Loss This Session ($)</Label>
              <Input type="number" min="0" value={sessionBrokerLoss} onChange={e => setSessionBrokerLoss(e.target.value)} placeholder="e.g. 800" />
            </div>

            {(payoutAmount || sessionBrokerLoss) && (
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net payout:</span>
                  <span className="text-positive font-medium">{formatCurrencyUnsigned(previewNet)}</span>
                </div>
                {previewSessionLoss > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Session broker loss:</span>
                    <span className="text-negative font-medium">{formatCurrencyUnsigned(previewSessionLoss)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New accumulated costs:</span>
                  <span className="text-negative font-medium">{formatCurrencyUnsigned(previewNewAccumulated)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold">Remaining to recover:</span>
                  <span className={`font-bold ${previewRemaining <= 0 ? "text-positive" : "text-negative"}`}>
                    {previewRemaining <= 0 ? formatCurrencyUnsigned(0) : formatCurrencyUnsigned(previewRemaining)}
                  </span>
                </div>
                <p className={`text-center font-semibold mt-1 ${previewRemaining <= 0 ? "text-positive" : "text-muted-foreground"}`}>
                  {previewRemaining <= 0
                    ? `🎯 RISK FREE — Surplus: ${formatCurrencyUnsigned(Math.abs(previewRemaining))}`
                    : `Still need ${formatCurrencyUnsigned(previewRemaining)} more to break even`}
                </p>
              </div>
            )}

            <Button onClick={handlePayoutReceived} className="w-full">Confirm Payout</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
