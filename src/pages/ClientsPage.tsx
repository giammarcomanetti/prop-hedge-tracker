import { useState } from "react";
import { useData } from "@/context/DataContext";
import { Client } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export default function ClientsPage() {
  const { clients, addClient, getAllCyclesWithCalcs } = useData();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const allCycles = getAllCyclesWithCalcs();

  const clientStats = clients.map(client => {
    const clientCycles = allCycles.filter(c => c.client_name === client.name);
    const totalPL = clientCycles.reduce((sum, c) => sum + c.cycle_pl, 0);
    const totalFees = clientCycles.reduce((sum, c) => sum + c.challenge_fee, 0);
    return { ...client, totalCycles: clientCycles.length, totalPL, totalFees };
  });

  const handleAdd = () => {
    if (!name.trim()) return;
    addClient({ name: name.trim(), notes: notes.trim() });
    setName("");
    setNotes("");
    setOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </div>

      {clientStats.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-40" />
            <p>No clients yet. Add your first client to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Total Cycles</TableHead>
                  <TableHead className="text-right">Total Fees Paid</TableHead>
                  <TableHead className="text-right">Total P&L</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientStats.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right">{c.totalCycles}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.totalFees)}</TableCell>
                    <TableCell className={`text-right font-semibold ${c.totalPL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatCurrency(c.totalPL)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{c.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Client Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!name.trim()}>Add Client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
