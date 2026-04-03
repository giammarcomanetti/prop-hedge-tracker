import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Cycle, Phase, Payout, CycleWithCalculations, Client, Provider, FeeRefundPolicy } from "@/types";

interface DataContextType {
  cycles: Cycle[];
  phases: Phase[];
  payouts: Payout[];
  clients: Client[];
  providers: Provider[];
  addCycle: (c: Omit<Cycle, "id" | "cycle_id" | "end_date" | "cycle_status" | "broker_gain">) => string;
  updateCycle: (c: Cycle) => void;
  deleteCycle: (id: string) => void;
  addPhase: (p: Omit<Phase, "id">) => void;
  updatePhase: (p: Phase) => void;
  deletePhase: (id: string) => void;
  addPayout: (p: Omit<Payout, "id">) => void;
  addClient: (c: Omit<Client, "id">) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  addProvider: (p: Omit<Provider, "id">) => void;
  updateProvider: (p: Provider) => void;
  deleteProvider: (id: string) => void;
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

const DEFAULT_PROVIDERS: Provider[] = [
  { id: uid(), name: "FTMO", fee_refund_policy: "First payout", notes: "" },
  { id: uid(), name: "FundingPips", fee_refund_policy: "First payout", notes: "" },
  { id: uid(), name: "The5ers", fee_refund_policy: "Never", notes: "" },
  { id: uid(), name: "TCM", fee_refund_policy: "Never", notes: "" },
  { id: uid(), name: "FunderPro", fee_refund_policy: "Fourth payout", notes: "" },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [cycles, setCycles] = useState<Cycle[]>(() => loadFromLS("gpt_cycles_v2", []));
  const [phases, setPhases] = useState<Phase[]>(() => loadFromLS("gpt_phases_v2", []));
  const [payouts, setPayouts] = useState<Payout[]>(() => loadFromLS("gpt_payouts_v1", []));
  const [clients, setClients] = useState<Client[]>(() => loadFromLS("gpt_clients_v1", []));
  const [providers, setProviders] = useState<Provider[]>(() => loadFromLS("gpt_providers_v1", DEFAULT_PROVIDERS));

  useEffect(() => { localStorage.setItem("gpt_cycles_v2", JSON.stringify(cycles)); }, [cycles]);
  useEffect(() => { localStorage.setItem("gpt_phases_v2", JSON.stringify(phases)); }, [phases]);
  useEffect(() => { localStorage.setItem("gpt_payouts_v1", JSON.stringify(payouts)); }, [payouts]);
  useEffect(() => { localStorage.setItem("gpt_clients_v1", JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem("gpt_providers_v1", JSON.stringify(providers)); }, [providers]);

  const addCycle = (c: Omit<Cycle, "id" | "cycle_id" | "end_date" | "cycle_status" | "broker_gain">): string => {
    const id = uid();
    const nextId = cycles.length > 0 ? Math.max(...cycles.map(x => x.cycle_id)) + 1 : 1;
    const newCycle: Cycle = { ...c, id, cycle_id: nextId, end_date: "", cycle_status: "Active", broker_gain: 0 };
    setCycles(prev => [...prev, newCycle]);
    setPhases(prev => [...prev, { id: uid(), cycle_id: id, phase_type: "Phase 1", order: 1, status: "Active", broker_loss: 0 }]);
    return id;
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

  const addClient = (c: Omit<Client, "id">) => setClients(prev => [...prev, { ...c, id: uid() }]);
  const updateClient = (c: Client) => setClients(prev => prev.map(x => x.id === c.id ? c : x));
  const deleteClient = (id: string) => setClients(prev => prev.filter(x => x.id !== id));

  const addProvider = (p: Omit<Provider, "id">) => setProviders(prev => [...prev, { ...p, id: uid() }]);
  const updateProvider = (p: Provider) => setProviders(prev => prev.map(x => x.id === p.id ? p : x));
  const deleteProvider = (id: string) => setProviders(prev => prev.filter(x => x.id !== id));

  const getCycleWithCalcs = useCallback((cycleId: string): CycleWithCalculations | null => {
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return null;
    const cyclePhases = phases.filter(p => p.cycle_id === cycleId).sort((a, b) => a.order - b.order);
    const cyclePayouts = payouts.filter(p => p.cycle_id === cycleId);

    const totalBrokerLosses = cyclePhases
      .filter(p => p.status === "Pass" || (p.phase_type === "Funded Hedge" && p.status !== "Fail"))
      .reduce((sum, p) => sum + p.broker_loss, 0);
    const accumulated_costs = cycle.challenge_fee + totalBrokerLosses;

    const total_net_payouts = cyclePayouts.reduce((sum, p) => sum + p.net_amount, 0);
    const remaining_costs = accumulated_costs - total_net_payouts;
    const is_risk_free = remaining_costs <= 0;

    let cycle_pl = 0;
    if (cycle.cycle_status === "Completed") {
      if (cycle.broker_gain > 0) {
        cycle_pl = cycle.broker_gain - accumulated_costs;
      } else {
        cycle_pl = total_net_payouts - accumulated_costs;
      }
    }

    return { ...cycle, phases: cyclePhases, accumulated_costs, cycle_pl, total_net_payouts, remaining_costs, is_risk_free };
  }, [cycles, phases, payouts]);

  const getAllCyclesWithCalcs = useCallback(() => {
    return cycles.map(c => getCycleWithCalcs(c.id)!).filter(Boolean);
  }, [cycles, getCycleWithCalcs]);

  return (
    <DataContext.Provider value={{
      cycles, phases, payouts, clients, providers,
      addCycle, updateCycle, deleteCycle,
      addPhase, updatePhase, deletePhase,
      addPayout,
      addClient, updateClient, deleteClient,
      addProvider, updateProvider, deleteProvider,
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
