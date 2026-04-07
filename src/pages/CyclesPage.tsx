import { useState } from "react";
import { useData } from "@/context/DataContext";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatCurrencyUnsigned, plColor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, ChevronRight, Info } from "lucide-react";
import { FeeRefundPolicy } from "@/types";

const ACCOUNT_SIZES = [5000, 10000, 25000, 50000, 100000, 200000];
const FEE_REFUND_OPTIONS: { value: FeeRefundPolicy; label: string }[] = [
  { value: "Never", label: "Never" },
  { value: "First payout", label: "1st Payout" },
  { value: "Second payout", label: "2nd Payout" },
  { value: "Third payout", label: "3rd Payout" },
  { value: "Fourth payout", label: "4th Payout" },
];

export default function CyclesPage() {
  const { getAllCyclesWithCalcs, addCycle, providers, clients } = useData();
  const navigate = useNavigate();
  const allCycles = getAllCyclesWithCalcs();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    client_name: "", prop_firm: "", account_size: "", challenge_fee: "", start_date: "", fee_refund_policy: "Never" as FeeRefundPolicy,
  });

  // Auto-fill fee refund policy when prop firm changes
  const handlePropFirmChange = (value: string) => {
    const provider = providers.find(pr => pr.name === value);
    console.log("[CyclesPage] Provider selected:", value, "Found:", provider?.name, "Policy:", provider?.fee_refund_policy);
    setForm(p => ({ ...p, prop_firm: value, fee_refund_policy: provider?.fee_refund_policy ?? p.fee_refund_policy }));
  };

  const handleAdd = () => {
    console.log("[CyclesPage] handleAdd called, form:", form);
    if (!form.client_name || !form.prop_firm || !form.account_size) {
      console.log("[CyclesPage] Validation failed - missing fields");
      return;
    }
    const id = addCycle({
      client_name: form.client_name,
      prop_firm: form.prop_firm,
      account_size: parseFloat(form.account_size),
      challenge_fee: parseFloat(form.challenge_fee) || 0,
      fee_refund_policy: form.fee_refund_policy,
      start_date: form.start_date || new Date().toISOString().split("T")[0],
    });
    console.log("[CyclesPage] Cycle created with id:", id);
    setForm({ client_name: "", prop_firm: "", account_size: "", challenge_fee: "", start_date: "", fee_refund_policy: "Never" });
    setOpen(false);
    navigate(`/cycles/${id}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cycles</h1>
          <p className="text-sm text-muted-foreground mt-1">{allCycles.length} total cycles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Cycle</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>New Cycle</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Client Name</Label><Input value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} placeholder="e.g. Giammarco Manetti" /></div>
              <div><Label>Prop Firm</Label><Input value={form.prop_firm} onChange={e => handlePropFirmChange(e.target.value)} placeholder="e.g. FTMO, FundingPips" /></div>
              <div><Label>Account Size</Label>
                <Select value={form.account_size} onValueChange={v => setForm(p => ({ ...p, account_size: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_SIZES.map(s => (
                      <SelectItem key={s} value={String(s)}>${s.toLocaleString()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <Label>Challenge Fee ($)</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[220px] text-xs">This fee may be refunded by the provider after a certain number of payouts. Check provider settings.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input type="number" min="0" value={form.challenge_fee} onChange={e => setForm(p => ({ ...p, challenge_fee: e.target.value.replace(/^-/, "") }))} placeholder="e.g. 500" />
              </div>
              <div><Label>Fee Refund Policy</Label>
                <Select value={form.fee_refund_policy} onValueChange={v => setForm(p => ({ ...p, fee_refund_policy: v as FeeRefundPolicy }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FEE_REFUND_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <Button onClick={handleAdd} className="w-full">Create Cycle</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cycle List */}
      <div className="space-y-3">
        {allCycles.length === 0 && <p className="text-center text-muted-foreground py-12">No cycles found. Create your first cycle to get started.</p>}
        {allCycles.map(c => {
          const activePhase = c.phases.find(p => p.status === "Active");
          const lastPhase = c.phases[c.phases.length - 1];
          return (
            <div key={c.id} onClick={() => navigate(`/cycles/${c.id}`)} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{c.cycle_id}</span>
                    <span className="font-semibold">{c.prop_firm} — {c.client_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.cycle_status === "Active" ? "bg-positive/20 text-positive" : "bg-primary/20 text-primary"}`}>{c.cycle_status}</span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{formatCurrencyUnsigned(c.account_size)} account</span>
                    <span>Fee: {formatCurrencyUnsigned(c.challenge_fee)}</span>
                    {activePhase && <span className="text-positive">Current: {activePhase.phase_type}</span>}
                    {!activePhase && lastPhase && <span>Last: {lastPhase.phase_type} ({lastPhase.status})</span>}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Accumulated Costs</p>
                    <p className="font-bold text-negative">{formatCurrencyUnsigned(c.accumulated_costs)}</p>
                    {c.fee_refunded && (
                      <p className="text-[10px] text-positive">Fee refunded</p>
                    )}
                  </div>
                  {c.cycle_status === "Completed" && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">P&L</p>
                      <p className={`font-bold ${plColor(c.cycle_pl)}`}>{formatCurrency(c.cycle_pl)}</p>
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
