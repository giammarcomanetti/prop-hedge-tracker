import { useState } from "react";
import { useData } from "@/context/DataContext";
import { Client, Provider, FeeRefundPolicy } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

const FEE_POLICIES: FeeRefundPolicy[] = ["First payout", "Third payout", "Fourth payout", "Never"];

export default function SettingsPage() {
  const { clients, providers, addClient, updateClient, deleteClient, addProvider, updateProvider, deleteProvider } = useData();

  // Client dialog state
  const [clientOpen, setClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientNotes, setClientNotes] = useState("");

  // Provider dialog state
  const [providerOpen, setProviderOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [providerName, setProviderName] = useState("");
  const [providerPolicy, setProviderPolicy] = useState<FeeRefundPolicy>("First payout");
  const [providerNotes, setProviderNotes] = useState("");

  const openClientDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setClientName(client.name);
      setClientNotes(client.notes);
    } else {
      setEditingClient(null);
      setClientName("");
      setClientNotes("");
    }
    setClientOpen(true);
  };

  const handleSaveClient = () => {
    if (!clientName.trim()) return;
    if (editingClient) {
      updateClient({ ...editingClient, name: clientName.trim(), notes: clientNotes.trim() });
    } else {
      addClient({ name: clientName.trim(), notes: clientNotes.trim() });
    }
    setClientOpen(false);
  };

  const openProviderDialog = (provider?: Provider) => {
    if (provider) {
      setEditingProvider(provider);
      setProviderName(provider.name);
      setProviderPolicy(provider.fee_refund_policy);
      setProviderNotes(provider.notes);
    } else {
      setEditingProvider(null);
      setProviderName("");
      setProviderPolicy("First payout");
      setProviderNotes("");
    }
    setProviderOpen(true);
  };

  const handleSaveProvider = () => {
    if (!providerName.trim()) return;
    if (editingProvider) {
      updateProvider({ ...editingProvider, name: providerName.trim(), fee_refund_policy: providerPolicy, notes: providerNotes.trim() });
    } else {
      addProvider({ name: providerName.trim(), fee_refund_policy: providerPolicy, notes: providerNotes.trim() });
    }
    setProviderOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* Providers Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Providers</CardTitle>
          <Button size="sm" onClick={() => openProviderDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Provider
          </Button>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No providers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Fee Refund Policy</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline">{p.fee_refund_policy}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{p.notes || "—"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openProviderDialog(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteProvider(p.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Clients Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clients</CardTitle>
          <Button size="sm" onClick={() => openClientDialog()}>
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No clients yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{c.notes || "—"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openClientDialog(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteClient(c.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Provider Dialog */}
      <Dialog open={providerOpen} onOpenChange={setProviderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProvider ? "Edit Provider" : "Add Provider"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Provider Name</Label>
              <Input value={providerName} onChange={e => setProviderName(e.target.value)} placeholder="e.g. FTMO" />
            </div>
            <div>
              <Label>Fee Refund Policy</Label>
              <Select value={providerPolicy} onValueChange={v => setProviderPolicy(v as FeeRefundPolicy)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FEE_POLICIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={providerNotes} onChange={e => setProviderNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProvider} disabled={!providerName.trim()}>
              {editingProvider ? "Save Changes" : "Add Provider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Dialog */}
      <Dialog open={clientOpen} onOpenChange={setClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "Add Client"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client Name</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={clientNotes} onChange={e => setClientNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveClient} disabled={!clientName.trim()}>
              {editingClient ? "Save Changes" : "Add Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
