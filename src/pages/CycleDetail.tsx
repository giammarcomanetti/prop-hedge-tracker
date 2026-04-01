import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { formatCurrency, formatCurrencyUnsigned, formatDate, plColor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, CheckCircle, XCircle, Clock, Circle } from "lucide-react";
import { PhaseType, PhaseStatus, CycleStatus } from "@/types";

export default function CycleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCycleWithCalcs, addPhase, updatePhase, deletePhase, addPayout, deletePayout, updateCycle } = useData();
  const cycle = getCycleWithCalcs(id!);

  const [phaseOpen, setPhaseOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [phaseForm, setPhaseForm] = useState({
    phase_type: "1st Step" as PhaseType, start_date: "", end_date: "", status: "Active" as PhaseStatus,
    real_deposit: "", bonus_used: "", broker_pl_phase: "", bonus_lost_phase: "", trades_executed: "",
    recovery_rate_set: "", recovery_rate_real: "", notes: "",
  });
  const [payoutForm, setPayoutForm] = useState({
    amount: "", date: "", includes_fee_refund: false, fee_refund_amount: "", notes: "",
  });

  if (!cycle) return <div className="text-center py-16 text-muted-foreground">Cycle not found</div>;

  const handleAddPhase = () => {
    addPhase({
      cycle_id: cycle.id, phase_type: phaseForm.phase_type, order: cycle.phases.length + 1,
      start_date: phaseForm.start_date, end_date: phaseForm.end_date, status: phaseForm.status,
      real_deposit: parseFloat(phaseForm.real_deposit) || 0, bonus_used: parseFloat(phaseForm.bonus_used) || 0,
      broker_pl_phase: parseFloat(phaseForm.broker_pl_phase) || 0, bonus_lost_phase: parseFloat(phaseForm.bonus_lost_phase) || 0,
      trades_executed: parseInt(phaseForm.trades_executed) || 0,
      recovery_rate_set: parseFloat(phaseForm.recovery_rate_set) || 0, recovery_rate_real: parseFloat(phaseForm.recovery_rate_real) || 0,
      notes: phaseForm.notes,
    });
    setPhaseForm({ phase_type: "1st Step", start_date: "", end_date: "", status: "Active", real_deposit: "", bonus_used: "", broker_pl_phase: "", bonus_lost_phase: "", trades_executed: "", recovery_rate_set: "", recovery_rate_real: "", notes: "" });
    setPhaseOpen(false);
  };

  const handleAddPayout = () => {
    addPayout({
      cycle_id: cycle.id, payout_number: cycle.payouts.length + 1,
      amount: parseFloat(payoutForm.amount) || 0, date: payoutForm.date,
      includes_fee_refund: payoutForm.includes_fee_refund, fee_refund_amount: parseFloat(payoutForm.fee_refund_amount) || 0,
      notes: payoutForm.notes,
    });
    setPayoutForm({ amount: "", date: "", includes_fee_refund: false, fee_refund_amount: "", notes: "" });
    setPayoutOpen(false);
  };

  const statusIcon = (s: PhaseStatus) => {
    switch (s) {
      case "Pass": return <CheckCircle className="w-4 h-4 text-positive" />;
      case "Fail": return <XCircle className="w-4 h-4 text-negative" />;
      case "Active": return <Clock className="w-4 h-4 text-neutral-warn" />;
      default: return <Circle className="w-4 h-4 text-muted-foreground" />;
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
              <h1 className="text-xl font-bold">{cycle.cycle_name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${cycle.cycle_status === "Active" ? "bg-positive text-primary-foreground" : cycle.cycle_status === "Completed" ? "bg-secondary text-secondary-foreground" : "bg-negative text-destructive-foreground"}`}>{cycle.cycle_status}</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span>Client: <span className="text-foreground">{cycle.client?.name ?? "—"}</span></span>
              <span>Provider: <span className="text-foreground">{cycle.provider?.name ?? "—"}</span></span>
              <span>Account: <span className="text-foreground">{formatCurrencyUnsigned(cycle.account_size)}</span></span>
              <span>{formatDate(cycle.start_date)}{cycle.end_date ? ` → ${formatDate(cycle.end_date)}` : ""}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {cycle.cycle_status === "Active" && (
              <>
                <Button size="sm" variant="outline" onClick={() => updateCycle({ ...cycle, cycle_status: "Completed", end_date: new Date().toISOString().split("T")[0] })}>Mark Completed</Button>
                <Button size="sm" variant="destructive" onClick={() => updateCycle({ ...cycle, cycle_status: "Abandoned", end_date: new Date().toISOString().split("T")[0] })}>Abandon</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Economic Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Challenge Fee</p>
          <p className="text-lg font-bold">{formatCurrencyUnsigned(cycle.challenge_fee)}</p>
          <p className="text-xs">{cycle.fee_refunded ? <span className="text-positive">Refunded</span> : <span className="text-muted-foreground">Not refunded</span>}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Broker Losses</p>
          <p className="text-lg font-bold text-negative">{formatCurrencyUnsigned(cycle.total_real_broker_losses)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Payouts</p>
          <p className="text-lg font-bold text-positive">{formatCurrencyUnsigned(cycle.total_payouts_received)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Cycle P&L</p>
          <p className={`text-lg font-bold ${plColor(cycle.cycle_pl)}`}>{formatCurrency(cycle.cycle_pl)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Break-Even</p>
          <p className="text-lg font-bold">{cycle.break_even_reached ? <span className="text-positive">✓ Yes</span> : <span className="text-neutral-warn">Not yet</span>}</p>
          {!cycle.break_even_reached && <p className="text-xs text-muted-foreground">{formatCurrencyUnsigned(cycle.distance_to_break_even)} to go</p>}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Bonus Used</p>
          <p className="text-lg font-bold">{formatCurrencyUnsigned(cycle.total_bonus_used)}</p>
          <p className="text-xs text-muted-foreground">Lost: {formatCurrencyUnsigned(cycle.total_bonus_lost)}</p>
        </div>
      </div>

      {/* Phases */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Phases ({cycle.phases.length})</h2>
          <Dialog open={phaseOpen} onOpenChange={setPhaseOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" /> Add Phase</Button></DialogTrigger>
            <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Phase</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phase Type</Label>
                    <Select value={phaseForm.phase_type} onValueChange={v => setPhaseForm(p => ({ ...p, phase_type: v as PhaseType }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="1st Step">1st Step</SelectItem><SelectItem value="2nd Step">2nd Step</SelectItem><SelectItem value="Funded Hedge">Funded Hedge</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Status</Label>
                    <Select value={phaseForm.status} onValueChange={v => setPhaseForm(p => ({ ...p, status: v as PhaseStatus }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Not Started">Not Started</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Pass">Pass</SelectItem><SelectItem value="Fail">Fail</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start Date</Label><Input type="date" value={phaseForm.start_date} onChange={e => setPhaseForm(p => ({ ...p, start_date: e.target.value }))} /></div>
                  <div><Label>End Date</Label><Input type="date" value={phaseForm.end_date} onChange={e => setPhaseForm(p => ({ ...p, end_date: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Real Deposit ($)</Label><Input type="number" value={phaseForm.real_deposit} onChange={e => setPhaseForm(p => ({ ...p, real_deposit: e.target.value }))} /></div>
                  <div><Label>Bonus Used ($)</Label><Input type="number" value={phaseForm.bonus_used} onChange={e => setPhaseForm(p => ({ ...p, bonus_used: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Broker P&L ($)</Label><Input type="number" value={phaseForm.broker_pl_phase} onChange={e => setPhaseForm(p => ({ ...p, broker_pl_phase: e.target.value }))} placeholder="+ if broker gained" /></div>
                  <div><Label>Bonus Lost ($)</Label><Input type="number" value={phaseForm.bonus_lost_phase} onChange={e => setPhaseForm(p => ({ ...p, bonus_lost_phase: e.target.value }))} /></div>
                </div>
                <div><Label>Trades Executed</Label><Input type="number" value={phaseForm.trades_executed} onChange={e => setPhaseForm(p => ({ ...p, trades_executed: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Recovery Rate Set ($)</Label><Input type="number" value={phaseForm.recovery_rate_set} onChange={e => setPhaseForm(p => ({ ...p, recovery_rate_set: e.target.value }))} /></div>
                  <div><Label>Recovery Rate Real ($)</Label><Input type="number" value={phaseForm.recovery_rate_real} onChange={e => setPhaseForm(p => ({ ...p, recovery_rate_real: e.target.value }))} /></div>
                </div>
                <div><Label>Notes</Label><Textarea value={phaseForm.notes} onChange={e => setPhaseForm(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button onClick={handleAddPhase} className="w-full">Add Phase</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {cycle.phases.length === 0 ? <p className="text-sm text-muted-foreground">No phases yet</p> : (
          <div className="space-y-2">
            {cycle.phases.map(phase => (
              <div key={phase.id} className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {statusIcon(phase.status)}
                    <span className="font-medium text-sm">{phase.phase_type}</span>
                    <span className="text-xs text-muted-foreground">Order #{phase.order}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${phase.status === "Pass" ? "bg-positive text-primary-foreground" : phase.status === "Fail" ? "bg-negative text-destructive-foreground" : phase.status === "Active" ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground"}`}>{phase.status}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deletePhase(phase.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                  <div><span className="text-muted-foreground">Period</span><p>{formatDate(phase.start_date)} → {formatDate(phase.end_date)}</p></div>
                  <div><span className="text-muted-foreground">Real Deposit</span><p>{formatCurrencyUnsigned(phase.real_deposit)}</p></div>
                  <div><span className="text-muted-foreground">Broker P&L</span><p className={plColor(phase.broker_pl_phase)}>{formatCurrency(phase.broker_pl_phase)}</p></div>
                  <div><span className="text-muted-foreground">Bonus Used/Lost</span><p>{formatCurrencyUnsigned(phase.bonus_used)} / {formatCurrencyUnsigned(phase.bonus_lost_phase)}</p></div>
                  <div><span className="text-muted-foreground">Recovery Set/Real</span><p>{formatCurrencyUnsigned(phase.recovery_rate_set)} / {formatCurrencyUnsigned(phase.recovery_rate_real)}</p></div>
                  <div><span className="text-muted-foreground">Trades</span><p>{phase.trades_executed}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payouts */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Payouts ({cycle.payouts.length})</h2>
          <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" /> Register Payout</Button></DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Register Payout</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Amount ($)</Label><Input type="number" value={payoutForm.amount} onChange={e => setPayoutForm(p => ({ ...p, amount: e.target.value }))} /></div>
                <div><Label>Date</Label><Input type="date" value={payoutForm.date} onChange={e => setPayoutForm(p => ({ ...p, date: e.target.value }))} /></div>
                <div className="flex items-center gap-3">
                  <Switch checked={payoutForm.includes_fee_refund} onCheckedChange={v => setPayoutForm(p => ({ ...p, includes_fee_refund: v }))} />
                  <Label>Includes Fee Refund</Label>
                </div>
                {payoutForm.includes_fee_refund && (
                  <div><Label>Fee Refund Amount ($)</Label><Input type="number" value={payoutForm.fee_refund_amount} onChange={e => setPayoutForm(p => ({ ...p, fee_refund_amount: e.target.value }))} /></div>
                )}
                <div><Label>Notes</Label><Textarea value={payoutForm.notes} onChange={e => setPayoutForm(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button onClick={handleAddPayout} className="w-full">Register Payout</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {cycle.payouts.length === 0 ? <p className="text-sm text-muted-foreground">No payouts yet</p> : (
          <div className="space-y-2">
            {cycle.payouts.map(payout => (
              <div key={payout.id} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">#{payout.payout_number}</span>
                  <span className="font-semibold text-positive">{formatCurrencyUnsigned(payout.amount)}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(payout.date)}</span>
                  {payout.includes_fee_refund && <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">Fee refund: {formatCurrencyUnsigned(payout.fee_refund_amount)}</span>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => deletePayout(payout.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
