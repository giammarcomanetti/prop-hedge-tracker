import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Cycle, Phase, CycleWithCalculations } from "@/types";

interface DataContextType {
  cycles: Cycle[];
  phases: Phase[];
  addCycle: (c: Omit<Cycle, "id" | "cycle_id" | "end_date" | "cycle_status" | "broker_gain">) => string;
  updateCycle: (c: Cycle) => void;
  deleteCycle: (id: string) => void;
  addPhase: (p: Omit<Phase, "id">) => void;
  updatePhase: (p: Phase) => void;
  deletePhase: (id: string) => void;
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

export function DataProvider({ children }: { children: ReactNode }) {
  const [cycles, setCycles] = useState<Cycle[]>(() => loadFromLS("gpt_cycles_v2", []));
  const [phases, setPhases] = useState<Phase[]>(() => loadFromLS("gpt_phases_v2", []));

  useEffect(() => { localStorage.setItem("gpt_cycles_v2", JSON.stringify(cycles)); }, [cycles]);
  useEffect(() => { localStorage.setItem("gpt_phases_v2", JSON.stringify(phases)); }, [phases]);

  const addCycle = (c: Omit<Cycle, "id" | "cycle_id" | "end_date" | "cycle_status" | "broker_gain">): string => {
    const id = uid();
    const nextId = cycles.length > 0 ? Math.max(...cycles.map(x => x.cycle_id)) + 1 : 1;
    const newCycle: Cycle = { ...c, id, cycle_id: nextId, end_date: "", cycle_status: "Active", broker_gain: 0 };
    setCycles(prev => [...prev, newCycle]);
    // Auto-create Phase 1
    setPhases(prev => [...prev, { id: uid(), cycle_id: id, phase_type: "Phase 1", order: 1, status: "Active", broker_loss: 0 }]);
    return id;
  };

  const updateCycle = (c: Cycle) => setCycles(prev => prev.map(x => x.id === c.id ? c : x));
  const deleteCycle = (id: string) => {
    setCycles(prev => prev.filter(x => x.id !== id));
    setPhases(prev => prev.filter(x => x.cycle_id !== id));
  };

  const addPhase = (p: Omit<Phase, "id">) => setPhases(prev => [...prev, { ...p, id: uid() }]);
  const updatePhase = (p: Phase) => setPhases(prev => prev.map(x => x.id === p.id ? p : x));
  const deletePhase = (id: string) => setPhases(prev => prev.filter(x => x.id !== id));

  const getCycleWithCalcs = useCallback((cycleId: string): CycleWithCalculations | null => {
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return null;
    const cyclePhases = phases.filter(p => p.cycle_id === cycleId).sort((a, b) => a.order - b.order);
    const totalBrokerLosses = cyclePhases.filter(p => p.status === "Pass").reduce((sum, p) => sum + p.broker_loss, 0);
    const accumulated_costs = cycle.challenge_fee + totalBrokerLosses;
    
    let cycle_pl = 0;
    if (cycle.cycle_status === "Completed") {
      // If completed via "prop blown", pl = broker_gain - challenge_fee
      if (cycle.broker_gain > 0) {
        cycle_pl = cycle.broker_gain - cycle.challenge_fee;
      } else {
        cycle_pl = -accumulated_costs;
      }
    }

    return { ...cycle, phases: cyclePhases, accumulated_costs, cycle_pl };
  }, [cycles, phases]);

  const getAllCyclesWithCalcs = useCallback(() => {
    return cycles.map(c => getCycleWithCalcs(c.id)!).filter(Boolean);
  }, [cycles, getCycleWithCalcs]);

  return (
    <DataContext.Provider value={{
      cycles, phases,
      addCycle, updateCycle, deleteCycle,
      addPhase, updatePhase, deletePhase,
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
