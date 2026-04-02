import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { formatCurrency, formatCurrencyUnsigned, plColor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, XCircle, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";

export default function CycleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCycleWithCalcs, updateCycle, updatePhase, addPhase, deleteCycle } = useData();
  const cycle = getCycleWithCalcs(id!);

  const [blownOpen, setBlownOpen] = useState(false);
  const [passedOpen, setPassedOpen] = useState(false);
  const [brokerGain, setBrokerGain] = useState("");
  const [brokerLoss, setBrokerLoss] = useState("");
  const [activePhaseId, setActivePhaseId] = useState<string | null>(null);

  if (!cycle) return <div className="text-center py-16 text-muted-foreground">Cycle not found</div>;

  const activePhase = cycle.phases.find(p => p.status === "Active");
  const canAddPhase2 = cycle.phases.some(p => p.phase_type === "Phase 1" && p.status === "Pass") &&
                       !cycle.phases.some(p => p.phase_type === "Phase 2");

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

  const handlePhasePassed = () => {
    if (!activePhase) return;
    const loss = parseFloat(brokerLoss) || 0;
    updatePhase({ ...activePhase, status: "Pass", broker_loss: loss });

    // Auto-unlock next phase
    if (activePhase.phase_type === "Phase 1") {
      addPhase({
        cycle_id: cycle.id,
        phase_type: "Phase 2",
        order: 2,
        status: "Active",
        broker_loss: 0,
      });
    }
    // If Phase 2 passes, cycle stays active but no more phases for now

    setBrokerLoss("");
    setPassedOpen(false);
  };

  const openBlownDialog = (phaseId: string) => {
    setActivePhaseId(phaseId);
    setBlownOpen(true);
  };

  const openPassedDialog = (phaseId: string) => {
    setActivePhaseId(phaseId);
    setPassedOpen(true);
  };

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
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-muted-foreground">#{cycle.cycle_id}</span>
              <h1 className="text-xl font-bold">{cycle.prop_firm} — {cycle.client_name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${cycle.cycle_status === "Active" ? "bg-positive/20 text-positive" : "bg-primary/20 text-primary"}`}>{cycle.cycle_status}</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span>Account: <span className="text-foreground">{formatCurrencyUnsigned(cycle.account_size)}</span></span>
              <span>Fee: <span className="text-foreground">{formatCurrencyUnsigned(cycle.challenge_fee)}</span></span>
              <span>Started: <span className="text-foreground">{cycle.start_date}</span></span>
              {cycle.end_date && <span>Ended: <span className="text-foreground">{cycle.end_date}</span></span>}
            </div>
          </div>
          <Button size="sm" variant="destructive" onClick={() => { deleteCycle(cycle.id); navigate("/cycles"); }}>
            <Trash2 className="w-3 h-3 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Accumulated Costs - Always visible */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Accumulated Costs</p>
            <p className="text-3xl font-bold text-negative mt-1">{formatCurrencyUnsigned(cycle.accumulated_costs)}</p>
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs text-muted-foreground">
              Challenge Fee: <span className="text-foreground">{formatCurrencyUnsigned(cycle.challenge_fee)}</span>
            </div>
            {cycle.phases.filter(p => p.status === "Pass" && p.broker_loss > 0).map(p => (
              <div key={p.id} className="text-xs text-muted-foreground">
                {p.phase_type} broker loss: <span className="text-negative">{formatCurrencyUnsigned(p.broker_loss)}</span>
              </div>
            ))}
          </div>
        </div>
        {cycle.cycle_status === "Completed" && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Cycle P&L</p>
              <p className={`text-2xl font-bold ${plColor(cycle.cycle_pl)}`}>{formatCurrency(cycle.cycle_pl)}</p>
            </div>
            {cycle.broker_gain > 0 && (
              <p className="text-xs text-muted-foreground mt-1">Broker gain from blown prop: {formatCurrencyUnsigned(cycle.broker_gain)}</p>
            )}
          </div>
        )}
      </div>

      {/* Phases */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">PHASES</h2>
        {cycle.phases.map(phase => (
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

      {/* Prop Blown Dialog */}
      <Dialog open={blownOpen} onOpenChange={setBlownOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><XCircle className="w-5 h-5 text-negative" /> Prop Blown</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">The prop account was blown. How much did you gain on the broker?</p>
            <div>
              <Label>Broker Gain ($)</Label>
              <Input type="number" value={brokerGain} onChange={e => setBrokerGain(e.target.value)} placeholder="e.g. 1500" autoFocus />
            </div>
            {brokerGain && (
              <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">Estimated P&L:</p>
                <p className={`font-bold ${plColor((parseFloat(brokerGain) || 0) - cycle.challenge_fee)}`}>
                  {formatCurrency((parseFloat(brokerGain) || 0) - cycle.challenge_fee)}
                </p>
              </div>
            )}
            <Button onClick={handlePropBlown} variant="destructive" className="w-full">Confirm — Close Cycle</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phase Passed Dialog */}
      <Dialog open={passedOpen} onOpenChange={setPassedOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-positive" /> Phase Passed</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">How much did you lose on the broker in this phase?</p>
            <div>
              <Label>Broker Loss ($)</Label>
              <Input type="number" value={brokerLoss} onChange={e => setBrokerLoss(e.target.value)} placeholder="e.g. 300" autoFocus />
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
    </div>
  );
}
