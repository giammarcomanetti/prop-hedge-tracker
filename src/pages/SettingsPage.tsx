import { useState } from "react";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { FeeRefundPolicy } from "@/types";

export default function SettingsPage() {
  const { providers, clients, addProvider, deleteProvider, addClient, deleteClient } = useData();

  const [provForm, setProvForm] = useState({ name: "", fee_refund_policy: "First payout" as FeeRefundPolicy, notes: "" });
  const [clientForm, setClientForm] = useState({ name: "", notes: "" });

  const handleAddProv = () => {
    if (!provForm.name) return;
    addProvider(provForm);
    setProvForm({ name: "", fee_refund_policy: "First payout", notes: "" });
  };

  const handleAddClient = () => {
    if (!clientForm.name) return;
    addClient(clientForm);
    setClientForm({ name: "", notes: "" });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage providers and clients</p>
      </div>

      {/* Providers */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold mb-4">Providers</h2>
        <div className="flex gap-3 mb-4 items-end">
          <div className="flex-1"><Label>Name</Label><Input value={provForm.name} onChange={e => setProvForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. FTMO" /></div>
          <div className="w-48"><Label>Fee Refund Policy</Label>
            <Select value={provForm.fee_refund_policy} onValueChange={v => setProvForm(p => ({ ...p, fee_refund_policy: v as FeeRefundPolicy }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="First payout">First payout</SelectItem><SelectItem value="Third payout">Third payout</SelectItem><SelectItem value="Fourth payout">Fourth payout</SelectItem><SelectItem value="Never">Never</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex-1"><Label>Notes</Label><Input value={provForm.notes} onChange={e => setProvForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <Button onClick={handleAddProv} size="sm"><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="space-y-2">
          {providers.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-4">
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.fee_refund_policy}</span>
                {p.notes && <span className="text-xs text-muted-foreground">· {p.notes}</span>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => deleteProvider(p.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </div>

      {/* Clients */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold mb-4">Clients</h2>
        <div className="flex gap-3 mb-4 items-end">
          <div className="flex-1"><Label>Name</Label><Input value={clientForm.name} onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Giammarco Manetti" /></div>
          <div className="flex-1"><Label>Notes</Label><Input value={clientForm.notes} onChange={e => setClientForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <Button onClick={handleAddClient} size="sm"><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="space-y-2">
          {clients.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-2.5">
              <div className="flex items-center gap-4">
                <span className="font-medium">{c.name}</span>
                {c.notes && <span className="text-xs text-muted-foreground">· {c.notes}</span>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => deleteClient(c.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
