import { useState } from "react";
import { useData } from "@/context/DataContext";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatDate, plColor, formatCurrencyUnsigned } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ChevronRight, Filter } from "lucide-react";
import { CycleStatus } from "@/types";

export default function CyclesPage() {
  const { getAllCyclesWithCalcs, clients, providers, addCycle } = useData();
  const navigate = useNavigate();
  const allCycles = getAllCyclesWithCalcs();
  const [open, setOpen] = useState(false);
  const [filterClient, setFilterClient] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [form, setForm] = useState({
    cycle_name: "", client_id: "", provider_id: "", account_size: "",
    challenge_fee: "", start_date: "", notes: "",
  });

  const filtered = allCycles.filter(c => {
    if (filterClient !== "all" && c.client_id !== filterClient) return false;
    if (filterProvider !== "all" && c.provider_id !== filterProvider) return false;
    if (filterStatus !== "all" && c.cycle_status !== filterStatus) return false;
    return true;
  });

  const handleAdd = () => {
    if (!form.cycle_name || !form.client_id || !form.provider_id) return;
    addCycle({
      cycle_name: form.cycle_name, client_id: form.client_id, provider_id: form.provider_id,
      account_size: parseFloat(form.account_size) || 0, challenge_fee: parseFloat(form.challenge_fee) || 0,
      start_date: form.start_date, end_date: "", cycle_status: "Active", notes: form.notes,
    });
    setForm({ cycle_name: "", client_id: "", provider_id: "", account_size: "", challenge_fee: "", start_date: "", notes: "" });
    setOpen(false);
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
              <div><Label>Cycle Name</Label><Input value={form.cycle_name} onChange={e => setForm(p => ({ ...p, cycle_name: e.target.value }))} placeholder="e.g. FTMO Vania 100K" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Client</Label>
                  <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Provider</Label>
                  <Select value={form.provider_id} onValueChange={v => setForm(p => ({ ...p, provider_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Account Size ($)</Label><Input type="number" value={form.account_size} onChange={e => setForm(p => ({ ...p, account_size: e.target.value }))} /></div>
                <div><Label>Challenge Fee ($)</Label><Input type="number" value={form.challenge_fee} onChange={e => setForm(p => ({ ...p, challenge_fee: e.target.value }))} /></div>
              </div>
              <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button onClick={handleAdd} className="w-full">Create Cycle</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Client" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Clients</SelectItem>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Providers</SelectItem>{providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="Active">Active</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Abandoned">Abandoned</SelectItem></SelectContent>
        </Select>
      </div>

      {/* Cycle List */}
      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No cycles found. Create your first cycle to get started.</p>}
        {filtered.map(c => (
          <div key={c.id} onClick={() => navigate(`/cycles/${c.id}`)} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{c.cycle_id}</span>
                    <span className="font-semibold">{c.cycle_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.cycle_status === "Active" ? "bg-positive text-primary-foreground" : c.cycle_status === "Completed" ? "bg-secondary text-secondary-foreground" : "bg-negative text-destructive-foreground"}`}>{c.cycle_status}</span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{c.client?.name}</span>
                    <span>{c.provider?.name}</span>
                    <span>{formatCurrencyUnsigned(c.account_size)}</span>
                    <span>{formatDate(c.start_date)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">P&L</p>
                  <p className={`font-bold ${plColor(c.cycle_pl)}`}>{formatCurrency(c.cycle_pl)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
