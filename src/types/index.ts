export type FeeRefundPolicy = "First payout" | "Second payout" | "Third payout" | "Fourth payout" | "Never";
export type CycleStatus = "Active" | "Completed";
export type PhaseType = "Phase 1" | "Phase 2" | "Funded Hedge";
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
  fee_refund_policy: FeeRefundPolicy;
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
  session_number?: number; // for Funded Hedge sessions
}

export interface CycleWithCalculations extends Cycle {
  phases: Phase[];
  accumulated_costs: number; // challenge_fee (if not refunded) + sum of broker losses from passed phases
  fee_refunded: boolean; // whether the challenge fee has been refunded based on payout count
  cycle_pl: number;
  total_net_payouts: number;
  remaining_costs: number;
  is_risk_free: boolean;
}

export interface Payout {
  id: string;
  cycle_id: string;
  phase_id: string; // linked to the funded hedge session
  payout_number: number;
  gross_amount: number;
  profit_split_pct: number;
  net_amount: number;
  date: string;
  notes: string;
}
