export type FeeRefundPolicy = "First payout" | "Third payout" | "Fourth payout" | "Never";
export type CycleStatus = "Active" | "Completed";
export type PhaseType = "Phase 1" | "Phase 2";
export type PhaseStatus = "Active" | "Pass" | "Fail";

export interface Provider {
  id: string;
  name: string;
  fee_refund_policy: FeeRefundPolicy;
  notes: string;
}

export interface Client {
  id: string;
  name: string;
  notes: string;
}

export interface Cycle {
  id: string;
  cycle_id: number;
  client_name: string;
  prop_firm: string;
  account_size: number;
  challenge_fee: number;
  start_date: string;
  end_date: string;
  cycle_status: CycleStatus;
  broker_gain: number; // only set when prop blown
}

export interface Phase {
  id: string;
  cycle_id: string;
  phase_type: PhaseType;
  order: number;
  status: PhaseStatus;
  broker_loss: number; // loss on broker when phase passed
}

export interface CycleWithCalculations extends Cycle {
  phases: Phase[];
  accumulated_costs: number; // challenge_fee + sum of broker losses from passed phases
  cycle_pl: number;
}

export interface Payout {
  id: string;
  cycle_id: string;
  payout_number: number;
  amount: number;
  date: string;
  includes_fee_refund: boolean;
  fee_refund_amount: number;
  notes: string;
}
