import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Provider, Client, Cycle, Phase, Payout, CycleWithCalculations, FeeRefundPolicy } from "@/types";

interface DataContextType {
  providers: Provider[];
  clients: Client[];
  cycles: Cycle[];
  phases: Phase[];
  payouts: Payout[];
  addProvider: (p: Omit<Provider, "id">) => void;
  updateProvider: (p: Provider) => void;
  deleteProvider: (id: string) => void;
  addClient: (c: Omit<Client, "id">) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  addCycle: (c: Omit<Cycle, "id" | "cycle_id">) => void;
  updateCycle: (c: Cycle) => void;
  deleteCycle: (id: string) => void;
  addPhase: (p: Omit<Phase, "id">) => void;
  updatePhase: (p: Phase) => void;
  deletePhase: (id: string) => void;
  addPayout: (p: Omit<Payout, "id">) => void;
  updatePayout: (p: Payout) => void;
  deletePayout: (id: string) => void;
  getCycleWithCalcs: (cycleId: string) => CycleWithCalculations | null;
  getAllCyclesWithCalcs: () => CycleWithCalculations[];
}

const DataContext = createContext<DataContextType | null>(null);

const uid = () => crypto.randomUUID();

function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function getPayoutNumberForBreakEven(
  payouts: Payout[],
  challengeFee: number,
  totalRealBrokerLosses: number,
  feeRefunded: boolean
): number | null {
  const sorted = [...payouts].sort((a, b) => a.payout_number - b.payout_number);
  let cumulative = 0;
  const target = (feeRefunded ? 0 : challengeFee) + totalRealBrokerLosses;
  for (const p of sorted) {
    cumulative += p.amount;
    if (cumulative >= target) return p.payout_number;
  }
  return null;
}

function isFeeRefunded(policy: FeeRefundPolicy, payoutCount: number): boolean {
  switch (policy) {
    case "First payout": return payoutCount >= 1;
    case "Third payout": return payoutCount >= 3;
    case "Fourth payout": return payoutCount >= 4;
    case "Never": return false;
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<Provider[]>(() => loadFromLS("gpt_providers", []));
  const [clients, setClients] = useState<Client[]>(() => loadFromLS("gpt_clients", []));
  const [cycles, setCycles] = useState<Cycle[]>(() => loadFromLS("gpt_cycles", []));
  const [phases, setPhases] = useState<Phase[]>(() => loadFromLS("gpt_phases", []));
  const [payouts, setPayouts] = useState<Payout[]>(() => loadFromLS("gpt_payouts", []));

  useEffect(() => { localStorage.setItem("gpt_providers", JSON.stringify(providers)); }, [providers]);
  useEffect(() => { localStorage.setItem("gpt_clients", JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem("gpt_cycles", JSON.stringify(cycles)); }, [cycles]);
  useEffect(() => { localStorage.setItem("gpt_phases", JSON.stringify(phases)); }, [phases]);
  useEffect(() => { localStorage.setItem("gpt_payouts", JSON.stringify(payouts)); }, [payouts]);

  const addProvider = (p: Omit<Provider, "id">) => setProviders(prev => [...prev, { ...p, id: uid() }]);
  const updateProvider = (p: Provider) => setProviders(prev => prev.map(x => x.id === p.id ? p : x));
  const deleteProvider = (id: string) => setProviders(prev => prev.filter(x => x.id !== id));

  const addClient = (c: Omit<Client, "id">) => setClients(prev => [...prev, { ...c, id: uid() }]);
  const updateClient = (c: Client) => setClients(prev => prev.map(x => x.id === c.id ? c : x));
  const deleteClient = (id: string) => setClients(prev => prev.filter(x => x.id !== id));

  const addCycle = (c: Omit<Cycle, "id" | "cycle_id">) => {
    const nextId = cycles.length > 0 ? Math.max(...cycles.map(x => x.cycle_id)) + 1 : 1;
    setCycles(prev => [...prev, { ...c, id: uid(), cycle_id: nextId }]);
  };
  const updateCycle = (c: Cycle) => setCycles(prev => prev.map(x => x.id === c.id ? c : x));
  const deleteCycle = (id: string) => {
    setCycles(prev => prev.filter(x => x.id !== id));
    setPhases(prev => prev.filter(x => x.cycle_id !== id));
    setPayouts(prev => prev.filter(x => x.cycle_id !== id));
  };

  const addPhase = (p: Omit<Phase, "id">) => setPhases(prev => [...prev, { ...p, id: uid() }]);
  const updatePhase = (p: Phase) => setPhases(prev => prev.map(x => x.id === p.id ? p : x));
  const deletePhase = (id: string) => setPhases(prev => prev.filter(x => x.id !== id));

  const addPayout = (p: Omit<Payout, "id">) => setPayouts(prev => [...prev, { ...p, id: uid() }]);
  const updatePayout = (p: Payout) => setPayouts(prev => prev.map(x => x.id === p.id ? p : x));
  const deletePayout = (id: string) => setPayouts(prev => prev.filter(x => x.id !== id));

  const getCycleWithCalcs = useCallback((cycleId: string): CycleWithCalculations | null => {
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return null;
    const cyclePhases = phases.filter(p => p.cycle_id === cycleId).sort((a, b) => a.order - b.order);
    const cyclePayouts = payouts.filter(p => p.cycle_id === cycleId).sort((a, b) => a.payout_number - b.payout_number);
    const client = clients.find(c => c.id === cycle.client_id);
    const provider = providers.find(p => p.id === cycle.provider_id);

    const total_real_broker_losses = cyclePhases.reduce((sum, p) => sum + Math.max(0, -p.broker_pl_phase), 0);
    const total_bonus_lost = cyclePhases.reduce((sum, p) => sum + p.bonus_lost_phase, 0);
    const total_bonus_used = cyclePhases.reduce((sum, p) => sum + p.bonus_used, 0);
    const total_payouts_received = cyclePayouts.reduce((sum, p) => sum + p.amount, 0);
    const total_fee_refunds = cyclePayouts.reduce((sum, p) => sum + p.fee_refund_amount, 0);
    const fee_refunded = provider ? isFeeRefunded(provider.fee_refund_policy, cyclePayouts.length) : false;

    const cycle_pl = total_payouts_received + total_fee_refunds - (fee_refunded ? 0 : cycle.challenge_fee) - total_real_broker_losses;
    const break_even_target = (fee_refunded ? 0 : cycle.challenge_fee) + total_real_broker_losses;
    const break_even_reached = total_payouts_received >= break_even_target;
    const payout_at_break_even = getPayoutNumberForBreakEven(cyclePayouts, cycle.challenge_fee, total_real_broker_losses, fee_refunded);

    let duration_days: number | null = null;
    if (cycle.start_date && cycle.end_date) {
      duration_days = Math.round((new Date(cycle.end_date).getTime() - new Date(cycle.start_date).getTime()) / 86400000);
    }

    const distance_to_break_even = Math.max(0, break_even_target - total_payouts_received);

    return {
      ...cycle, phases: cyclePhases, payouts: cyclePayouts, client, provider,
      total_real_broker_losses, total_bonus_lost, total_bonus_used, total_payouts_received, total_fee_refunds,
      fee_refunded, break_even_reached, payout_at_break_even, cycle_pl, duration_days, distance_to_break_even,
    };
  }, [cycles, phases, payouts, clients, providers]);

  const getAllCyclesWithCalcs = useCallback(() => {
    return cycles.map(c => getCycleWithCalcs(c.id)!).filter(Boolean);
  }, [cycles, getCycleWithCalcs]);

  return (
    <DataContext.Provider value={{
      providers, clients, cycles, phases, payouts,
      addProvider, updateProvider, deleteProvider,
      addClient, updateClient, deleteClient,
      addCycle, updateCycle, deleteCycle,
      addPhase, updatePhase, deletePhase,
      addPayout, updatePayout, deletePayout,
      getCycleWithCalcs, getAllCyclesWithCalcs,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
